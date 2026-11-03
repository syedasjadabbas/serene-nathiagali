import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
// sections that aren't on every page leave some groups empty; that's expected
gsap.config({ nullTargetWarn: false })
// phones resize the viewport as the address bar hides; don't recalculate every pin for that
ScrollTrigger.config({ ignoreMobileResize: true })
// ScrollTrigger otherwise flips history.scrollRestoration back to the browser default after
// every refresh, which makes reloads jump back to the old position.
ScrollTrigger.clearScrollMemory('manual')

export const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export let lenis: Lenis | null = null

// Smooth scroll driven by GSAP's ticker so ScrollTrigger and Lenis stay in sync.
export function startSmoothScroll() {
  if (lenis || reducedMotion) return lenis
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis?.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
  // re-measure the page whenever pins/spacers are recalculated, so the scroll limit never goes stale
  ScrollTrigger.addEventListener('refresh', () => lenis?.resize())
  return lenis
}

export function scrollTo(target: string | HTMLElement | number, duration = 1.6) {
  if (lenis) {
    lenis.start()
    lenis.scrollTo(target, { duration: target === 0 ? 2 : duration, force: true })
  } else if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: reducedMotion ? 'auto' : 'smooth' })
  } else {
    const el = typeof target === 'string' ? document.querySelector(target) : target
    el?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
  }
}

/** Jump without animation, even while scrolling is locked. */
export function jumpTo(y: number) {
  window.scrollTo(0, y)
  if (lenis) { lenis.resize(); lenis.scrollTo(y, { immediate: true, force: true }) }
}

// Locking must not touch `overflow`: hiding the page's overflow breaks position: sticky,
// so sticky sections (the 3D map) vanish for as long as the lock lasts.
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '])
const blockScroll = (e: Event) => e.preventDefault()
const blockKeys = (e: KeyboardEvent) => { if (SCROLL_KEYS.has(e.key)) e.preventDefault() }

export function lockScroll(locked: boolean) {
  if (lenis) locked ? lenis.stop() : lenis.start()
  const method = locked ? 'addEventListener' : 'removeEventListener'
  window[method]('wheel', blockScroll, { passive: false } as AddEventListenerOptions)
  window[method]('touchmove', blockScroll, { passive: false } as AddEventListenerOptions)
  window[method]('keydown', blockKeys as EventListener)
}

export { gsap, ScrollTrigger }
