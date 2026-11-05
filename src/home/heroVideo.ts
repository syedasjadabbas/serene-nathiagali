// The hero film as a real H.264 stream, decoded by the graphics chip through WebCodecs. Unpacking
// 386 separate images kept two or three CPU cores busy during a scroll; hardware decoding costs
// next to nothing, and the file is half the size. Frames are fed a few at a time as the scroll
// needs them (a whole group at once swamps the GPU) and copied to bitmaps, because a hardware
// decoder has only a small pool of frames and stalls if they are held on to.
// Returns null where WebCodecs can't play it.

export type HeroFilm = {
  gop: number
  /** Resolves once the first frame is on hand. */
  ready: Promise<void>
  /** Decode whatever the current scroll position needs. */
  seek: () => void
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

export async function openFilm(base: string, hooks: Hooks): Promise<HeroFilm | null> {
  if (!('VideoDecoder' in window)) return null
  const meta: { codec: string; gop: number; sizes: number[] } = await fetch(`${base}.json`).then((r) => r.json())
  const config: VideoDecoderConfig = { codec: meta.codec, hardwareAcceleration: 'prefer-hardware', optimizeForLatency: true }
  if (!(await VideoDecoder.isConfigSupported(config)).supported) return null

  const count = meta.sizes.length
  const offsets = new Array<number>(count + 1).fill(0)
  meta.sizes.forEach((s, i) => { offsets[i + 1] = offsets[i] + s })
  const data = new Uint8Array(offsets[count])
  let got = 0, next = 0, running = false, closed = false, failed = false, wake = () => {}
  const fed = new Set<number>() // sent to the decoder, bitmap not back yet
  let firstFrame = () => {}, giveUp = (_: Error) => {}
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
    for (let i = lo; i <= hi; i++) if (!fed.has(i) && hooks.needed(i)) return i
    return -1
  }
  const pump = async () => {
    if (running) return
    running = true
    try {
      for (;;) {
        const want = firstNeeded()
        if (want < 0 || closed || failed || offsets[want + 1] > got) break
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

  const download = async () => {
    const res = await fetch(`${base}.h264`)
    if (!res.ok || !res.body) throw new Error('film unavailable')
    const reader = res.body.getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done || closed) return
      data.set(value, got)
      got += value.length
      void pump()
    }
  }
  download().catch(fail)

  return {
    gop: meta.gop,
    ready,
    seek: () => { void pump() },
    received: () => offsets.findIndex((o) => o > got),
    close: () => {
      closed = true
      if (decoder.state !== 'closed') decoder.close()
    },
  }
}
