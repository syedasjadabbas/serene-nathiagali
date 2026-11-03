import { useRef } from 'react'
import { Link } from '../lib/router'
import { usePage } from '../lib/usePage'

export default function About() {
  const root = useRef<HTMLDivElement>(null)
  usePage(root, 'About')
  return (
    <div ref={root}>
      {/* ============ PAGE HERO ============ */}
      <section className="page-hero">
        <div className="page-hero__media"><img src="/assets/img/renders/tower-forest-mist.jpg" alt="" /></div>
        <div className="page-hero__content">
          <nav className="crumbs reveal-up" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><span>About</span></nav>
          <h1 className="split">Redefining<br />resort living</h1>
          <p className="reveal-up">Pakistan's first resort that blends modern comfort with breathtaking mountain views — in the heart of the Galyat.</p>
        </div>
      </section>

      <div className="light">
        <section className="block">
          <span className="eyebrow">Welcome to Serene Heights</span>
          <p className="statement reveal">Serene Heights is not just an accommodation but a <em>lifestyle destination</em> — world-class amenities and activities at 7,906 ft, with innovative financial models that make real estate in Pakistan <em>more liquid and more accessible</em> for everyone.</p>
        </section>

        <section className="block" style={{ paddingTop: '0' }}>
          <div className="two-col">
            <div className="media-frame reveal"><img src="/assets/img/renders/tower-closeup-sm.jpg" alt="Serene Heights tower in the pines" loading="lazy" /></div>
            <div className="prose reveal">
              <span className="eyebrow">Project details</span>
              <p>Serene Heights Nathia Gali is positioned as Pakistan’s first winter resort concept, offering a blend of luxury apartments, resort activities and high-end hospitality services.</p>
              <p>With 30+ kanals of project area, 150+ apartments, 3 towers, 50+ amenities and a location altitude of 7,906 feet, the project is planned to deliver a premium lifestyle experience in Nathia Gali.</p>
              <p>Developed and managed by DM Consortium. Stay tuned for exciting future projects as we go beyond mountains and borders.</p>
            </div>
          </div>
        </section>

        <section className="block" style={{ paddingTop: '0' }}>
          <ul className="figures">
            <li><strong>30+</strong><span>Kanals of project area</span></li>
            <li><strong>150+</strong><span>Apartments</span></li>
            <li><strong>3</strong><span>Towers</span></li>
            <li><strong>50+</strong><span>Amenities</span></li>
          </ul>
        </section>
      </div>

      <section className="block block--dark">
        <div className="section-head">
          <span className="eyebrow">Our founder's philosophy</span>
          <h2 className="split">Fahad Masud Lone</h2>
          <p className="section-head__text">Visionary CEO behind Serene Heights Nathia Gali.</p>
        </div>
        <div className="features">
          <article className="feature">
            <span className="feature__num">01</span>
            <h3>Purpose-driven business</h3>
            <p>Fahad's eight-plus years as an entrepreneur have centered on building businesses that create lasting, meaningful impact — not just short-term returns.</p>
          </article>
          <article className="feature">
            <span className="feature__num">02</span>
            <h3>Transparent ownership</h3>
            <p>Serene Heights was built around a simple promise: zero maintenance charges, zero hidden costs. What you own is what you own — nothing more to pay for later.</p>
          </article>
          <article className="feature">
            <span className="feature__num">03</span>
            <h3>Leadership &amp; education</h3>
            <p>Through “The Art of Being a CEO,” Fahad shares the leadership, decision-making and scaling principles behind his own entrepreneurial journey.</p>
          </article>
        </div>
      </section>

      <section className="location" id="location">
        <div className="location__media"><img src="/assets/img/renders/aerial-clouds.jpg" alt="" /></div>
        <div className="location__inner">
          <span className="eyebrow">Location</span>
          <h2 className="split">Two hours from Islamabad.<br />A world away from it.</h2>
          <ul className="distances">
            <li><span>PAF Airbase Nathia Gali</span><strong>50 m</strong></li>
            <li><span>Main Nathia Gali Road</span><strong>1.5 km <em>3 min</em></strong></li>
            <li><span>Hotel Elites Nathia Gali</span><strong>3 km <em>6 min</em></strong></li>
            <li><span>Main Bazar Nathia Gali</span><strong>5 km <em>10 min</em></strong></li>
            <li><span>Abbottabad City Center</span><strong>35 km <em>50 min</em></strong></li>
            <li><span>Islamabad</span><strong>80 km <em>2 hrs</em></strong></li>
          </ul>
        </div>
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
