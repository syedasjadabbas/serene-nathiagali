import { useRef } from 'react'
import { Link } from '../lib/router'
import { usePage } from '../lib/usePage'
import { TowerModel } from '../components/TowerModel'

export default function FloorPlans() {
  const root = useRef<HTMLDivElement>(null)
  usePage(root, 'Floor Plans')
  return (
    <div ref={root}>
      {/* ============ PAGE HERO ============ */}
      <section className="page-hero">
        <div className="page-hero__media"><img src="/assets/img/renders/aerial-pool.jpg" alt="" /></div>
        <div className="page-hero__content">
          <nav className="crumbs reveal-up" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><span>Floor Plans</span></nav>
          <h1 className="split">Find your<br />apartment</h1>
          <p className="reveal-up">Every floor, every apartment number and area — fully furnished 1, 2 and 3 bed hotel apartments.</p>
        </div>
      </section>

      <TowerModel />

      <div className="light">
        <section className="plans" id="floor-plans">
          <div className="section-head">
            <span className="eyebrow">Floor by floor</span>
            <h2 className="split">Choose a floor</h2>
            <p className="section-head__text">Select a floor, then tap the plan to view it full size. Apartment numbers and areas (sq ft) are listed on each plan.</p>
          </div>
          <div className="plans__tabs" role="tablist" aria-label="Floors"></div>
          <figure className="plans__stage">
            <button className="plans__open" aria-label="View floor plan full size">
              <img id="planImg" src="/assets/img/floors/ground.jpg" alt="Ground floor plan" />
            </button>
            <figcaption><span id="planName">Ground floor</span><span id="planNote"></span></figcaption>
          </figure>
        </section>
      </div>

      <section className="block block--dark">
        <div className="section-head">
          <span className="eyebrow">Every apartment includes</span>
          <h2 className="split">Ready to live,<br />ready to earn</h2>
        </div>
        <div className="features">
          <article className="feature">
            <span className="feature__num">01</span>
            <h3>Fully furnished</h3>
            <p>Quality furnishings and fixtures — ready for your own stays or for guests from day one.</p>
          </article>
          <article className="feature">
            <span className="feature__num">02</span>
            <h3>Heated flooring</h3>
            <p>Central heating with heated floors throughout, for comfort through the Galyat winter.</p>
          </article>
          <article className="feature">
            <span className="feature__num">03</span>
            <h3>Valley views</h3>
            <p>A downhill site and double-glazed UPVC windows open every home onto the valley.</p>
          </article>
          <article className="feature">
            <span className="feature__num">04</span>
            <h3>Limestone &amp; marble</h3>
            <p>Classic limestone and marble finishing for a premium, lasting aesthetic.</p>
          </article>
          <article className="feature">
            <span className="feature__num">05</span>
            <h3>Managed for income</h3>
            <p>Rented out and managed by DM Consortium, with monthly rental income after operations.</p>
          </article>
          <article className="feature">
            <span className="feature__num">06</span>
            <h3>28 free nights</h3>
            <p>Owners enjoy 28 nights of free stay every year.</p>
          </article>
        </div>
        <Link className="link-more" to="/payment-plan">See the payment plan <span>→</span></Link>
      </section>

      {/* ============ ENQUIRE ============ */}
      <section className="contact" id="enquire">
        <div className="contact__media"><img src="/assets/img/renders/tower-closeup.jpg" alt="" /></div>
        <div className="contact__inner">
          <span className="eyebrow">Enquire now</span>
          <h2 className="contact__title split">Pick your<br />apartment</h2>
          <p>Talk to our team about availability on each floor and the 36-month payment plan.</p>
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
