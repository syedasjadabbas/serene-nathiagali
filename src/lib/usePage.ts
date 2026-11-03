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
 */
export function usePage(root: RefObject<HTMLElement | null>, title: string, setup?: (el: HTMLElement) => (() => void) | void, options: { reveal?: boolean } = {}) {
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    document.title = title ? `${title} — ${SITE}` : `${SITE} — Pakistan's First Winter Resort`
    splitHeadings(el)
    const offWidgets = initWidgets(el)
    let offSetup: (() => void) | void
    const ctx = gsap.context(() => {
      offSetup = setup?.(el)
      headerEffects(el)
      initScrollEffects(el)
    }, el)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
