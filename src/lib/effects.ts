import { gsap, ScrollTrigger, reducedMotion } from './scroll'
import { coarsePointer } from './device'

const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode) => [...root.querySelectorAll<T>(sel)]

/* ---------- text preparation (runs once per element) ---------- */

/** Splits `.split` headings into masked lines at each <br>. */
export function splitHeadings(root: ParentNode) {
  $$('.split', root).forEach((el) => {
    if (el.dataset.split) return
    el.dataset.split = '1'
    el.innerHTML = el.innerHTML
      .split(/<br\s*\/?>/i)
      .map((part) => `<span class="line"><span>${part.trim()}</span></span>`)
      .join('')
  })
}

/** Wraps every word of `.statement` in a span so it can light up as you scroll. */
function splitWords(el: HTMLElement) {
  if (el.dataset.words) return
  el.dataset.words = '1'
  const walk = (node: Node) => {
    ;[...node.childNodes].forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment()
        ;(n.textContent ?? '').split(/(\s+)/).forEach((part) => {
          if (!part) return
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part))
          else { const s = document.createElement('span'); s.className = 'word'; s.textContent = part; frag.appendChild(s) }
        })
        n.replaceWith(frag)
      } else if (n.nodeType === Node.ELEMENT_NODE) walk(n)
    })
  }
  walk(el)
}

/* ---------- count-up numbers ---------- */
// Counts the first number in each element up from 0 when it scrolls into view,
// leaving any prefix/suffix ("+", "ft", "/7", "PKR") untouched.
function countUp(root: ParentNode, selector: string, trigger: string) {
  $$(selector, root).forEach((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    let node: Node | null
    while ((node = walker.nextNode()) && !/\d/.test(node.nodeValue ?? ''));
    if (!node) return
    const text = node.nodeValue ?? ''
    const m = text.match(/\d[\d,]*/)
    if (!m || m.index === undefined) return
    const target = parseInt(m[0].replace(/,/g, ''), 10)
    const useCommas = m[0].includes(',')
    const before = text.slice(0, m.index)
    const after = text.slice(m.index + m[0].length)
    const fmt = (v: number) => (useCommas ? Math.round(v).toLocaleString('en-US') : String(Math.round(v)))
    const counter = { v: 0 }
    const textNode = node
    textNode.nodeValue = before + fmt(0) + after
    gsap.to(counter, {
      v: target,
      duration: target > 1000 ? 2.2 : 1.8,
      ease: 'power2.out',
      onUpdate: () => { textNode.nodeValue = before + fmt(counter.v) + after },
      scrollTrigger: { trigger: el.closest(trigger) || el, start: 'top 85%', once: true },
    })
  })
}

/** Fades/lifts a group of elements in when their container scrolls into view. */
function revealGroup(root: ParentNode, itemSel: string, from: gsap.TweenVars = { y: 50 }, start = 'top 88%') {
  // an element matched by two groups would get two from-tweens, and the second would record the
  // first one's hidden state as its end point, leaving the element stuck almost invisible
  const fresh = $$(itemSel, root).filter((el) => !el.dataset.revealed)
  fresh.forEach((el) => { el.dataset.revealed = '1' })
  const parents = new Set(fresh.map((el) => el.parentElement!))
  parents.forEach((parent) => {
    const items = fresh.filter((el) => el.parentElement === parent)
    gsap.from(items, {
      ...from, opacity: 0, duration: 1.1, stagger: 0.07, ease: 'power3.out',
      scrollTrigger: { trigger: parent, start },
    })
  })
}

/**
 * All scroll-driven effects for a page. Call inside gsap.context(…, root) so everything is
 * reverted when the page unmounts. Pages with pins create those first.
 */
export function initScrollEffects(root: HTMLElement) {
  splitHeadings(root)
  if (reducedMotion) return

  /* inner-page hero */
  const pageHero = root.querySelector('.page-hero')
  if (pageHero) {
    gsap.timeline({ delay: 0.15 })
      .fromTo($$('.page-hero__media img', root), { scale: 1.25 }, { scale: 1.06, duration: 2.2, ease: 'expo.out' }, 0)
      .fromTo($$('.page-hero .line > span', root), { yPercent: 110 }, { yPercent: 0, duration: 1.2, stagger: 0.09, ease: 'expo.out' }, 0.2)
      .fromTo($$('.page-hero .reveal-up', root), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: 'power3.out' }, 0.5)
    gsap.to($$('.page-hero__media', root), {
      yPercent: 18, ease: 'none',
      scrollTrigger: { trigger: pageHero, start: 'top top', end: 'bottom top', scrub: true },
    })
    gsap.to($$('.page-hero__content', root), {
      y: -80, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: pageHero, start: 'top top', end: 'bottom top', scrub: true },
    })
  }

  /* headings reveal line by line (the hero ones are animated above / by the homepage) */
  $$('.split', root).filter((el) => !el.closest('.page-hero, .hero')).forEach((el) => {
    gsap.fromTo($$('.line > span', el), { yPercent: 110, rotate: 2 }, {
      yPercent: 0, rotate: 0, duration: 1.2, stagger: 0.08, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 86%' },
    })
  })

  /* eyebrows draw their rule, supporting text rises */
  $$('.eyebrow', root).filter((el) => !el.closest('.page-hero, .hero')).forEach((el) => {
    gsap.from(el, { opacity: 0, x: -24, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } })
  })
  $$('.section-head__text, .prose p, .contact__inner p, .calc__note, .note', root).forEach((el) => {
    gsap.from(el, { opacity: 0, y: 30, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } })
  })

  /* statements light up word by word with the scroll */
  $$('.statement', root).forEach((el) => {
    splitWords(el)
    gsap.fromTo($$('.word', el), { opacity: 0.14 }, {
      opacity: 1, stagger: 0.08, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
    })
  })

  /* images unmask upwards and settle from a zoom */
  $$('.media-frame, .card__img, .shot, .milestone__thumb, .plans__open, .map', root).forEach((frame) => {
    const img = frame.querySelector('img, iframe')
    gsap.fromTo(frame, { clipPath: 'inset(100% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut',
      scrollTrigger: { trigger: frame, start: 'top 90%' },
    })
    if (img) gsap.fromTo(img, { scale: 1.3 }, { scale: 1, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: frame, start: 'top 90%' } })
  })
  /* …and keep drifting gently while on screen */
  $$('.card__img img, .media-frame img', root).forEach((img) => {
    gsap.fromTo(img, { yPercent: -6 }, {
      yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    })
  })

  countUp(root, '.figures strong', '.figures')
  countUp(root, '.price strong', '.price')

  $$('.card', root).forEach((card, i) => {
    gsap.from(card, {
      y: 100, opacity: 0, duration: 1.3, delay: (i % 3) * 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top 92%' },
    })
  })
  revealGroup(root, '.figures li', { y: 40 }, 'top 90%')
  revealGroup(root, '.tiles .tile', { y: 60, scale: 0.92 }, 'top 85%')
  revealGroup(root, '.price li, .calc, .benefits', { y: 50 })
  revealGroup(root, '.timeline .milestone', { x: 80 })
  revealGroup(root, '.progress-list .milestone', { y: 60 })
  revealGroup(root, '.distances li', { y: 30 }, 'top 92%')
  revealGroup(root, '.feature', { y: 50 })
  revealGroup(root, '.step', { y: 60, rotate: 2 })
  revealGroup(root, '.info-card', { y: 40 })
  revealGroup(root, '.reveal', { y: 40 })
  revealGroup(root, '.data-table', { y: 60 })
  revealGroup(root, '.plans__tabs button, .filters button', { y: 16 }, 'top 92%')

  /* backgrounds of full-bleed sections drift */
  $$('.location', root).forEach((sec) => {
    const media = sec.querySelector('.location__media')
    if (media) gsap.to(media, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } })
  })
  $$('.contact', root).forEach((sec) => {
    const img = sec.querySelector('.contact__media img')
    if (img) gsap.fromTo(img, { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top top', scrub: true } })
  })

  /* sections slide up over the previous one with rounded corners */
  $$('.rise', root).forEach((sec) => {
    gsap.fromTo(sec, { borderTopLeftRadius: 40, borderTopRightRadius: 40 }, {
      borderTopLeftRadius: 0, borderTopRightRadius: 0, ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top 30%', scrub: true },
    })
  })

  /* marquee: drifts on its own, speeds up and reverses with the scroll */
  $$('.marquee__track', root).forEach((track) => {
    const loop = gsap.to(track, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 })
    ScrollTrigger.create({
      trigger: track, start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => {
        const v = self.getVelocity() / 300
        gsap.to(loop, { timeScale: (self.direction || 1) * Math.max(1, Math.min(6, Math.abs(v))), duration: 0.3, overwrite: true })
        gsap.to(loop, { timeScale: self.direction || 1, duration: 1.2, delay: 0.3 })
      },
    })
  })

  /* horizontal strip: the section pins and the row scrolls sideways (desktop) */
  const mm = gsap.matchMedia()
  mm.add('(min-width: 901px)', () => {
    $$('.hscroll', root).forEach((sec) => {
      const row = sec.querySelector<HTMLElement>('.hscroll__row')
      if (!row) return
      const distance = () => row.scrollWidth - window.innerWidth + 80
      gsap.to(row, {
        x: () => -distance(), ease: 'none',
        // the row travels faster than the scroll, so the pin doesn't feel like a long detour
        scrollTrigger: { trigger: sec, start: 'top top', end: () => `+=${distance() * 0.6}`, pin: true, scrub: 0.3, invalidateOnRefresh: true, anticipatePin: 1 },
      })
    })
  })
}

/* ---------- magnetic buttons (desktop pointer only) ---------- */
export function magnetic(root: ParentNode) {
  if (coarsePointer || reducedMotion) return () => {}
  const els = $$('.btn, .pill, .link-more', root)
  const offs = els.map((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' })
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - (r.left + r.width / 2)) * 0.25)
      yTo((e.clientY - (r.top + r.height / 2)) * 0.35)
    }
    const leave = () => { xTo(0); yTo(0) }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave) }
  })
  return () => offs.forEach((off) => off())
}

/* ---------- header: dark over light sections, hides while scrolling down ---------- */
export function headerEffects(root: ParentNode) {
  // the header lives outside the page, so pass the element (selectors are scoped to the page)
  const header = document.querySelector('.header')
  if (!header) return
  $$('.light', root).forEach((section) => {
    ScrollTrigger.create({
      trigger: section, start: 'top 60px', end: 'bottom 60px',
      toggleClass: { targets: header, className: 'is-dark' },
    })
  })
}
