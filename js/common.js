/* =========================================================
   Serene Heights — Nathia Gali
   Shared by every page: smooth scroll, menu, header, lightbox,
   page transitions, reveals and the reusable components.
   Pages with pinned sections (the homepage) set
   <body data-defer-effects> and call SH.initScrollEffects()
   after creating their pins, so positions are measured correctly.
   ========================================================= */
gsap.registerPlugin(ScrollTrigger);

/* ---------- always start at the top on load / refresh ---------- */
// ScrollTrigger flips history.scrollRestoration back to the browser default after every
// refresh unless told otherwise, which made reloads jump back to the old position.
ScrollTrigger.clearScrollMemory('manual');
if (location.hash) history.replaceState(null, '', location.pathname + location.search);
window.scrollTo(0, 0);
// While the homepage loader is up, nothing (including a late browser restore) may move the page.
window.addEventListener('scroll', () => {
  if (document.body.classList.contains('is-loading') && window.scrollY !== 0) window.scrollTo(0, 0);
});

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

// Mark the current page in the menu.
const currentPage = location.pathname.split('/').pop() || 'index.html';
$$('.menu a').forEach((a) => {
  if (a.getAttribute('href') === currentPage) a.setAttribute('aria-current', 'page');
});

/* ---------- links: in-page smooth scroll, cross-page fade ---------- */
const curtain = $('.curtain');
if (curtain) curtain.style.animation = 'none'; // JS is running: take over from the CSS fallback
function leaveTo(href) {
  if (!curtain || reduceMotion) { location.href = href; return; }
  let gone = false;
  const go = () => { if (!gone) { gone = true; location.href = href; } };
  gsap.to(curtain, { autoAlpha: 1, duration: 0.45, ease: 'power2.in', onComplete: go });
  setTimeout(go, 700); // never let a paused animation block navigation
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
  const href = a.getAttribute('href');
  if (href.startsWith('#')) {
    if (href.length < 2) return;
    e.preventDefault();
    setMenu(false);
    scrollToTarget(href === '#top' ? 0 : href);
    return;
  }
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || /^(mailto|tel):/.test(href)) return;
  if (url.pathname === location.pathname && !url.hash) {
    e.preventDefault();
    setMenu(false);
    scrollToTarget(0);
    return;
  }
  e.preventDefault();
  setMenu(false);
  leaveTo(url.href);
});
// Fade the curtain away on arrival (also when coming back via the browser's back button).
function revealPage() {
  if (curtain) gsap.to(curtain, { autoAlpha: 0, duration: 0.6, ease: 'power2.out', delay: 0.05 });
}
window.addEventListener('pageshow', (e) => {
  if (e.persisted) { window.scrollTo(0, 0); revealPage(); }
});

/* ---------- lightbox ---------- */
const lightbox = $('#lightbox');
const lightboxBody = lightbox && $('.lightbox__body', lightbox);
function openLightbox(html) {
  lightboxBody.innerHTML = html;
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
  lenis?.stop();
}
function closeLightbox() {
  if (!lightbox?.classList.contains('is-open')) return;
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  lightboxBody.innerHTML = ''; // stops any playing video
  lenis?.start();
}
if (lightbox) {
  $('.lightbox__close', lightbox).addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
}
const lightboxVideo = (id) => `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="Construction progress video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
  <a class="lightbox__link" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">Watch on YouTube ↗</a>`;

/* =========================================================
   Components — each only runs if its markup is on the page
   ========================================================= */

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
if (planImg) {
  const tabs = $('.plans__tabs');
  tabs.innerHTML = floors.map((f, i) =>
    `<button role="tab" aria-selected="${i === 0}" data-floor="${i}">${f.label}</button>`).join('');
  const showFloor = (i) => {
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
  };
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) showFloor(+b.dataset.floor);
  });
  $('.plans__open').addEventListener('click', () => openLightbox(`<img src="${planImg.src}" alt="${planImg.alt}">`));
  showFloor(0);
}

/* ---------- gallery ---------- */
// [file, caption, tile size, category]
const allShots = [
  ['sunset-rooftop', 'Rooftop terraces at sunset', 'big', 'exterior'],
  ['night-facade', 'Serene Heights lit up on a snowy night', 'tall', 'winter'],
  ['snow-tower', 'The tower in winter', '', 'winter'],
  ['snow-aerial-sunset', 'Aerial view over snowy pines at dusk', '', 'winter'],
  ['rooftop-terrace', 'Rooftop dining terrace', '', 'rooftop'],
  ['snow-valley', 'Tower above the snowy valley', '', 'winter'],
  ['rooftop-lounge', 'Sunlit rooftop lounge', 'wide', 'rooftop'],
  ['snow-street', 'Arrival road in the snow', '', 'winter'],
  ['rooftop-view', 'Rooftop restaurant overlooking the pines', '', 'rooftop'],
  ['snow-facade', 'Facade in fresh snow', '', 'winter'],
  ['tower-forest-mist', 'The tower rising above the pines and mist', 'big', 'exterior'],
  ['aerial-clouds', 'Aerial view above the clouds', 'wide', 'exterior'],
  ['tower-sky', 'Tower against the open sky', 'tall', 'exterior'],
  ['facade-entrance', 'Main entrance and facade', '', 'exterior'],
  ['tower-closeup', 'Upper floors and balconies', '', 'exterior'],
  ['aerial-pool', 'Rooftop infinity pool from above', '', 'rooftop'],
  ['rooftop-dining', 'Glass-walled rooftop restaurant', 'wide', 'rooftop'],
];
const shotsEl = $('#shots');
if (shotsEl) {
  const limit = +shotsEl.dataset.limit || allShots.length;
  const render = (cat) => {
    const list = allShots.filter((s) => cat === 'all' || s[3] === cat).slice(0, limit);
    shotsEl.innerHTML = list.map(([id, alt, size]) => `
      <button class="shot ${size}" data-full="assets/img/renders/${id}.jpg" aria-label="View full size: ${alt}">
        <img src="assets/img/renders/${id}-sm.jpg" alt="${alt}" loading="lazy">
      </button>`).join('');
  };
  render('all');
  shotsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.shot');
    if (b) openLightbox(`<img src="${b.dataset.full}" alt="${$('img', b).alt}">`);
  });
  const filters = $('.filters');
  filters?.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $$('button', filters).forEach((x) => x.setAttribute('aria-pressed', x === b));
    gsap.to(shotsEl, {
      opacity: 0, duration: 0.25,
      onComplete: () => { render(b.dataset.cat); gsap.to(shotsEl, { opacity: 1, duration: 0.4 }); ScrollTrigger.refresh(); },
    });
  });
}

/* ---------- payment calculator ---------- */
const PRICE_PER_SQFT = 40000;
const pkr = (n) => 'PKR ' + Math.round(n).toLocaleString('en-PK');
const calcArea = $('#calcArea');
if (calcArea) {
  const calcRange = $('#calcRange');
  const updateCalc = (area) => {
    const total = area * PRICE_PER_SQFT;
    const booking = total * 0.3;
    $('#calcTotal').textContent = pkr(total);
    $('#calcBooking').textContent = pkr(booking);
    $('#calcMonthly').textContent = pkr((total - booking) / 36);
  };
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
}

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
const milestoneHtml = ([date, id]) => `
  <button class="milestone" data-video="${id}" aria-label="Play construction progress video, ${date}">
    <span class="milestone__thumb">
      <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy">
      <span class="milestone__play">▶</span>
    </span>
    <span class="milestone__date">${date}</span>
  </button>`;
$$('#timeline, #progressList').forEach((list) => {
  list.innerHTML = milestones.map(milestoneHtml).join('');
  list.addEventListener('click', (e) => {
    const m = e.target.closest('.milestone');
    if (m) openLightbox(lightboxVideo(m.dataset.video));
  });
});

/* ---------- enquiry form (no backend: hands the message to WhatsApp or email) ---------- */
const form = $('#enquiryForm');
if (form) {
  const compose = () => {
    const d = Object.fromEntries(new FormData(form));
    return [
      'Enquiry — Serene Heights Nathia Gali',
      `Name: ${d.name}`,
      `Phone: ${d.phone}`,
      d.email && `Email: ${d.email}`,
      d.city && `City: ${d.city}`,
      d.interest && `Interested in: ${d.interest}`,
      d.message && `Message: ${d.message}`,
    ].filter(Boolean).join('\n');
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const via = e.submitter?.value || 'whatsapp';
    const text = compose();
    const url = via === 'email'
      ? `mailto:info@sereneheightsnathiagali.com?subject=${encodeURIComponent('Enquiry — Serene Heights Nathia Gali')}&body=${encodeURIComponent(text)}`
      : `https://wa.me/923214979447?text=${encodeURIComponent(text)}`;
    window.open(url, via === 'email' ? '_self' : '_blank', 'noopener');
    $('.form__note', form).textContent = via === 'email'
      ? 'Your email app has opened with the enquiry — just press send.'
      : 'WhatsApp has opened with your enquiry — just press send.';
  });
}

/* =========================================================
   Scroll-driven effects
   ========================================================= */

// Counts the first number in each element up from 0 when it scrolls into view,
// leaving any prefix/suffix ("+", "ft", "/7", "PKR") untouched.
function countUp(selector, trigger) {
  $$(selector).forEach((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode()) && !/\d/.test(node.nodeValue));
    if (!node || reduceMotion) return;
    const m = node.nodeValue.match(/\d[\d,]*/);
    const target = parseInt(m[0].replace(/,/g, ''), 10);
    const useCommas = m[0].includes(',');
    const before = node.nodeValue.slice(0, m.index);
    const after = node.nodeValue.slice(m.index + m[0].length);
    const fmt = (v) => (useCommas ? Math.round(v).toLocaleString('en-US') : String(Math.round(v)));
    const counter = { v: 0 };
    node.nodeValue = before + fmt(0) + after;
    gsap.to(counter, {
      v: target,
      duration: target > 1000 ? 2.2 : 1.8,
      ease: 'power2.out',
      onUpdate: () => { node.nodeValue = before + fmt(counter.v) + after; },
      scrollTrigger: { trigger: (trigger && el.closest(trigger)) || el, start: 'top 85%', once: true },
    });
  });
}

// Fades/lifts a group of elements in when their container scrolls into view.
function revealGroup(itemSel, from = { y: 50 }, start = 'top 88%') {
  $$(itemSel).map((el) => el.parentElement).filter((p, i, arr) => arr.indexOf(p) === i).forEach((parent) => {
    gsap.from($$(itemSel, parent).filter((el) => el.parentElement === parent), {
      ...from, opacity: 0, duration: 1.1, stagger: 0.07, ease: 'power3.out',
      scrollTrigger: { trigger: parent, start },
    });
  });
}

function initScrollEffects() {
  /* header colour over light sections */
  $$('.light').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 60px',
      end: 'bottom 60px',
      toggleClass: { targets: '.header', className: 'is-dark' },
    });
  });

  /* inner-page hero */
  if ($('.page-hero')) {
    gsap.timeline({ delay: 0.15 })
      .fromTo('.page-hero__media img', { scale: 1.2 }, { scale: 1.06, duration: 2.2, ease: 'expo.out' }, 0)
      .fromTo('.page-hero .line > span', { yPercent: 110 }, { yPercent: 0, duration: 1.2, stagger: 0.09, ease: 'expo.out' }, 0.2)
      .fromTo('.page-hero .reveal-up', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: 'power3.out' }, 0.5);
    gsap.to('.page-hero__media', {
      yPercent: 18, ease: 'none',
      scrollTrigger: { trigger: '.page-hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  }

  /* headings reveal line by line (skip the page hero, animated above) */
  $$('.split').filter((el) => !el.closest('.page-hero')).forEach((el) => {
    gsap.fromTo($$('.line > span', el), { yPercent: 105 }, {
      yPercent: 0, duration: 1.2, stagger: 0.08, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  countUp('.figures strong', '.figures');
  countUp('.price strong', '.price');

  $$('.card').forEach((card, i) => {
    gsap.from(card, {
      y: 80, opacity: 0, duration: 1.2, delay: (i % 3) * 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top 90%' },
    });
  });
  revealGroup('.figures li', { y: 40 }, 'top 90%');
  revealGroup('.tiles img', { y: 60 }, 'top 85%');
  revealGroup('.price li, .calc, .benefits', { y: 50 });
  revealGroup('.timeline .milestone', { x: 80 });
  revealGroup('.progress-list .milestone', { y: 60 });
  revealGroup('.distances li', { y: 30 }, 'top 92%');
  revealGroup('.feature', { y: 50 });
  revealGroup('.step', { y: 50 });
  revealGroup('.info-card', { y: 40 });
  revealGroup('.reveal', { y: 40 });
  if (shotsEl) {
    gsap.from(shotsEl, { y: 60, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: shotsEl, start: 'top 88%' } });
  }

  if ($('.location__media')) {
    gsap.to('.location__media', {
      yPercent: 12, ease: 'none',
      scrollTrigger: { trigger: '.location', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }
  if ($('.contact__media img')) {
    gsap.fromTo('.contact__media img', { scale: 1.25 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'top top', scrub: true },
    });
  }
}

window.addEventListener('load', () => {
  // Only reset while the homepage loader is up; never yank someone back once they are scrolling.
  if (document.body.classList.contains('is-loading')) window.scrollTo(0, 0);
  ScrollTrigger.refresh();
});

// Shared API for page scripts.
window.SH = { $, $$, lenis, reduceMotion, initScrollEffects, revealPage, openLightbox };

if (!document.body.hasAttribute('data-defer-effects')) {
  initScrollEffects();
  revealPage();
}
