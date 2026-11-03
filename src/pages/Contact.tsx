import { useRef } from 'react'
import { Link } from '../lib/router'
import { usePage } from '../lib/usePage'

export default function Contact() {
  const root = useRef<HTMLDivElement>(null)
  usePage(root, 'Contact')
  return (
    <div ref={root}>
      {/* ============ PAGE HERO ============ */}
      <section className="page-hero">
        <div className="page-hero__media"><img src="/assets/img/renders/tower-sky.jpg" alt="" /></div>
        <div className="page-hero__content">
          <nav className="crumbs reveal-up" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><span>Contact</span></nav>
          <h1 className="split">Let’s talk</h1>
          <p className="reveal-up">Any question or remark? Our friendly team is always here to help — call, WhatsApp or send us a message.</p>
        </div>
      </section>

      <div className="light">
        <section className="block">
          <div className="info-cards">
            <a className="info-card" href="tel:042111111744"><span>UAN</span><strong>042-111-111-744</strong></a>
            <a className="info-card" href="tel:+923008497999"><span>Phone</span><strong>+92 300 8497999</strong></a>
            <a className="info-card" href="https://wa.me/923214979447" target="_blank" rel="noopener"><span>WhatsApp</span><strong>+92 321 4979447</strong></a>
            <a className="info-card" href="mailto:info@sereneheightsnathiagali.com"><span>Email</span><strong>info@sereneheightsnathiagali.com</strong></a>
            <div className="info-card"><span>Project</span><strong>Serene Heights, 1.5 km Kala Bagh Air Base Road, Nathia Gali</strong></div>
            <div className="info-card"><span>Head office</span><strong>DM Consortium, H. No. 71 C3 Gulberg III, Park View Lane, Lahore</strong></div>
          </div>
        </section>
      </div>

      <section className="block block--dark" id="enquire">
        <div className="two-col">
          <div>
            <div className="section-head" style={{ marginBottom: '32px' }}>
              <span className="eyebrow">Enquire now</span>
              <h2 className="split">Write us<br />a message</h2>
              <p className="section-head__text">Fill in your details and send them straight to our team on WhatsApp or by email.</p>
            </div>
          </div>
          <form className="form" id="enquiryForm" noValidate>
            <label>Name<input name="name" required autoComplete="name" /></label>
            <label>Phone number<input name="phone" type="tel" required autoComplete="tel" /></label>
            <label>Email<input name="email" type="email" autoComplete="email" /></label>
            <label>City<input name="city" autoComplete="address-level2" /></label>
            <label className="full">Interested in
              <select name="interest">
                <option value="">Select your interest</option>
                <option>Hotel apartment</option>
                <option>Hotel room</option>
                <option>Smart Property Unit</option>
                <option>Site visit</option>
                <option>Something else</option>
              </select>
            </label>
            <label className="full">Message<textarea name="message"></textarea></label>
            <div className="form__actions full">
              <button className="btn" type="submit" value="whatsapp">Send on WhatsApp <span className="btn__dot">→</span></button>
              <button className="btn" type="submit" value="email">Send by email <span className="btn__dot">→</span></button>
            </div>
            <p className="form__note full" aria-live="polite"></p>
          </form>
        </div>
      </section>

      <section className="location">
        <div className="location__media"><img src="/assets/img/renders/aerial-clouds.jpg" alt="" /></div>
        <div className="location__inner">
          <span className="eyebrow">Nearby Serene Heights</span>
          <h2 className="split">Find us in<br />Nathia Gali</h2>
          <div className="map reveal" style={{ marginTop: '40px' }}>
            <iframe src="https://www.google.com/maps?q=Serene+Heights+Nathia+Gali&amp;output=embed" title="Map of Serene Heights Nathia Gali" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
          </div>
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

      <section className="block block--dark" style={{ padding: '0' }}>
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
