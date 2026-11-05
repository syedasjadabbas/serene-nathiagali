import { useRef } from 'react'
import { Link } from '../lib/router'
import { usePage } from '../lib/usePage'
import { PaymentCalc } from '../components/PaymentCalc'

export default function PaymentPlan() {
  const root = useRef<HTMLDivElement>(null)
  usePage(root, 'Payment Plan')
  return (
    <div ref={root}>
      {/* ============ PAGE HERO ============ */}
      <section className="page-hero">
        <div className="page-hero__media"><img fetchPriority="high" src="/assets/img/renders/facade-entrance.jpg" alt="" /></div>
        <div className="page-hero__content">
          <nav className="crumbs reveal-up" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><span>Payment Plan</span></nav>
          <h1 className="split">Own it in<br />36 months</h1>
          <p className="reveal-up">Transparent pricing at PKR 40,000 per sq ft, from 30% at booking and the balance in 36 monthly installments.</p>
        </div>
      </section>

      <section className="payment" id="payment-plan">
        <ul className="price">
          <li><span>Base price</span><strong><small>PKR</small>40,000</strong><em>per sq ft</em></li>
          <li><span>Booking</span><strong><small>from</small>30%</strong><em>of total price</em></li>
          <li><span>Installment plan</span><strong>36</strong><em>monthly installments</em></li>
        </ul>

        <div className="payment__grid">
          <PaymentCalc />

          <div className="benefits">
            <h3>Owner benefits</h3>
            <p>Your apartment is professionally managed by DM Consortium as part of the hotel apartment building — a managed hospitality asset, not a traditional rental.</p>
            <ol>
              <li>Zero maintenance fees for owners</li>
              <li>Exclusive stay benefits for apartment owners</li>
              <li>Comprehensive operational cost coverage</li>
              <li>Extended stay discount for owners and family</li>
              <li>Profit sharing from hotel revenue streams</li>
              <li>Quarterly profit distribution to owners</li>
            </ol>
          </div>
        </div>
      </section>

      <div className="light">
        <section className="block">
          <div className="section-head">
            <span className="eyebrow">Our unique hotel apartments model</span>
            <h2 className="split">Managed by<br />DM Consortium</h2>
            <p className="section-head__text">Apartments are managed by hospitality professionals rather than individual owners — a unified approach that keeps standards consistent across the resort.</p>
          </div>
        <div className="features">
          <article className="feature">
            <span className="feature__num">01</span>
            <h3>Hotel apartment operations</h3>
            <p>Professional hotel apartment building operations, with centralized management for all owner apartments.</p>
          </article>
          <article className="feature">
            <span className="feature__num">02</span>
            <h3>Hospitality standards</h3>
            <p>Hotel-standard operating procedures and expert hospitality management.</p>
          </article>
          <article className="feature">
            <span className="feature__num">03</span>
            <h3>Coordinated guest services</h3>
            <p>Coordinated guest services and a unified guest experience across the entire resort.</p>
          </article>
          <article className="feature">
            <span className="feature__num">04</span>
            <h3>Professional staff</h3>
            <p>Professional staff coordination and integrated building systems management.</p>
          </article>
          <article className="feature">
            <span className="feature__num">05</span>
            <h3>Central administration</h3>
            <p>Centralized administrative functions — no individual landlord duties for owners.</p>
          </article>
          <article className="feature">
            <span className="feature__num">06</span>
            <h3>Zero maintenance fees</h3>
            <p>What you own is what you own — no maintenance charges and no hidden costs.</p>
          </article>
        </div>
          <Link className="link-more" to="/smart-property-unit">Prefer a smaller start? See Smart Property Units <span>→</span></Link>
        </section>
      </div>

      {/* ============ ENQUIRE ============ */}
      <section className="contact" id="enquire">
        <div className="contact__media"><img loading="lazy" decoding="async" src="/assets/img/renders/night-facade.jpg" alt="" /></div>
        <div className="contact__inner">
          <span className="eyebrow">Enquire now</span>
          <h2 className="contact__title split">Start with<br />30% booking</h2>
          <p>Our team will confirm current availability, pricing and your installment schedule.</p>
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
