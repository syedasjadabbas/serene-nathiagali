/* =========================================================
   Serene Heights — Nathia Gali
   Loader → cloud dive → hero → pinned scroll tour
   ========================================================= */
gsap.registerPlugin(ScrollTrigger);

/* ---------- always start at the top on load / refresh ---------- */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (location.hash) history.replaceState(null, '', location.pathname + location.search);
window.scrollTo(0, 0);
window.addEventListener('pageshow', () => window.scrollTo(0, 0));

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!reduceMotion && window.Lenis) {
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
  // Re-measure the page whenever pins/spacers are recalculated, so the scroll limit never goes stale.
  ScrollTrigger.addEventListener('refresh', () => lenis.resize());
}

function scrollToTarget(target) {
  if (lenis) {
    lenis.start();
    lenis.scrollTo(target, { duration: target === 0 ? 2 : 1.6, force: true });
  } else if (target === 0) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
  }
}

/* ---------- split headings into masked lines (on <br>) ---------- */
$$('.split').forEach((el) => {
  el.innerHTML = el.innerHTML
    .split(/<br\s*\/?>/i)
    .map((part) => `<span class="line"><span>${part.trim()}</span></span>`)
    .join('');
});

/* ---------- menu ---------- */
const menuBtn = $('#menuBtn');
const menu = $('#menu');
function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', open);
  menu.setAttribute('aria-hidden', !open);
  if (lenis) open ? lenis.stop() : lenis.start();
}
menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));

$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const target = a.getAttribute('href');
    if (target.length < 2) return;
    e.preventDefault();
    setMenu(false);
    scrollToTarget(target === '#top' ? 0 : target);
  });
});

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

/* ---------- header colour over light sections ---------- */
$$('.light').forEach((section) => {
  ScrollTrigger.create({
    trigger: section,
    start: 'top 60px',
    end: 'bottom 60px',
    toggleClass: { targets: '.header', className: 'is-dark' },
  });
});

/* ---------- lightbox ---------- */
const lightbox = $('#lightbox');
const lightboxBody = $('.lightbox__body', lightbox);
function openLightbox(html) {
  lightboxBody.innerHTML = html;
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
  lenis?.stop();
}
function closeLightbox() {
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  lightboxBody.innerHTML = ''; // stops any playing video
  lenis?.start();
}
$('.lightbox__close').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

/* ---------- floor plans ---------- */
const floors = [
  { id: 'ground', label: 'Ground', name: 'Ground floor', note: 'Banquet hall · conference rooms' },
  { id: 'ground1', label: 'Ground — Apts', name: 'Ground floor', note: 'Apartments' },
  { id: '1st', label: '1st', name: '1st floor', note: 'Apartments 101 – 116' },
  { id: '2nd', label: '2nd', name: '2nd floor', note: 'Apartments' },
  { id: '3rd', label: '3rd', name: '3rd floor', note: 'Apartments' },
  { id: '5th', label: '5th', name: '5th floor', note: 'Apartments' },
  { id: '6th', label: '6th', name: '6th floor', note: 'Apartments' },
  { id: '7th', label: '7th', name: '7th floor', note: 'Apartments' },
  { id: '8th', label: '8th', name: '8th floor', note: 'Apartments' },
];
const planImg = $('#planImg');
const tabs = $('.plans__tabs');
tabs.innerHTML = floors.map((f, i) =>
  `<button role="tab" aria-selected="${i === 0}" data-floor="${i}">${f.label}</button>`).join('');

function showFloor(i) {
  const f = floors[i];
  $$('button', tabs).forEach((b) => b.setAttribute('aria-selected', b.dataset.floor == i));
  planImg.style.opacity = 0;
  const next = new Image();
  next.onload = () => {
    planImg.src = next.src;
    planImg.alt = `${f.name} plan — ${f.note}`;
    planImg.style.opacity = 1;
  };
  next.src = `assets/img/floors/${f.id}.jpg`;
  $('#planName').textContent = f.name;
  $('#planNote').textContent = f.note;
}
tabs.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b) showFloor(+b.dataset.floor);
});
$('.plans__open').addEventListener('click', () => openLightbox(`<img src="${planImg.src}" alt="${planImg.alt}">`));
showFloor(0);

/* ---------- gallery ---------- */
const shots = [
  ['sunset-rooftop', 'Rooftop terraces at sunset', 'big'],
  ['night-facade', 'Serene Heights lit up on a snowy night', 'tall'],
  ['snow-tower', 'The tower in winter'],
  ['snow-aerial-sunset', 'Aerial view over snowy pines at dusk'],
  ['rooftop-terrace', 'Rooftop dining terrace'],
  ['snow-valley', 'Tower above the snowy valley'],
  ['rooftop-lounge', 'Sunlit rooftop lounge', 'wide'],
  ['snow-street', 'Arrival road in the snow'],
  ['rooftop-view', 'Rooftop restaurant overlooking the pines'],
  ['snow-facade', 'Facade in fresh snow'],
];
$('#shots').innerHTML = shots.map(([id, alt, size = '']) => `
  <button class="shot ${size}" data-full="assets/img/renders/${id}.jpg" aria-label="View full size: ${alt}">
    <img src="assets/img/renders/${id}-sm.jpg" alt="${alt}" loading="lazy">
  </button>`).join('');
$('#shots').addEventListener('click', (e) => {
  const b = e.target.closest('.shot');
  if (b) openLightbox(`<img src="${b.dataset.full}" alt="${$('img', b).alt}">`);
});
gsap.from('.shot', {
  y: 60, opacity: 0, duration: 1.1, stagger: 0.05, ease: 'power3.out',
  scrollTrigger: { trigger: '.shots', start: 'top 85%' },
});

/* ---------- payment calculator ---------- */
const PRICE_PER_SQFT = 40000;
const pkr = (n) => 'PKR ' + Math.round(n).toLocaleString('en-PK');
const calcArea = $('#calcArea');
const calcRange = $('#calcRange');
function updateCalc(area) {
  const total = area * PRICE_PER_SQFT;
  const booking = total * 0.3;
  $('#calcTotal').textContent = pkr(total);
  $('#calcBooking').textContent = pkr(booking);
  $('#calcMonthly').textContent = pkr((total - booking) / 36);
}
calcArea.addEventListener('input', () => {
  const v = Math.max(0, +calcArea.value || 0);
  calcRange.value = v;
  updateCalc(v);
});
calcRange.addEventListener('input', () => {
  calcArea.value = calcRange.value;
  updateCalc(+calcRange.value);
});
updateCalc(+calcArea.value);

/* ---------- construction progress ---------- */
const milestones = [
  ['April 2026', 'lxc9yQty3BA'],
  ['December 2025', 'HIewLGoRr2g'],
  ['September 2025', '_b7QhNjmldk'],
  ['April 2025', 'zih0inhf1hM'],
  ['July 2024', '_RjucM01Vp8'],
  ['February 2024', 'J_EAtfLGICw'],
  ['November 2023', 'YbcwSm0l4Es'],
  ['July 2023', 'deh7Edv0cFM'],
  ['October 2022', '_ArGeucKghA'],
  ['December 2021', '-j6c51b2Dis'],
];
const timeline = $('#timeline');
timeline.innerHTML = milestones.map(([date, id]) => `
  <button class="milestone" data-video="${id}" aria-label="Play construction progress video, ${date}">
    <span class="milestone__thumb">
      <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy">
      <span class="milestone__play">▶</span>
    </span>
    <span class="milestone__date">${date}</span>
  </button>`).join('');
timeline.addEventListener('click', (e) => {
  const m = e.target.closest('.milestone');
  if (!m) return;
  const id = m.dataset.video;
  openLightbox(`<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="Construction progress video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
    <a class="lightbox__link" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">Watch on YouTube ↗</a>`);
});

/* ---------- section reveals ---------- */
$$('.split').forEach((el) => {
  gsap.fromTo($$('.line > span', el), { yPercent: 105 }, {
    yPercent: 0,
    duration: 1.2, stagger: 0.08, ease: 'expo.out',
    scrollTrigger: { trigger: el, start: 'top 85%' },
  });
});

$$('.card').forEach((card, i) => {
  gsap.from(card, {
    y: 80, opacity: 0, duration: 1.2, delay: (i % 3) * 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: card, start: 'top 90%' },
  });
});

/* ---------- count-up numbers ---------- */
// Counts the first number in each element up from 0 when it scrolls into view,
// leaving any prefix/suffix ("+", "ft", "/7", "PKR") untouched.
function countUp(selector, trigger) {
  $$(selector).forEach((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode()) && !/\d/.test(node.nodeValue));
    if (!node) return;
    const m = node.nodeValue.match(/\d[\d,]*/);
    const target = parseInt(m[0].replace(/,/g, ''), 10);
    const useCommas = m[0].includes(',');
    const before = node.nodeValue.slice(0, m.index);
    const after = node.nodeValue.slice(m.index + m[0].length);
    const fmt = (v) => (useCommas ? Math.round(v).toLocaleString('en-US') : String(Math.round(v)));
    if (reduceMotion) return;
    const counter = { v: 0 };
    node.nodeValue = before + fmt(0) + after;
    gsap.to(counter, {
      v: target,
      duration: target > 1000 ? 2.2 : 1.8,
      ease: 'power2.out',
      onUpdate: () => { node.nodeValue = before + fmt(counter.v) + after; },
      scrollTrigger: { trigger: trigger || el, start: 'top 85%', once: true },
    });
  });
}
countUp('.figures strong', '.figures');
countUp('.price strong', '.price');

gsap.from('.figures li', {
  y: 40, opacity: 0, duration: 1, stagger: 0.07, ease: 'power3.out',
  scrollTrigger: { trigger: '.figures', start: 'top 90%' },
});

gsap.from('.tiles img', {
  y: 60, opacity: 0, duration: 1.1, stagger: 0.05, ease: 'power3.out',
  scrollTrigger: { trigger: '.tiles', start: 'top 85%' },
});

gsap.from('.price li, .calc, .benefits', {
  y: 50, opacity: 0, duration: 1.1, stagger: 0.08, ease: 'power3.out',
  scrollTrigger: { trigger: '.price', start: 'top 88%' },
});

gsap.from('.milestone', {
  x: 80, opacity: 0, duration: 1.1, stagger: 0.06, ease: 'power3.out',
  scrollTrigger: { trigger: '.timeline', start: 'top 88%' },
});

gsap.from('.distances li', {
  y: 30, opacity: 0, duration: 1, stagger: 0.06, ease: 'power3.out',
  scrollTrigger: { trigger: '.distances', start: 'top 92%' },
});

gsap.to('.location__media', {
  yPercent: 12, ease: 'none',
  scrollTrigger: { trigger: '.location', start: 'top bottom', end: 'bottom top', scrub: true },
});
gsap.fromTo('.contact__media img', { scale: 1.25 }, {
  scale: 1, ease: 'none',
  scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'top top', scrub: true },
});

window.addEventListener('load', () => {
  // Only reset while the loader is up; never yank someone back once they are scrolling.
  if (document.body.classList.contains('is-loading')) window.scrollTo(0, 0);
  ScrollTrigger.refresh();
});
runLoader();
