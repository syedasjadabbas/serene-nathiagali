import { useEffect, useState, type ReactNode } from 'react'
import { Link, usePath } from '../lib/router'
import { lenis, ScrollTrigger, reducedMotion } from '../lib/scroll'
import { closeLightbox } from '../lib/lightbox'

export const MENU: [string, string][] = [
  ['/', 'Home'], ['/about', 'About'], ['/amenities', 'Amenities'], ['/floor-plans', 'Floor Plans'],
  ['/payment-plan', 'Payment Plan'], ['/smart-property-unit', 'Smart Property Unit'],
  ['/progress', 'Progress'], ['/gallery', 'Gallery'], ['/contact', 'Contact'],
]

/** Header, menu overlay, page curtain and lightbox, shared by every page. */
export function Layout({ children }: { children: ReactNode }) {
  const path = usePath()
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)

  // JS is running: take the curtain over from its CSS safety fallback
  useEffect(() => { const c = document.querySelector<HTMLElement>('.curtain'); if (c) c.style.animation = 'none' }, [])

  // menu: lock scrolling while open; any navigation closes it
  useEffect(() => {
    document.body.classList.toggle('menu-open', open)
    if (open) lenis?.stop(); else if (!document.body.classList.contains('is-loading')) lenis?.start()
  }, [open])
  useEffect(() => {
    const close = () => setOpen(false)
    window.addEventListener('menu:close', close)
    return () => window.removeEventListener('menu:close', close)
  }, [])
  useEffect(() => setOpen(false), [path])

  // header slips away while scrolling down and returns when scrolling up
  useEffect(() => {
    if (reducedMotion) return
    const st = ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => setHidden(self.direction > 0 && self.scroll() > window.innerHeight * 0.6),
    })
    return () => st.kill()
  }, [])

  // lightbox: Escape or a click on the backdrop closes it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { closeLightbox(); setOpen(false) } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <div className="curtain" aria-hidden="true" />

      {/* className stays constant: GSAP toggles is-dark on it, so hiding uses a data attribute */}
      <header className="header" data-hidden={hidden && !open ? 'true' : undefined}>
        <button className="pill" id="menuBtn" aria-expanded={open} aria-controls="menu" onClick={() => setOpen(!open)}>
          <span className="burger"><i /><i /></span> Menu
        </button>
        <Link to="/" className="logo" aria-label="Serene Heights Hotels & Resorts — home">
          <img className="logo__light" src="/assets/img/logo-sm.webp" width="240" height="167" alt="Serene Heights Hotels & Resorts" />
          <img className="logo__dark" src="/assets/img/logo-green-sm.webp" width="240" height="167" alt="" />
        </Link>
        <Link to="/contact" className="pill">Enquire</Link>
      </header>

      <nav className="menu" id="menu" aria-hidden={!open} inert={!open}>
        <ul>
          {MENU.map(([to, label]) => (
            <li key={to}><Link to={to} aria-current={path === to ? 'page' : undefined}>{label}</Link></li>
          ))}
        </ul>
        <p className="menu__foot"><a href="tel:042111111744">042-111-111-744</a> &nbsp;·&nbsp; <a href="mailto:sereneheightsnathiagali@gmail.com">sereneheightsnathiagali@gmail.com</a></p>
      </nav>

      <main id="top">{children}</main>

      <div className="lightbox" id="lightbox" aria-hidden="true" role="dialog" aria-modal="true"
        onClick={(e) => { if (e.target === e.currentTarget) closeLightbox() }}>
        <button className="lightbox__close pill" aria-label="Close" onClick={closeLightbox}>Close ✕</button>
        <div className="lightbox__body" />
      </div>
    </>
  )
}
