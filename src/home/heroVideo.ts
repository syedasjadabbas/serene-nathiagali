// The hero film as a real H.264 stream, decoded by the graphics chip through WebCodecs. Unpacking
// 386 separate images kept two or three CPU cores busy during a scroll; hardware decoding costs
// next to nothing, and the file is half the size. Frames are fed a few at a time as the scroll
// needs them (a whole group at once swamps the GPU) and copied to bitmaps, because a hardware
// decoder has only a small pool of frames and stalls if they are held on to.
// The file is fetched in keyframe groups, those nearest the scroll position first: on a real
// connection a visitor out-scrolls a start-to-end download, and the picture would stick.
// Returns null where WebCodecs can't play it.

export type HeroFilm = {
  gop: number
  /** Resolves once the first frame is on hand. */
  ready: Promise<void>
  /** Resolves once the whole film has downloaded. */
  complete: Promise<void>
  /** Fetch and decode whatever this scroll position needs. */
  seek: (center: number, direction: number) => void
  received: () => number
  close: () => void
}

type Hooks = {
  /** The frames the page wants right now, lowest first, as a range. */
  range: () => [number, number]
  needed: (i: number) => boolean
  onFrame: (i: number, frame: ImageBitmap) => void
  onFail: () => void
}

const FRAME_US = 33333 // timestamps only identify frames; playback timing comes from the scroll
const IN_FLIGHT = 4
const FETCHES = 2 // groups downloading at once

export async function openFilm(base: string, hooks: Hooks): Promise<HeroFilm | null> {
  if (!('VideoDecoder' in window)) return null
  const meta: { codec: string; gop: number; sizes: number[] } = await fetch(`${base}.json`).then((r) => r.json())
  const config: VideoDecoderConfig = { codec: meta.codec, hardwareAcceleration: 'prefer-hardware', optimizeForLatency: true }
  if (!(await VideoDecoder.isConfigSupported(config)).supported) return null

  const count = meta.sizes.length
  const offsets = new Array<number>(count + 1).fill(0)
  meta.sizes.forEach((s, i) => { offsets[i + 1] = offsets[i] + s })
  const data = new Uint8Array(offsets[count])
  const groups = Math.ceil(count / meta.gop)
  const loaded = new Array<boolean>(groups).fill(false)
  const fetching = new Set<number>()
  let center = 0, direction = 1, next = 0, running = false, closed = false, failed = false, wake = () => {}
  const fed = new Set<number>() // sent to the decoder, bitmap not back yet
  let firstFrame = () => {}, giveUp = (_: Error) => {}, allIn = () => {}
  const complete = new Promise<void>((resolve) => { allIn = resolve })
  const ready = new Promise<void>((resolve, reject) => {
    firstFrame = resolve
    giveUp = reject
    // a decoder that never answers must not hold up the page
    setTimeout(() => reject(new Error('film timed out')), 8000)
  })

  const fail = () => {
    if (failed || closed) return
    failed = true
    giveUp(new Error('film failed'))
    hooks.onFail()
  }
  const settled = (i: number) => { fed.delete(i); wake() }
  const decoder = new VideoDecoder({
    output: (frame) => {
      const i = Math.round(frame.timestamp / FRAME_US)
      if (closed || !hooks.needed(i)) { frame.close(); settled(i); return }
      createImageBitmap(frame)
        .then((bm) => { hooks.onFrame(i, bm); firstFrame() })
        .catch(() => {})
        .finally(() => { frame.close(); settled(i) })
    },
    error: fail,
  })
  decoder.configure(config)

  const firstNeeded = () => {
    const [lo, hi] = hooks.range()
    for (let i = lo; i <= hi; i++) if (loaded[Math.floor(i / meta.gop)] && !fed.has(i) && hooks.needed(i)) return i
    return -1
  }
  const pump = async () => {
    if (running) return
    running = true
    try {
      for (;;) {
        const want = firstNeeded()
        if (want < 0 || closed || failed) break
        // carry on from where the decoder is if that reaches the frame; otherwise back to its group's keyframe
        if (want < next || want - next >= meta.gop) next = Math.floor(want / meta.gop) * meta.gop
        while (fed.size >= IN_FLIGHT) {
          // if a decoder runs dry of frames it stalls: fall back rather than freeze
          await Promise.race([
            new Promise<void>((r) => { wake = r }),
            new Promise((_, no) => setTimeout(() => no(new Error('decoder stalled')), 4000)),
          ])
        }
        const i = next++
        fed.add(i)
        decoder.decode(new EncodedVideoChunk({
          type: i % meta.gop === 0 ? 'key' : 'delta',
          timestamp: i * FRAME_US,
          data: data.subarray(offsets[i], offsets[i + 1]),
        }))
      }
    } catch { fail() }
    running = false
  }

  const lastOf = (g: number) => Math.min(count, (g + 1) * meta.gop) - 1
  const nextToFetch = () => {
    const from = Math.floor(center / meta.gop)
    for (let d = 0; d < groups; d++) {
      for (const g of [from + d * direction, from - d * direction]) {
        if (g >= 0 && g < groups && !loaded[g] && !fetching.has(g)) return g
      }
    }
    return -1
  }
  const fetchGroup = async (g: number) => {
    const from = offsets[g * meta.gop], to = offsets[lastOf(g) + 1]
    const res = await fetch(`${base}.h264`, { headers: { Range: `bytes=${from}-${to - 1}` } })
    if (!res.ok) throw new Error('film unavailable')
    const bytes = new Uint8Array(await res.arrayBuffer())
    if (closed) return
    if (res.status === 206) {
      data.set(bytes, from)
      loaded[g] = true
    } else {
      // a server that ignores ranges sends the whole file
      data.set(bytes)
      loaded.fill(true)
    }
  }
  const fill = () => {
    while (fetching.size < FETCHES && !closed && !failed) {
      const g = nextToFetch()
      if (g < 0) return
      fetching.add(g)
      fetchGroup(g)
        .then(() => {
          fetching.delete(g)
          if (loaded.every(Boolean)) allIn()
          void pump()
          fill()
        })
        .catch(fail)
    }
  }
  fill()

  return {
    gop: meta.gop,
    ready,
    complete,
    seek: (c, d) => { center = c; direction = d; fill(); void pump() },
    received: () => loaded.filter(Boolean).length * meta.gop,
    close: () => {
      closed = true
      if (decoder.state !== 'closed') decoder.close()
    },
  }
}
