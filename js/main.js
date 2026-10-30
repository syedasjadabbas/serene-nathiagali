/* =========================================================
   Serene Heights — Nathia Gali
   Loader → cloud dive → hero → pinned scroll tour
   ========================================================= */
gsap.registerPlugin(ScrollTrigger);

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
}

function scrollToTarget(target) {
  if (lenis) lenis.scrollTo(target, { duration: 1.6 });
  else document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
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

  // Displayed progress never outruns real image loading, and takes at least ~3s.
  const state = { shown: 0 };
  let loaded = 0;
  const critical = [$('.loader__bg img'), $('.scene img')];
  const ready = waitForImages(critical, (p) => { loaded = p; });

  const render = () => {
    const v = Math.round(state.shown);
    count.textContent = v;
    const w = bar.clientWidth * (state.shown / 100);
    line.style.width = `${w}px`;
    count.style.left = `${Math.max(w, count.offsetWidth)}px`;
  };

  gsap.fromTo('.loader__bg img', { scale: 1.15 }, { scale: 1, duration: 4, ease: 'power2.out' });

  const tick = gsap.to(state, {
    shown: 100,
    duration: 3.2,
    ease: 'power1.inOut',
    onUpdate() {
      // hold at 90 until the critical images are in
      if (loaded < 1 && state.shown > 90) { state.shown = 90; tick.pause(); ready.then(() => tick.resume()); }
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
        lenis?.start();
        ScrollTrigger.refresh();
      },
    });
    tl.to(['.loader__bar', '.loader__coords', '.pin'], { autoAlpha: 0, duration: 0.5 })
      .to('.loader__bg', { scale: 2.2, duration: 1.6 }, '<')
      .to('.cloud', { scale: 3.2, opacity: 1, duration: 1.6, stagger: 0.03 }, '<')
      .to('.clouds', { backgroundColor: 'rgba(255,255,255,1)', duration: 0.9 }, '-=1.0')
      .add(() => introHero(), '-=0.2')
      .to(loader, { autoAlpha: 0, duration: 0.9, ease: 'power2.out' }, '-=0.35');
  }
}

/* ---------- hero intro ---------- */
function introHero(instant = false) {
  const d = instant ? 0 : 1;
  gsap.timeline()
    .to('.hero__media video', { scale: 1, duration: 2.4 * d, ease: 'expo.out' })
    .to('.hero__title .line > span', { yPercent: 0, duration: 1.2 * d, stagger: 0.09, ease: 'expo.out' }, 0.15 * d)
    .to('.hero .reveal-up', { opacity: 1, y: 0, duration: 1 * d, stagger: 0.1, ease: 'power3.out' }, 0.5 * d)
    .from('.header', { opacity: 0, y: -20, duration: 0.8 * d, ease: 'power3.out' }, 0.4 * d);
}
gsap.set('.hero__title .line > span', { yPercent: 110 });

/* ---------- hero scroll-out ---------- */
gsap.timeline({
  scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
})
  .to('.hero__media', { yPercent: 18, scale: 1.08, ease: 'none' }, 0)
  .to('.hero__content', { y: -120, opacity: 0, ease: 'none' }, 0);

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

const tour = gsap.timeline({
  defaults: { ease: 'none' },
  scrollTrigger: {
    trigger: '.tour',
    start: 'top top',
    end: () => `+=${window.innerHeight * n * 1.1}`,
    pin: '.tour__stage',
    scrub: 1,
    anticipatePin: 1,
    invalidateOnRefresh: true,
  },
});

scenes.forEach((scene, i) => {
  const img = $('img', scene);
  const [s0, s1, x0, x1, y0, y1] = moves[i % moves.length];
  // each scene's camera drifts across its own window (plus overlap with neighbours)
  tour.fromTo(img, { scale: s0, xPercent: x0, yPercent: y0 }, { scale: s1, xPercent: x1, yPercent: y1, duration: 1.4 }, Math.max(0, i - 0.3));

  if (i > 0) {
    const at = i - 0.25;
    tour.to(scene, { clipPath: 'inset(0% 0 0 0)', duration: 0.5, ease: 'power2.inOut' }, at);
    tour.to(captions[i - 1], { autoAlpha: 0, y: -40, duration: 0.25, ease: 'power2.in' }, at);
    tour.fromTo(captions[i], { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, at + 0.25);
  }
});
tour.fromTo('.tour__progress span', { scaleY: 1 / n }, { scaleY: 1, duration: n - 0.25 }, 0);
tour.to({}, { duration: 0.3 }); // short hold on the last scene before releasing the pin

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

window.addEventListener('load', () => ScrollTrigger.refresh());
runLoader();
