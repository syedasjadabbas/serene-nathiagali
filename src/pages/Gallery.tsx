import { useRef } from 'react'
import { Link } from '../lib/router'
import { usePage } from '../lib/usePage'

export default function Gallery() {
  const root = useRef<HTMLDivElement>(null)
  usePage(root, 'Gallery')
  return (
    <div ref={root}>
      {/* ============ PAGE HERO ============ */}
      <section className="page-hero">
        <div className="page-hero__media"><img src="/assets/img/renders/sunset-rooftop.jpg" alt="" /></div>
        <div className="page-hero__content">
          <nav className="crumbs reveal-up" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><span>Gallery</span></nav>
          <h1 className="split">Every season,<br />every angle</h1>
          <p className="reveal-up">Renders of Serene Heights through mist, snow, sunset and night. Tap any image to view it full size.</p>
        </div>
      </section>

      <section className="gallery">
        <div className="filters" role="group" aria-label="Filter gallery">
          <button data-cat="all" aria-pressed="true">All</button>
          <button data-cat="exterior" aria-pressed="false">Exterior</button>
          <button data-cat="rooftop" aria-pressed="false">Rooftop</button>
          <button data-cat="winter" aria-pressed="false">Winter</button>
        </div>
        <div className="shots" id="shots"></div>
      </section>

      {/* ============ ENQUIRE ============ */}
      <section className="contact" id="enquire">
        <div className="contact__media"><img src="/assets/img/renders/facade-entrance.jpg" alt="" /></div>
        <div className="contact__inner">
          <span className="eyebrow">Enquire now</span>
          <h2 className="contact__title split">Your home<br />in the highlands</h2>
          <p>Book a visit, request a brochure or ask about the 36-month payment plan.</p>
          <Link className="btn btn--light" to="/contact">Get in touch <span className="btn__dot">→</span></Link>
          <div className="phones">
            <a href="tel:042111111744">042-111-111-744</a>
            <a href="tel:+923008497999">+92 300 8497999</a>
          </div>
        </div>
        <footer className="footer">
          <span>© 2026 Serene Heights Hotels &amp; Resorts · DM Consortium</span>
          <span className="socials">
            <a href="https://www.instagram.com/sereneheightshotelsandresorts/" target="_blank" rel="noopener">Instagram</a>
            <a href="https://www.facebook.com/sereneheightshotelsandresorts" target="_blank" rel="noopener">Facebook</a>
            <a href="https://youtube.com/@sereneheightsnathiagali5573" target="_blank" rel="noopener">YouTube</a>
          </span>
          <Link to="#top">Back to top ↑</Link>
        </footer>
      </section>
  
    </div>
  )
}
