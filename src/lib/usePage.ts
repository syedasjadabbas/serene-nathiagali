import { useLayoutEffect, type RefObject } from 'react'
import { gsap, ScrollTrigger } from './scroll'
import { initScrollEffects, headerEffects, magnetic, splitHeadings } from './effects'
import { initWidgets } from './widgets'
import { revealPage } from './router'

const SITE = 'Serene Heights Nathia Gali'

/**
 * Wires a page up: title, widgets, scroll effects and the curtain.
 * `setup` runs first inside the same GSAP context (the homepage creates its pins there),
 * so effects further down the page measure the final layout.
 * `afterPaint` holds all of that until the browser has shown a first frame, for a page that draws
 * only its opening at first (see `data-boot` in Home): laying out and animating a whole long page
 * would otherwise keep the screen blank for seconds on a phone.
 */
export function usePage(root: RefObject<HTMLElement | null>, title: string, setup?: (el: HTMLElement) => (() => void) | void, options: { reveal?: boolean; afterPaint?: boolean } = {}) {
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    document.title = title ? `${title} — ${SITE}` : `${SITE} — Pakistan's First Winter Resort`
    let undo: (() => void) | undefined, left = false
    const start = () => {
      if (left || undo) return
      undo = wire(el)
    }
    if (options.afterPaint) {
      requestAnimationFrame(() => setTimeout(start))
      setTimeout(start, 400) // a tab in the background gets no frames
    } else start()
    return () => { left = true; undo?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const wire = (el: HTMLElement) => {
    el.removeAttribute('data-boot')
    splitHeadings(el)
    const offWidgets = initWidgets(el)
    let offSetup: (() => void) | void
    const ctx = gsap.context(() => {
      offSetup = setup?.(el)
      headerEffects(el)
      initScrollEffects(el)
    }, el)
    // child components may have made their triggers first: put everything back in page order
    ScrollTrigger.sort()
    const offMagnetic = magnetic(el)
    if (options.reveal !== false) revealPage()
    // images and fonts change the layout as they arrive
    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)
    const t = setTimeout(refresh, 600)
    return () => {
      clearTimeout(t)
      window.removeEventListener('load', refresh)
      offMagnetic()
      offSetup?.()
      ctx.revert()
      offWidgets()
      document.querySelector('.header')?.classList.remove('is-dark')
    }
  }
}
