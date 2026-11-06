import { useRef } from 'react'
import { Link } from '../lib/router'
import { usePage } from '../lib/usePage'

export default function Progress() {
  const root = useRef<HTMLDivElement>(null)
  usePage(root, 'Construction Progress')
  return (
    <div ref={root}>
      {/* ============ PAGE HERO ============ */}
      <section className="page-hero">
        <div className="page-hero__media"><img fetchPriority="high" srcSet="/assets/img/renders/snow-tower-m.webp 1280w" sizes="100vw" src="/assets/img/renders/snow-tower.jpg" alt="" /></div>
        <div className="page-hero__content">
          <nav className="crumbs reveal-up" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><span>Progress</span></nav>
          <h1 className="split">Rising in<br />the pines</h1>
          <p className="reveal-up">From groundbreaking in December 2021 to today — watch every milestone on site.</p>
        </div>
      </section>

      <section className="block block--night">
        <div className="section-head">
          <span className="eyebrow">Construction timeline</span>
          <h2 className="split">Every milestone,<br />on video</h2>
          <p className="section-head__text">Tap any milestone to watch the site update. The newest video is first.</p>
        </div>
        <div className="progress-list" id="progressList"></div>
      </section>

      {/* ============ ENQUIRE ============ */}
      <section className="contact" id="enquire">
        <div className="contact__media"><img loading="lazy" decoding="async" srcSet="/assets/img/renders/tower-sky-m.webp 1280w, /assets/img/renders/tower-sky.webp 2048w" sizes="100vw" src="/assets/img/renders/tower-sky.jpg" alt="" /></div>
        <div className="contact__inner">
          <span className="eyebrow">Enquire now</span>
          <h2 className="contact__title split">See it<br />in person</h2>
          <p>Book a site visit and see the progress at Serene Heights for yourself.</p>
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
