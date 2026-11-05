import { gsap, ScrollTrigger, lenis, jumpTo, reducedMotion } from '../lib/scroll'
import { openFilm, type HeroFilm } from './heroVideo'
import { revealPage } from '../lib/router'
import { preload3D } from '../three/preload'

// Homepage: loader → push through the logo → scroll-driven hero fly-over (canvas frame sequence) → pinned tour.
// Runs inside the page's GSAP context; returns a cleanup for non-GSAP resources.

let loaderPlayed = false // the loader plays once per visit; coming back to Home skips it

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode) => root.querySelector<T>(sel)
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode) => [...root.querySelectorAll<T>(sel)]

function waitForImages(imgs: (HTMLImageElement | null)[], onProgress: (p: number) => void) {
  const list = imgs.filter(Boolean) as HTMLImageElement[]
  let done = 0
  return Promise.all(list.map((img) => new Promise<void>((resolve) => {
    const finish = () => { done++; onProgress(done / list.length); resolve() }
    if (img.complete) finish()
    else { img.addEventListener('load', finish, { once: true }); img.addEventListener('error', finish, { once: true }) }
  })))
}

// 1x1 AVIF probe: resolves true when the browser can decode AVIF
function supportsAvif() {
  return new Promise<boolean>((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img.width > 0)
    img.onerror = () => resolve(false)
    img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A='
  })
}

export function homeSetup(root: HTMLElement) {
  let alive = true
  const body = document.body
  const curtain = document.querySelector<HTMLElement>('.curtain')

  /* ---------- hero intro ---------- */
  const titleLines = $$('.hero__title .line > span', root)
  gsap.set(titleLines, { yPercent: 110 })
  const bar = $('.hero__bar', root)
  const introHero = (instant = false) => {
    const d = instant ? 0 : 1
    gsap.timeline()
      .to($$('.hero__canvas', root), { scale: 1, duration: 2.4 * d, ease: 'expo.out' })
      .to(titleLines, { yPercent: 0, duration: 1.3 * d, stagger: 0.12, ease: 'expo.out' }, 0.15 * d)
      .to($$('.hero .reveal-up', root), { opacity: 1, y: 0, duration: 1 * d, stagger: 0.1, ease: 'power3.out' }, 0.5 * d)
      // the rule draws in from the left, then the facts rise in turn
      .fromTo(bar, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4 * d, ease: 'expo.inOut' }, 0.55 * d)
      .from($$('.hero__bar > *', root), { opacity: 0, y: 18, duration: 0.9 * d, stagger: 0.1, ease: 'power3.out' }, 0.8 * d)
      .from(document.querySelector('.header'), { opacity: 0, y: -20, duration: 0.8 * d, ease: 'power3.out' }, 0.4 * d)
  }

  /* ---------- hero: canvas frame sequence ---------- */
  // The hero film: three drone shots from the project's 3D animation (forest approach,
  // ski-slope glide, rooftop crown), cut with dissolves from the 1080p masters, colour graded,
  // lightly denoised over time so the foliage doesn't shimmer. It plays as hardware-decoded video
  // in two tiers (see heroVideo.ts): a 2.7 MB version of the whole film comes first, so every
  // scroll position has a picture even on a slow connection, then sharp frames (1080p on big
  // screens, 720p otherwise) replace it as they arrive. Browsers that can't use image frames.
  // pick by the pixels the cover-fit needs (portrait phones crop the middle of a wide frame)
  const neededWidth = Math.max(window.innerWidth, window.innerHeight * 16 / 9) * Math.min(window.devicePixelRatio || 1, 2)
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
  const frameSet = saveData || neededWidth < 900 ? 'sm' : neededWidth < 1500 || window.matchMedia('(pointer: coarse)').matches ? 'lg' : 'hd'
  const FRAME_W = { sm: 854, lg: 1280, hd: 1920 }[frameSet]
  const FRAME_COUNT = frameSet === 'sm' ? 193 : 386
  const framesDir = frameSet === 'sm' ? 'sm' : 'lg30'
  // AVIF where the browser decodes it (about half the size of WebP), WebP otherwise
  let frameSrc = (i: number) => `/assets/hero5/${framesDir}/${String(i + 1).padStart(3, '0')}.avif`
  const avifReady = supportsAvif().then((ok) => {
    // the WebP fallback is the 15 fps set
    if (!ok) frameSrc = (i: number) => `/assets/hero5/webp/${String(Math.floor(i * 193 / FRAME_COUNT) + 1).padStart(3, '0')}.webp`
  })
  const canvas = $<HTMLCanvasElement>('.hero__canvas', root)!
  const ctx2d = canvas.getContext('2d', { alpha: false })!

  // compressed frames are kept as blobs; only a window around the current position is decoded
  // (off the main thread) into bitmaps, so drawing never stalls and memory stays bounded
  const blobs: (Blob | undefined)[] = new Array(FRAME_COUNT)
  const bitmaps = new Map<number, ImageBitmap>()
  const decoding = new Set<number>()
  let film: HeroFilm | null = null
  // the sharp tier: frames here win over the small film's frames in `bitmaps`
  const sharp = new Map<number, ImageBitmap>()
  let sharpFilm: HeroFilm | null = null
  // decode further ahead in the direction of travel than behind it
  // a decoded frame is 3.7 MB at 720p and 8 MB at 1080p, so the window stays under 300 MB
  const AHEAD = frameSet === 'hd' ? 28 : 40
  const BEHIND = frameSet === 'hd' ? 7 : 12
  let wanted = 0 // fractional frame position from the scroll, e.g. 41.37
  let direction = 1
  let drawnKey = ''
  let drawQueued = false

  const sizeCanvas = () => {
    const coverCssWidth = Math.max(canvas.clientWidth, canvas.clientHeight * 16 / 9)
    const k = Math.min(window.devicePixelRatio || 1, 2, FRAME_W / coverCssWidth)
    canvas.width = Math.round(canvas.clientWidth * k)
    canvas.height = Math.round(canvas.clientHeight * k)
    drawnKey = ''
    requestDraw(wanted)
  }
  // the frames to keep around a position: [lowest, highest]. Video can only be decoded forward from a
  // keyframe, so going backward the window reaches down to one, or every step would decode a group again.
  const windowAt = (center: number): [number, number] => {
    const lo = direction >= 0 ? center - BEHIND - 2 : center - AHEAD - 2
    const hi = direction >= 0 ? center + AHEAD + 2 : center + BEHIND + 2
    const from = film && direction < 0 ? Math.floor(lo / film.gop) * film.gop : lo
    return [Math.max(0, from), Math.min(FRAME_COUNT - 1, hi)]
  }
  const inWindow = (i: number, center: number) => {
    const [lo, hi] = windowAt(center)
    return i >= lo && i <= hi
  }
  const decodeAround = (center: number) => {
    if (film) {
      film.seek(center, direction)
      sharpFilm?.seek(center, direction)
      for (const set of [bitmaps, sharp]) set.forEach((bm, i) => { if (!inWindow(i, center)) { bm.close(); set.delete(i) } })
      return
    }
    // nearest first, alternating forward and back, reaching further forward
    for (let d = 0; d <= AHEAD; d++) {
      const order = direction >= 0 ? [center + d, center - d] : [center - d, center + d]
      order.forEach((i, k) => {
        if (k === 1 && d > BEHIND) return
        const blob = blobs[i]
        if (i < 0 || i >= FRAME_COUNT || !blob || bitmaps.has(i) || decoding.has(i)) return
        decoding.add(i)
        createImageBitmap(blob).then((bm) => {
          decoding.delete(i)
          if (!alive || !inWindow(i, Math.floor(wanted))) { bm.close(); return }
          bitmaps.set(i, bm)
          if (Math.abs(i - wanted) < 2.5 || !drawnKey) requestDraw(wanted)
        }).catch(() => decoding.delete(i))
      })
    }
    bitmaps.forEach((bm, i) => { if (!inWindow(i, center)) { bm.close(); bitmaps.delete(i) } })
  }
  const nearest = (i: number) => {
    for (let d = 0; d < FRAME_COUNT; d++) {
      if (bitmaps.has(i - d) || sharp.has(i - d)) return i - d
      if (bitmaps.has(i + d) || sharp.has(i + d)) return i + d
    }
    return -1
  }
  const drawCover = (bm: ImageBitmap) => {
    const cw = canvas.width, ch = canvas.height
    const scale = Math.max(cw / bm.width, ch / bm.height)
    const w = bm.width * scale, h = bm.height * scale
    // wide screens lose height: trim the bottom, as the tower stands at the top of the footage
    ctx2d.drawImage(bm, (cw - w) / 2, 0, w, h)
  }
  // Draws the frame under the scroll position. The 15 fps set adds a short dissolve into the next
  // frame around the halfway point to soften its steps; at 30 fps the steps are small enough
  // that one clean frame is smoother, as it sends the GPU half the image data.
  const paint = () => {
    const smooth30 = FRAME_COUNT > 193
    const i0 = smooth30 ? Math.round(wanted) : Math.floor(wanted), f = wanted - i0
    const t = smooth30 ? 0 : Math.min(1, Math.max(0, (f - 0.3) / 0.4))
    const base = nearest(i0)
    if (base < 0) return
    const next = base === i0 && t > 0.02 && bitmaps.has(i0 + 1) ? i0 + 1 : -1
    const best = sharp.get(base) ?? bitmaps.get(base)!
    const key = next < 0 ? `${base}${sharp.has(base) ? 's' : ''}` : `${base}:${next}:${t.toFixed(2)}`
    if (key === drawnKey) return
    drawnKey = key
    canvas.style.visibility = 'visible' // the poster shows until the film's first frame is in
    ctx2d.globalAlpha = 1
    drawCover(best)
    if (next >= 0) {
      ctx2d.globalAlpha = t
      drawCover(bitmaps.get(next)!)
      ctx2d.globalAlpha = 1
    }
  }
  // dev only: lets the test harness read what the hero is drawing
  if (import.meta.env.DEV) (window as unknown as { __hero: unknown }).__hero = { get wanted() { return wanted }, get drawn() { return drawnKey }, get decoded() { return bitmaps.size }, get loaded() { return film ? film.received() : blobs.filter(Boolean).length }, get video() { return !!film } }
  const requestDraw = (f: number) => {
    const clamped = Math.max(0, Math.min(FRAME_COUNT - 1, f))
    if (Math.floor(clamped) !== Math.floor(wanted)) {
      direction = clamped >= wanted ? 1 : -1
      wanted = clamped
      decodeAround(Math.floor(clamped))
    } else wanted = clamped
    if (drawQueued) return
    drawQueued = true
    requestAnimationFrame(() => { drawQueued = false; if (alive) paint() })
  }

  // a sparse set of about 23 frames comes first so the whole film can be scrubbed early; the rest fill in after
  const loadOrder: number[] = []
  for (let i = 0; i < FRAME_COUNT; i += FRAME_COUNT > 193 ? 16 : 8) loadOrder.push(i)
  const COARSE = loadOrder.length
  const fetchFrame = (i: number) => fetch(frameSrc(i))
    .then((r) => r.blob())
    .then((b) => { blobs[i] = b; if (Math.abs(i - wanted) <= AHEAD) decodeAround(Math.floor(wanted)) })
    .catch(() => {})
  const fetchAll = (list: number[], parallel: number) => new Promise<void>((resolve) => {
    let next = 0, done = 0
    if (!list.length) { resolve(); return }
    const loadNext = () => {
      if (!alive || next >= list.length) return
      fetchFrame(list[next++]).finally(() => { if (++done === list.length) resolve(); loadNext() })
    }
    for (let k = 0; k < parallel; k++) loadNext()
  })
  // the rest load from the scroll position forward, so the stretch being watched fills in first
  const fetchRest = (parallel: number) => {
    const started = new Set(loadOrder.slice(0, COARSE))
    const pick = () => {
      const from = Math.floor(wanted)
      for (let d = 0; d < FRAME_COUNT; d++) {
        for (const i of [from + d, from - d]) if (i >= 0 && i < FRAME_COUNT && !started.has(i)) return i
      }
      return -1
    }
    const loadNext = () => {
      const i = alive ? pick() : -1
      if (i < 0) return
      started.add(i)
      fetchFrame(i).finally(loadNext)
    }
    for (let k = 0; k < parallel; k++) loadNext()
  }
  let framesLoading: Promise<void> | null = null
  const loadFrames = () => (framesLoading ??= avifReady.then(() => fetchAll(loadOrder.slice(0, COARSE), 6)).then(() => { if (alive) fetchRest(4) }))
  // video where the browser can play it, image frames otherwise (or if the decoder gives up)
  const startFilm = async () => {
    if (frameSet === 'sm') return false
    let opened: HeroFilm | null = null
    const fallBack = () => {
      film = null
      opened?.close()
      if (alive) void loadFrames()
    }
    opened = await openFilm('/assets/film2/lo', {
      range: () => windowAt(Math.floor(wanted)),
      needed: (i) => alive && inWindow(i, Math.floor(wanted)) && !bitmaps.has(i) && !sharp.has(i),
      onFrame: (i, bm) => {
        if (!alive || !inWindow(i, Math.floor(wanted))) { bm.close(); return }
        bitmaps.set(i, bm)
        if (Math.abs(i - wanted) < 2.5 || !drawnKey) requestDraw(wanted)
      },
      onFail: fallBack,
    })
    if (!opened) return false
    film = opened
    film.seek(0, 1)
    // once every position has a picture, the sharp tier streams in behind it
    void film.complete.then(() => (alive ? openFilm(`/assets/film2/${frameSet}`, {
      range: () => windowAt(Math.floor(wanted)),
      needed: (i) => alive && inWindow(i, Math.floor(wanted)) && !sharp.has(i),
      onFrame: (i, bm) => {
        if (!alive || !inWindow(i, Math.floor(wanted))) { bm.close(); return }
        sharp.set(i, bm)
        if (Math.abs(i - wanted) < 2.5) requestDraw(wanted)
      },
      onFail: () => { sharpFilm?.close(); sharpFilm = null }, // the small film carries on
    }) : null)).then((f) => {
      if (!f) return
      sharpFilm = f
      f.seek(Math.floor(wanted), direction)
    }).catch(() => {})
    await film.ready
    return true
  }
  const heroFramesReady = startFilm().catch(() => { film?.close(); film = null; return false })
    .then((playing) => (playing ? undefined : loadFrames()))
  // Starting the 3D scenes costs a moment of main-thread time: wait for a pause in the scrolling, so
  // it never lands under a moving hand, but not too long: left to the last moment they would
  // download and build just as the visitor reaches them.
  const whenScrollRests = () => new Promise<void>((resolve) => {
    let still = 0, y = window.scrollY
    const id = setInterval(() => {
      still = window.scrollY === y ? still + 1 : 0
      y = window.scrollY
      if (still >= 3 || !alive) { clearInterval(id); resolve() }
    }, 150)
  })
  heroFramesReady.then(() => { if (alive) sizeCanvas() })
    .then(() => Promise.race([whenScrollRests(), new Promise((r) => setTimeout(r, 7000))]))
    .then(() => { if (alive) void preload3D() })
  window.addEventListener('resize', sizeCanvas)

  /* ---------- hero pin: fly-over, then the tour slides up over it ---------- */
  /* ---------- chapter counter for the film's three shots ---------- */
  const CHAPTERS = [[0, 'The forest'], [0.26, 'The slope'], [0.63, 'The crown']] as const
  const hudCount = $('.hero__hud-count b', root), hudName = $('.hero__hud-name', root)
  let chapter = 0
  const updateHud = (p: number) => {
    const c = CHAPTERS.reduce((acc, [at], i) => (p >= at ? i : acc), 0)
    if (c === chapter || !hudCount || !hudName) return
    chapter = c
    gsap.timeline()
      .to([hudCount, hudName], { opacity: 0, y: -8, duration: 0.2, ease: 'power2.in' })
      .add(() => { hudCount.textContent = String(c + 1).padStart(2, '0'); hudName.textContent = CHAPTERS[c][1] })
      .fromTo([hudCount, hudName], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' })
  }

  if (!reducedMotion) {
    // under 6 screens of scrolling for the 13 s film: long pins made the page feel heavy to scroll
    const FLY = 5.6, OVERLAP = 1
    const fly = { p: 0 }
    // how much of the scroll each shot gets, as [scroll, film] marks: the forest moves briskly, and
    // the ski slope and the short closing crown shot each linger for about two screens
    const PACE = [[0, 0], [0.26, 0.51], [0.63, 0.86], [1, 1]]
    const filmAt = (p: number) => {
      const k = p < PACE[1][0] ? 0 : p < PACE[2][0] ? 1 : 2
      const [a, fa] = PACE[k], [b, fb] = PACE[k + 1]
      return fa + ((p - a) / (b - a)) * (fb - fa)
    }
    const heroTl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: $('.hero', root), start: 'top top', end: () => `+=${window.innerHeight * (FLY + OVERLAP)}`,
        // barely any catch-up: the page already scrolls smoothly, so more makes the film trail the hand
        pin: true, pinSpacing: true, scrub: 0.12, anticipatePin: 1, invalidateOnRefresh: true,
      },
    })
      .to(fly, { p: 1, duration: FLY, onUpdate: () => { requestDraw(filmAt(fly.p) * (FRAME_COUNT - 1)); updateHud(fly.p) } }, 0)
      .to($$('.hero__content', root), { y: -140, opacity: 0, duration: FLY * 0.08 }, 0)
      // a slow push-in across the whole film, like a dolly move
      .fromTo(canvas, { scale: 1 }, { scale: 1.1, duration: FLY, immediateRender: false }, 0)
      // chapter counter: fades in as the intro text leaves, its line fills with the film
      .fromTo($$('.hero__hud', root), { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: FLY * 0.05 }, FLY * 0.06)
      .fromTo($$('.hero__hud-line > i', root), { scaleY: 0 }, { scaleY: 1, duration: FLY }, 0)
      .to($$('.hero__hud', root), { opacity: 0, duration: FLY * 0.04 }, FLY * 0.96)
      .to($$('.hero > .scroll-cue', root), { opacity: 0, duration: 0.2 }, 0)
    // one caption per shot, timed to the film (shot changes at 26% and 63% of the scroll)
    ;[[0.08, 0.19], [0.31, 0.54], [0.67, 0.95]].forEach(([a, b], i) => {
      const cap = $$('.hero__caption', root)[i]
      if (!cap) return
      heroTl.fromTo(cap, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: FLY * 0.07 }, FLY * a)
        .to(cap, { opacity: 0, y: -40, duration: FLY * 0.07 }, FLY * b)
    })
    heroTl
      .to($$('.hero__shade', root), { opacity: 0.35, duration: 0.6 }, 0.2)
      .to($$('.hero__media', root), { scale: 0.9, duration: OVERLAP, ease: 'power1.in' }, FLY)
      .to($$('.hero__dim', root), { opacity: 0.8, duration: OVERLAP }, FLY)

    gsap.fromTo($$('.tour__stage', root), { borderTopLeftRadius: 32, borderTopRightRadius: 32 }, {
      borderTopLeftRadius: 0, borderTopRightRadius: 0, ease: 'none',
      scrollTrigger: { trigger: $('.tour', root), start: 'top bottom', end: 'top top', scrub: 0.5 },
    })
  }

  /* ---------- pinned tour ---------- */
  const scenes = $$('.scene', root)
  const captions = $$('.caption', root)
  const n = scenes.length
  // camera move per scene: [fromScale, toScale, fromX%, toX%, fromY%, toY%]
  const moves = [
    [1.3, 1.05, -3, 3, 4, -2],
    [1.25, 1.05, 4, -2, 0, 0],
    [1.3, 1.08, -2, 2, -3, 2],
    [1.2, 1.02, 3, -3, 3, -3],
  ]
  const SLOT = 1.1, WIPE = 0.7, END_HOLD = 0.4
  const tourUnits = (n - 1) + WIPE / 2 + END_HOLD
  const tour = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: $('.tour', root), start: 'top top', end: () => `+=${window.innerHeight * SLOT * tourUnits}`,
      pin: $('.tour__stage', root), scrub: 0.3, anticipatePin: 1, invalidateOnRefresh: true,
    },
  })
  scenes.forEach((scene, i) => {
    const img = scene.querySelector('img')
    const [s0, s1, x0, x1, y0, y1] = moves[i % moves.length]
    const from = Math.max(0, i - WIPE / 2)
    const to = Math.min(tourUnits, i + 1 + WIPE / 2)
    tour.fromTo(img, { scale: s0, xPercent: x0, yPercent: y0 }, { scale: s1, xPercent: x1, yPercent: y1, duration: to - from }, from)
    if (i > 0) {
      const at = i - WIPE / 2
      tour.to(scene, { clipPath: 'inset(0% 0 0 0)', duration: WIPE, ease: 'power1.inOut' }, at)
      tour.fromTo(scene, { yPercent: 8 }, { yPercent: 0, duration: WIPE, ease: 'power1.out' }, at)
      tour.to(captions[i - 1], { autoAlpha: 0, y: -40, duration: WIPE * 0.45, ease: 'power1.in' }, at)
      tour.fromTo(captions[i], { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: WIPE * 0.5, ease: 'power1.out' }, at + WIPE * 0.5)
    }
  })
  tour.fromTo($$('.tour__progress span', root), { scaleY: 1 / n }, { scaleY: 1, duration: (n - 1) + WIPE / 2 }, 0)
  tour.to({}, { duration: 0.001 }, tourUnits)

  /* ---------- loader ---------- */
  const loader = $('#loader', root)
  const keepTop = () => { if (body.classList.contains('is-loading') && window.scrollY !== 0) window.scrollTo(0, 0) }
  window.addEventListener('scroll', keepTop)

  const finishLoading = () => {
    loader?.remove()
    body.classList.remove('is-loading')
    jumpTo(0)
    lenis?.start()
    ScrollTrigger.refresh()
  }

  if (curtain) gsap.set(curtain, { autoAlpha: 0 })
  if (loaderPlayed || reducedMotion || !loader) {
    // second visit (or reduced motion): straight to the hero, behind the page curtain
    loader?.remove()
    introHero(true)
    heroFramesReady.then(() => { if (alive) sizeCanvas() })
    revealPage()
  } else {
    loaderPlayed = true
    body.classList.add('is-loading')
    lenis?.stop()
    jumpTo(0)
    const count = $('#count', loader)!
    const line = $('.loader__line', loader)!
    const bar = $('.loader__bar', loader)!
    const state = { shown: 0 }
    let readyDone = false
    const ready = Promise.race([
      Promise.all([waitForImages([$<HTMLImageElement>('.scene img', root)], () => {}), heroFramesReady]),
      new Promise((resolve) => setTimeout(resolve, 4000)), // never wait more than 4s
    ]).then(() => { readyDone = true })
    const render = () => {
      count.textContent = String(Math.round(state.shown))
      const w = bar.clientWidth * (state.shown / 100)
      line.style.width = `${w}px`
      count.style.left = `${Math.max(w, count.offsetWidth)}px`
    }
    // the capsule window: its size and place follow the screen, `push` carries it past the edges
    const moves = $$('.loader__move', loader)
    const gate = { push: 0 }
    const placeGate = () => {
      const vw = window.innerWidth, vh = window.innerHeight
      const size = Math.min(200, Math.max(110, vw * 0.14)) / 100 // the logo is drawn 100 wide
      const cy = vh * 0.44
      // far enough that the capsule's curved ends clear every corner of the screen
      const reach = Math.hypot(vw / 2, Math.max(cy, vh - cy)) * 2.9 / (94 * size)
      const scale = size * (1 + gate.push * (reach - 1))
      const at = `translate(${vw / 2} ${cy}) scale(${scale}) translate(-50 -68)`
      moves.forEach((g) => g.setAttribute('transform', at))
    }
    placeGate()
    window.addEventListener('resize', placeGate)
    // frame the tower in the window: it stands at 64% across and 21% down the film's first frame,
    // which is shown cover-fit, enlarged 1.25x from the top until the intro settles it
    const media = $('.hero__media', root)
    const coverW = Math.max(window.innerWidth, window.innerHeight * 16 / 9)
    // (a phone shows only the middle of the film, so the shift stops at the edge of the picture)
    gsap.set(media, { x: -Math.min(0.14 * coverW * 1.25, window.innerWidth * 0.34), y: window.innerHeight * 0.44 - 0.21 * coverW * 9 / 16 * 1.25 })
    // the gold outline draws itself in, and the name rises beneath it
    gsap.fromTo($$('.loader__logo > *', loader), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.3, stagger: 0.08, ease: 'power2.inOut' })
    gsap.from($$('.loader__lockup > *', loader), { opacity: 0, y: 14, duration: 0.8, stagger: 0.1, delay: 0.5, ease: 'power3.out' })
    const passThrough = () => {
      // snap to the very top while the loader still covers the page
      jumpTo(0)
      ScrollTrigger.refresh()
      // a slow start and a rush at the end, like a camera moving through the window
      const push = { t: 0 }
      gsap.timeline({ onComplete: () => { window.removeEventListener('resize', placeGate); finishLoading() } })
        .to($$('.loader__bar, .loader__lockup', loader), { autoAlpha: 0, y: 12, duration: 0.4, ease: 'power2.in' })
        .to(push, {
          t: 1, duration: 2, ease: 'sine.inOut',
          onUpdate() { gate.push = Math.pow(push.t, 2.6); placeGate() },
        }, 0.15)
        // the film glides back to its own framing as the window opens
        .to(media, { x: 0, y: 0, duration: 1.8, ease: 'sine.inOut' }, 0.15)
        .to($$('.loader__logo', loader), { opacity: 0, duration: 0.35, ease: 'none' }, 1.7)
        .add(() => introHero(), 1.35)
    }
    const tick = gsap.to(state, {
      shown: 100, duration: 1.6, ease: 'power1.inOut',
      onUpdate() {
        // hold at 90 until the critical images are in
        if (!readyDone && state.shown > 90) { state.shown = 90; tick.pause(); ready.then(() => tick.resume()) }
        render()
      },
      onComplete: passThrough,
    })
  }

  return () => {
    alive = false
    window.removeEventListener('resize', sizeCanvas)
    window.removeEventListener('scroll', keepTop)
    body.classList.remove('is-loading')
    film?.close()
    sharpFilm?.close()
    for (const set of [bitmaps, sharp]) { set.forEach((bm) => bm.close()); set.clear() }
    lenis?.start()
  }
}
