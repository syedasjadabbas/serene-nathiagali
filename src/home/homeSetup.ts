import { gsap, ScrollTrigger, lenis, jumpTo, reducedMotion } from '../lib/scroll'
import { revealPage } from '../lib/router'
import { preload3D } from '../three/preload'

// Homepage: loader → cloud dive → scroll-driven hero fly-over (canvas frame sequence) → pinned tour.
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

export function homeSetup(root: HTMLElement) {
  let alive = true
  const body = document.body
  const curtain = document.querySelector<HTMLElement>('.curtain')

  /* ---------- hero intro ---------- */
  const titleLines = $$('.hero__title .line > span', root)
  gsap.set(titleLines, { yPercent: 110 })
  const introHero = (instant = false) => {
    const d = instant ? 0 : 1
    gsap.timeline()
      .to($$('.hero__canvas', root), { scale: 1, duration: 2.4 * d, ease: 'expo.out' })
      .to(titleLines, { yPercent: 0, duration: 1.2 * d, stagger: 0.09, ease: 'expo.out' }, 0.15 * d)
      .to($$('.hero .reveal-up', root), { opacity: 1, y: 0, duration: 1 * d, stagger: 0.1, ease: 'power3.out' }, 0.5 * d)
      .from(document.querySelector('.header'), { opacity: 0, y: -20, duration: 0.8 * d, ease: 'power3.out' }, 0.4 * d)
  }

  /* ---------- hero: canvas frame sequence ---------- */
  const FRAME_COUNT = 84
  const FRAME_W = 1600
  // pick by the pixels the cover-fit needs (portrait phones crop the middle of a wide frame)
  const neededWidth = Math.max(window.innerWidth, window.innerHeight * 16 / 9) * Math.min(window.devicePixelRatio || 1, 2)
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
  const frameSet = saveData || neededWidth < 1100 ? 'sm' : 'lg'
  const frameSrc = (i: number) => `/assets/hero/${frameSet}/${String(i + 1).padStart(3, '0')}.webp`
  const canvas = $<HTMLCanvasElement>('.hero__canvas', root)!
  const ctx2d = canvas.getContext('2d', { alpha: false })!

  // compressed frames are kept as blobs; only a window around the current position is decoded
  // (off the main thread) into bitmaps, so drawing never stalls and memory stays bounded
  const blobs: (Blob | undefined)[] = new Array(FRAME_COUNT)
  const bitmaps = new Map<number, ImageBitmap>()
  const decoding = new Set<number>()
  const DECODE_AHEAD = frameSet === 'lg' ? 14 : 16
  let wantedFrame = 0
  let drawnFrame = -1
  let drawQueued = false

  const sizeCanvas = () => {
    const coverCssWidth = Math.max(canvas.clientWidth, canvas.clientHeight * 16 / 9)
    const frameWidth = frameSet === 'lg' ? FRAME_W : 1024
    const k = Math.min(window.devicePixelRatio || 1, 2, frameWidth / coverCssWidth)
    canvas.width = Math.round(canvas.clientWidth * k)
    canvas.height = Math.round(canvas.clientHeight * k)
    drawnFrame = -1
    requestDraw(wantedFrame)
  }
  const decodeAround = (center: number) => {
    for (let d = 0; d <= DECODE_AHEAD; d++) {
      for (const i of [center + d, center - d]) {
        const blob = blobs[i]
        if (i < 0 || i >= FRAME_COUNT || !blob || bitmaps.has(i) || decoding.has(i)) continue
        decoding.add(i)
        createImageBitmap(blob).then((bm) => {
          decoding.delete(i)
          if (!alive || Math.abs(i - wantedFrame) > DECODE_AHEAD * 2) { bm.close(); return }
          bitmaps.set(i, bm)
          if (drawnFrame === -1 || Math.abs(i - wantedFrame) < Math.abs(drawnFrame - wantedFrame)) requestDraw(wantedFrame)
        }).catch(() => decoding.delete(i))
      }
    }
    bitmaps.forEach((bm, i) => { if (Math.abs(i - center) > DECODE_AHEAD * 2) { bm.close(); bitmaps.delete(i) } })
  }
  const paint = () => {
    const i = wantedFrame
    let key = -1
    for (let d = 0; d < FRAME_COUNT && key < 0; d++) {
      if (bitmaps.has(i - d)) key = i - d
      else if (bitmaps.has(i + d)) key = i + d
    }
    if (key < 0 || key === drawnFrame) return
    drawnFrame = key
    const bm = bitmaps.get(key)!
    const cw = canvas.width, ch = canvas.height
    const scale = Math.max(cw / bm.width, ch / bm.height)
    const w = bm.width * scale, h = bm.height * scale
    ctx2d.drawImage(bm, (cw - w) / 2, (ch - h) / 2, w, h)
  }
  const requestDraw = (i: number) => {
    if (i !== wantedFrame) { wantedFrame = i; decodeAround(i) }
    if (drawQueued) return
    drawQueued = true
    requestAnimationFrame(() => { drawQueued = false; if (alive) paint() })
  }

  // download coarse-to-fine (every 8th frame, then 4th, 2nd, all) so scrubbing works early
  const loadOrder: number[] = []
  ;[8, 4, 2, 1].forEach((step) => { for (let i = 0; i < FRAME_COUNT; i += step) if (!loadOrder.includes(i)) loadOrder.push(i) })
  const COARSE = Math.ceil(FRAME_COUNT / 8)
  // Downloads run in three steps so the 3D scenes further down are ready early:
  // 1. the coarse hero frames (enough to scrub), 2. the map and tower scenes, 3. the remaining frames.
  const fetchFrame = (i: number) => fetch(frameSrc(i))
    .then((r) => r.blob())
    .then((b) => { blobs[i] = b; if (Math.abs(i - wantedFrame) <= DECODE_AHEAD) decodeAround(wantedFrame) })
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
  const heroFramesReady = fetchAll(loadOrder.slice(0, COARSE), 6)
  heroFramesReady.then(() => { if (alive) sizeCanvas() })
  heroFramesReady
    .then(() => (alive ? preload3D() : undefined))
    .then(() => { if (alive) void fetchAll(loadOrder.slice(COARSE), 6) })
  window.addEventListener('resize', sizeCanvas)

  /* ---------- hero pin: fly-over, then the tour slides up over it ---------- */
  if (!reducedMotion) {
    const FLY = 2.2, OVERLAP = 1
    const fly = { p: 0 }
    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: $('.hero', root), start: 'top top', end: () => `+=${window.innerHeight * (FLY + OVERLAP)}`,
        pin: true, pinSpacing: true, scrub: 0.5, anticipatePin: 1, invalidateOnRefresh: true,
      },
    })
      .to(fly, { p: 1, duration: FLY, onUpdate: () => requestDraw(Math.round(fly.p * (FRAME_COUNT - 1))) }, 0)
      .to($$('.hero__content', root), { y: -140, opacity: 0, duration: 0.55 }, 0)
      .to($$('.hero > .scroll-cue', root), { opacity: 0, duration: 0.2 }, 0)
      .fromTo($$('.hero__caption', root), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.33 }, 0.66)
      .to($$('.hero__caption', root), { opacity: 0, y: -40, duration: 0.33 }, 1.6)
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
  const SLOT = 1.8, WIPE = 0.7, END_HOLD = 0.6
  const tourUnits = (n - 1) + WIPE / 2 + END_HOLD
  const tour = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: $('.tour', root), start: 'top top', end: () => `+=${window.innerHeight * SLOT * tourUnits}`,
      pin: $('.tour__stage', root), scrub: 1.2, anticipatePin: 1, invalidateOnRefresh: true,
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
      Promise.all([waitForImages([$<HTMLImageElement>('.loader__bg img', loader), $<HTMLImageElement>('.scene img', root)], () => {}), heroFramesReady]),
      new Promise((resolve) => setTimeout(resolve, 4000)), // never wait more than 4s
    ]).then(() => { readyDone = true })
    const render = () => {
      count.textContent = String(Math.round(state.shown))
      const w = bar.clientWidth * (state.shown / 100)
      line.style.width = `${w}px`
      count.style.left = `${Math.max(w, count.offsetWidth)}px`
    }
    gsap.fromTo($$('.loader__bg img', loader), { scale: 1.15 }, { scale: 1, duration: 2.4, ease: 'power2.out' })
    const dive = () => {
      // snap to the very top while the loader still covers the page
      jumpTo(0)
      ScrollTrigger.refresh()
      gsap.timeline({ defaults: { ease: 'power3.inOut' }, onComplete: finishLoading })
        .to($$('.loader__bar, .loader__coords, .pin', loader), { autoAlpha: 0, duration: 0.3 })
        .to($$('.loader__bg', loader), { scale: 2.2, duration: 1.1 }, '<')
        .to($$('.cloud', loader), { scale: 3.2, opacity: 1, duration: 1.1, stagger: 0.02 }, '<')
        .to($$('.clouds', loader), { backgroundColor: 'rgba(255,255,255,1)', duration: 0.6 }, '-=0.7')
        .add(() => introHero(), '-=0.15')
        .to(loader, { autoAlpha: 0, duration: 0.6, ease: 'power2.out' }, '-=0.25')
    }
    const tick = gsap.to(state, {
      shown: 100, duration: 1.6, ease: 'power1.inOut',
      onUpdate() {
        // hold at 90 until the critical images are in
        if (!readyDone && state.shown > 90) { state.shown = 90; tick.pause(); ready.then(() => tick.resume()) }
        render()
      },
      onComplete: dive,
    })
  }

  return () => {
    alive = false
    window.removeEventListener('resize', sizeCanvas)
    window.removeEventListener('scroll', keepTop)
    body.classList.remove('is-loading')
    bitmaps.forEach((bm) => bm.close())
    bitmaps.clear()
    lenis?.start()
  }
}
