/* =========================================================
   Serene Heights — homepage only
   Loader → cloud dive → scroll-driven hero fly-over → pinned tour.
   Relies on js/common.js (loaded first) for $, $$, lenis, reduceMotion.
   ========================================================= */
lenis?.stop(); // no scrolling while the loader is up

/* ---------- loader ---------- */
function waitForImages(imgs, onProgress) {
  let done = 0;
  return Promise.all(imgs.map((img) => new Promise((resolve) => {
    const finish = () => { done++; onProgress(done / imgs.length); resolve(); };
    if (img.complete) finish();
    else { img.addEventListener('load', finish, { once: true }); img.addEventListener('error', finish, { once: true }); }
  })));
}

function runLoader() {
  const loader = $('#loader');
  const count = $('#count');
  const line = $('.loader__line');
  const bar = $('.loader__bar');

  if (reduceMotion) {
    loader.remove();
    document.body.classList.remove('is-loading');
    introHero(true);
    return;
  }

  // Displayed progress never outruns real image loading, and takes at least ~1.6s.
  const state = { shown: 0 };
  let loaded = 0;
  const critical = [$('.loader__bg img'), $('.scene img')];
  // Never wait more than 4s: the hero falls back to its poster image if frames are slow.
  let readyDone = false;
  const ready = Promise.race([
    Promise.all([waitForImages(critical, (p) => { loaded = p; }), heroFramesReady]),
    new Promise((resolve) => setTimeout(resolve, 4000)),
  ]).then(() => { readyDone = true; });

  const render = () => {
    const v = Math.round(state.shown);
    count.textContent = v;
    const w = bar.clientWidth * (state.shown / 100);
    line.style.width = `${w}px`;
    count.style.left = `${Math.max(w, count.offsetWidth)}px`;
  };

  gsap.fromTo('.loader__bg img', { scale: 1.15 }, { scale: 1, duration: 2.4, ease: 'power2.out' });

  const tick = gsap.to(state, {
    shown: 100,
    duration: 1.6,
    ease: 'power1.inOut',
    onUpdate() {
      // hold at 90 until the critical images are in
      if (!readyDone && state.shown > 90) { state.shown = 90; tick.pause(); ready.then(() => tick.resume()); }
      render();
    },
    onComplete: diveThroughClouds,
  });

  function diveThroughClouds() {
    // Snap to the very top *before* the loader starts fading, while it still covers the page.
    window.scrollTo(0, 0);
    lenis?.scrollTo(0, { immediate: true, force: true });
    ScrollTrigger.refresh();
    const tl = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete() {
        loader.remove();
        document.body.classList.remove('is-loading');
        // Always land on the hero, whatever the scroll position was during loading.
        window.scrollTo(0, 0);
        lenis?.scrollTo(0, { immediate: true, force: true });
        lenis?.start();
        ScrollTrigger.refresh();
      },
    });
    tl.to(['.loader__bar', '.loader__coords', '.pin'], { autoAlpha: 0, duration: 0.3 })
      .to('.loader__bg', { scale: 2.2, duration: 1.1 }, '<')
      .to('.cloud', { scale: 3.2, opacity: 1, duration: 1.1, stagger: 0.02 }, '<')
      .to('.clouds', { backgroundColor: 'rgba(255,255,255,1)', duration: 0.6 }, '-=0.7')
      .add(() => introHero(), '-=0.15')
      .to(loader, { autoAlpha: 0, duration: 0.6, ease: 'power2.out' }, '-=0.25');
  }
}

/* ---------- hero intro ---------- */
function introHero(instant = false) {
  const d = instant ? 0 : 1;
  gsap.timeline()
    .to('.hero__canvas', { scale: 1, duration: 2.4 * d, ease: 'expo.out' })
    .to('.hero__title .line > span', { yPercent: 0, duration: 1.2 * d, stagger: 0.09, ease: 'expo.out' }, 0.15 * d)
    .to('.hero .reveal-up', { opacity: 1, y: 0, duration: 1 * d, stagger: 0.1, ease: 'power3.out' }, 0.5 * d)
    .from('.header', { opacity: 0, y: -20, duration: 0.8 * d, ease: 'power3.out' }, 0.4 * d);
}
gsap.set('.hero__title .line > span', { yPercent: 110 });

/* ---------- hero: scroll drives the aerial fly-over (canvas frame sequence) ---------- */
const FRAME_COUNT = 84;
const FRAME_W = 1600;
// Pick by the pixels the cover-fit actually needs (portrait phones crop the middle of a wide frame).
const neededWidth = Math.max(window.innerWidth, window.innerHeight * 16 / 9) * Math.min(window.devicePixelRatio || 1, 2);
const frameSet = navigator.connection?.saveData || neededWidth < 1100 ? 'sm' : 'lg';
const frameSrc = (i) => `assets/hero/${frameSet}/${String(i + 1).padStart(3, '0')}.webp`;
const heroCanvas = $('.hero__canvas');
const heroCtx = heroCanvas.getContext('2d', { alpha: false });

// Compressed frames are kept as blobs; only a window of frames around the current
// scroll position is decoded (off the main thread) into bitmaps, so drawing never
// stalls on decoding and memory stays bounded.
const blobs = new Array(FRAME_COUNT);
const bitmaps = new Map();
const decoding = new Set();
const DECODE_AHEAD = frameSet === 'lg' ? 14 : 16;
let wantedFrame = 0;
let drawnFrame = -1;
let drawQueued = false;

function sizeCanvas() {
  // Never render more pixels than the frames contain; CSS scales the rest up.
  const coverCssWidth = Math.max(heroCanvas.clientWidth, heroCanvas.clientHeight * 16 / 9);
  const frameWidth = frameSet === 'lg' ? FRAME_W : 1024;
  const k = Math.min(window.devicePixelRatio || 1, 2, frameWidth / coverCssWidth);
  heroCanvas.width = Math.round(heroCanvas.clientWidth * k);
  heroCanvas.height = Math.round(heroCanvas.clientHeight * k);
  drawnFrame = -1;
  requestDraw(wantedFrame);
}

function decodeAround(center) {
  for (let d = 0; d <= DECODE_AHEAD; d++) {
    for (const i of [center + d, center - d]) {
      if (i < 0 || i >= FRAME_COUNT || !blobs[i] || bitmaps.has(i) || decoding.has(i)) continue;
      decoding.add(i);
      createImageBitmap(blobs[i]).then((bm) => {
        decoding.delete(i);
        if (Math.abs(i - wantedFrame) > DECODE_AHEAD * 2) { bm.close(); return; }
        bitmaps.set(i, bm);
        if (Math.abs(i - wantedFrame) < Math.abs(drawnFrame - wantedFrame) || drawnFrame === -1) requestDraw(wantedFrame);
      }).catch(() => decoding.delete(i));
    }
  }
  // Release bitmaps that have fallen far outside the window.
  bitmaps.forEach((bm, i) => {
    if (Math.abs(i - center) > DECODE_AHEAD * 2) { bm.close(); bitmaps.delete(i); }
  });
}

function requestDraw(i) {
  if (i !== wantedFrame) { wantedFrame = i; decodeAround(i); }
  if (drawQueued) return;
  drawQueued = true;
  requestAnimationFrame(() => { drawQueued = false; paint(); });
}

// Paints the wanted frame, or the nearest one that is already decoded.
function paint() {
  const i = wantedFrame;
  let key = -1;
  for (let d = 0; d < FRAME_COUNT && key < 0; d++) {
    if (bitmaps.has(i - d)) key = i - d;
    else if (bitmaps.has(i + d)) key = i + d;
  }
  if (key < 0 || key === drawnFrame) return;
  drawnFrame = key;
  const bm = bitmaps.get(key);
  const cw = heroCanvas.width, ch = heroCanvas.height;
  const scale = Math.max(cw / bm.width, ch / bm.height);
  const w = bm.width * scale, h = bm.height * scale;
  heroCtx.drawImage(bm, (cw - w) / 2, (ch - h) / 2, w, h);
}

// Download coarse-to-fine (every 8th frame, then 4th, 2nd, all) so scrubbing works early.
const loadOrder = [];
[8, 4, 2, 1].forEach((step) => {
  for (let i = 0; i < FRAME_COUNT; i += step) if (!loadOrder.includes(i)) loadOrder.push(i);
});
const COARSE = Math.ceil(FRAME_COUNT / 8); // every 8th frame: enough to scrub, the rest stream in
const heroFramesReady = new Promise((resolve) => {
  let next = 0;
  let done = 0;
  const loadNext = () => {
    if (next >= loadOrder.length) return;
    const i = loadOrder[next++];
    fetch(frameSrc(i))
      .then((r) => r.blob())
      .then((b) => { blobs[i] = b; if (Math.abs(i - wantedFrame) <= DECODE_AHEAD) decodeAround(wantedFrame); })
      .catch(() => {})
      .finally(() => {
        if (++done === COARSE) resolve();
        loadNext();
      });
  };
  for (let k = 0; k < 6; k++) loadNext(); // parallel downloads
});
heroFramesReady.then(sizeCanvas);
window.addEventListener('resize', sizeCanvas);

if (!reduceMotion) {
  // Units are viewport heights of scrolling: 2.2 for the fly-over, then 1.0 during
  // which the tour (pulled up by -100vh in CSS) slides over the sinking hero.
  const FLY = 2.2;
  const OVERLAP = 1;
  const fly = { p: 0 };
  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: () => `+=${window.innerHeight * (FLY + OVERLAP)}`,
      pin: true,
      pinSpacing: true,
      scrub: 0.5,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  })
    .to(fly, {
      p: 1,
      duration: FLY,
      onUpdate: () => requestDraw(Math.round(fly.p * (FRAME_COUNT - 1))),
    }, 0)
    .to('.hero__content', { y: -140, opacity: 0, duration: 0.55 }, 0)
    .to('.hero > .scroll-cue', { opacity: 0, duration: 0.2 }, 0)
    .fromTo('.hero__caption', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.33 }, 0.66)
    .to('.hero__caption', { opacity: 0, y: -40, duration: 0.33 }, 1.6)
    .to('.hero__shade', { opacity: 0.35, duration: 0.6 }, 0.2)
    // hand-off: the hero sinks back and dims while the tour slides up over it
    .to('.hero__media', { scale: 0.9, duration: OVERLAP, ease: 'power1.in' }, FLY)
    .to('.hero__dim', { opacity: 0.8, duration: OVERLAP }, FLY);

  gsap.fromTo('.tour__stage',
    { borderTopLeftRadius: 32, borderTopRightRadius: 32 },
    {
      borderTopLeftRadius: 0, borderTopRightRadius: 0, ease: 'none',
      scrollTrigger: { trigger: '.tour', start: 'top bottom', end: 'top top', scrub: 0.5 },
    });
}

/* ---------- pinned tour ---------- */
const scenes = $$('.scene');
const captions = $$('.caption');
const n = scenes.length;

// camera move per scene: [fromScale, toScale, fromX%, toX%, fromY%, toY%]
const moves = [
  [1.3, 1.05, -3, 3, 4, -2],
  [1.25, 1.05, 4, -2, 0, 0],
  [1.3, 1.08, -2, 2, -3, 2],
  [1.2, 1.02, 3, -3, 3, -3],
];

// One timeline unit = one scene slot = SLOT viewport heights of scrolling.
const SLOT = 1.8;
const WIPE = 0.7;      // share of a slot spent wiping to the next image
const END_HOLD = 0.6;  // linger on the last scene before releasing the pin
const tourUnits = (n - 1) + WIPE / 2 + END_HOLD;

const tour = gsap.timeline({
  defaults: { ease: 'none' },
  scrollTrigger: {
    trigger: '.tour',
    start: 'top top',
    end: () => `+=${window.innerHeight * SLOT * tourUnits}`,
    pin: '.tour__stage',
    scrub: 1.2,
    anticipatePin: 1,
    invalidateOnRefresh: true,
  },
});

scenes.forEach((scene, i) => {
  const img = $('img', scene);
  const [s0, s1, x0, x1, y0, y1] = moves[i % moves.length];
  const from = Math.max(0, i - WIPE / 2);
  const to = Math.min(tourUnits, i + 1 + WIPE / 2);
  // each scene's camera drifts slowly across the whole time it is on screen
  tour.fromTo(img, { scale: s0, xPercent: x0, yPercent: y0 }, { scale: s1, xPercent: x1, yPercent: y1, duration: to - from }, from);

  if (i > 0) {
    const at = i - WIPE / 2;
    tour.to(scene, { clipPath: 'inset(0% 0 0 0)', duration: WIPE, ease: 'power1.inOut' }, at);
    tour.fromTo(scene, { yPercent: 8 }, { yPercent: 0, duration: WIPE, ease: 'power1.out' }, at);
    tour.to(captions[i - 1], { autoAlpha: 0, y: -40, duration: WIPE * 0.45, ease: 'power1.in' }, at);
    tour.fromTo(captions[i], { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: WIPE * 0.5, ease: 'power1.out' }, at + WIPE * 0.5);
  }
});
tour.fromTo('.tour__progress span', { scaleY: 1 / n }, { scaleY: 1, duration: (n - 1) + WIPE / 2 }, 0);
tour.to({}, { duration: 0.001 }, tourUnits); // keep the full length so the last scene holds

// Pins are created above; now the shared scroll effects can measure the final layout.
initScrollEffects();
runLoader();
