import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react'
import { gsap, jumpTo, scrollTo, ScrollTrigger, reducedMotion } from './scroll'

// A small history-API router with real URLs (/about, /floor-plans…) and back/forward support.
// Page changes fade a dark curtain in, swap the page, jump to the top, then fade it out.
// The host must serve index.html for every path (see vercel.json).

const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())
const normalise = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p) || '/'
const getPath = () => normalise(window.location.pathname)
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

export function usePath() {
  return useSyncExternalStore(subscribe, getPath, () => '/')
}

const curtain = () => document.querySelector<HTMLElement>('.curtain')

/** Called by each page once it has rendered, to lift the curtain. */
export function revealPage() {
  const c = curtain()
  if (c) gsap.to(c, { autoAlpha: 0, duration: 0.6, ease: 'power2.out', delay: 0.05 })
}

let leaving = false
function swapTo(path: string, push: boolean) {
  if (push) window.history.pushState(null, '', path)
  jumpTo(0)
  notify()
  requestAnimationFrame(() => ScrollTrigger.refresh())
}

export function navigate(to: string) {
  if (to.startsWith('#')) { scrollTo(to === '#top' ? 0 : to); return }
  const path = normalise(to.split('#')[0] || window.location.pathname)
  if (path === getPath()) { scrollTo(0); return }
  const c = curtain()
  if (!c || reducedMotion) { swapTo(path, true); return }
  if (leaving) return
  leaving = true
  let done = false
  const go = () => { if (done) return; done = true; leaving = false; swapTo(path, true) }
  gsap.to(c, { autoAlpha: 1, duration: 0.45, ease: 'power2.in', onComplete: go })
  setTimeout(go, 700) // never let a paused animation block navigation
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    const c = curtain()
    if (c) gsap.set(c, { autoAlpha: 1 })
    swapTo(getPath(), false)
  })
}

export function Link({ to, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    window.dispatchEvent(new Event('menu:close'))
    navigate(to)
  }
  return <a href={to} onClick={handle} {...rest} />
}
