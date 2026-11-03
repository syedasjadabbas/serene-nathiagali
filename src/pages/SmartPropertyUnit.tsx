import { useRef } from 'react'
import { Link } from '../lib/router'
import { usePage } from '../lib/usePage'

export default function SmartPropertyUnit() {
  const root = useRef<HTMLDivElement>(null)
  usePage(root, 'Smart Property Unit')
  return (
    <div ref={root}>
      {/* ============ PAGE HERO ============ */}
      <section className="page-hero">
        <div className="page-hero__media"><img src="/assets/img/renders/snow-aerial-sunset.jpg" alt="" /></div>
        <div className="page-hero__content">
          <nav className="crumbs reveal-up" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><span>Smart Property Unit</span></nav>
          <h1 className="split">Co-own<br />the highlands</h1>
          <p className="reveal-up">Invest in premium mountain real estate without buying a whole apartment — own Serene Heights in standard units of 50 sq ft.</p>
        </div>
      </section>

      <div className="light">
        <section className="block">
          <span className="eyebrow">What is a Smart Property Unit?</span>
          <p className="statement reveal">A revolutionary way to invest in premium real estate. With just <em>50 sq ft per unit</em>, you co-own a luxury apartment in one of Nathia Gali’s most sought-after developments — and on completion, DM Consortium rents it out and <em>distributes the rental income</em> according to your units.</p>
        </section>
      </div>

      <section className="block block--dark">
        <div className="section-head">
          <span className="eyebrow">Payment plan &amp; returns</span>
          <h2 className="split">One unit,<br />clear numbers</h2>
        </div>
        <div className="data-grid">
          <div className="data-table reveal">
            <h3>Payment plan</h3>
            <p>01 unit of 50 sq ft</p>
            <dl>
              <div><dt>Unit size</dt><dd>50 sq ft</dd></div>
              <div className="is-total"><dt>Unit value</dt><dd>PKR 2,250,000</dd></div>
              <div><dt>Down payment (30%)</dt><dd>PKR 675,000</dd></div>
              <div><dt>36 monthly installments</dt><dd>PKR 43,750</dd></div>
            </dl>
          </div>
          <div className="data-table reveal">
            <h3>Return on investment</h3>
            <p>As projected by the developer</p>
            <dl>
              <div><dt>Investment amount</dt><dd>PKR 2,250,000</dd></div>
              <div><dt>Expected annual rental income</dt><dd>PKR 300,000</dd></div>
              <div><dt>Annual capital gain</dt><dd>5%</dd></div>
              <div className="is-total"><dt>ROI</dt><dd>13 – 15%</dd></div>
            </dl>
          </div>
        </div>
        <p className="note">Projected figures are provided by DM Consortium and are not guaranteed. Please confirm current pricing and terms with the sales team.</p>
      </section>

      <section className="block block--night">
        <div className="section-head">
          <span className="eyebrow">How it works</span>
          <h2 className="split">Five simple steps</h2>
        </div>
        <ol className="steps">
          <li className="step"><h3>Fill booking form</h3><p>Apply easily with just a few personal and financial details.</p></li>
          <li className="step"><h3>Choose payment plan</h3><p>Affordable down payment and easy monthly installments.</p></li>
          <li className="step"><h3>Confirm ownership</h3><p>Once payments are complete, your Smart Property Unit is secured.</p></li>
          <li className="step"><h3>Managed by experts</h3><p>DM Consortium takes care of rentals, maintenance and returns.</p></li>
          <li className="step"><h3>Transferable units</h3><p>Sell or transfer your ownership anytime.</p></li>
        </ol>
      </section>

      <div className="light">
        <section className="block">
          <div className="section-head">
            <span className="eyebrow">Why Smart Property Unit @ Serene Heights?</span>
            <h2 className="split">Start small,<br />grow smart</h2>
          </div>
        <div className="features">
          <article className="feature">
            <span className="feature__num">01</span>
            <h3>Affordable investment</h3>
            <p>Own premium property in installments. Start small, grow smart.</p>
          </article>
          <article className="feature">
            <span className="feature__num">02</span>
            <h3>Simple process</h3>
            <p>Hassle-free investment, just like buying a full unit.</p>
          </article>
          <article className="feature">
            <span className="feature__num">03</span>
            <h3>Secure contracts</h3>
            <p>Every unit is protected by legal agreements.</p>
          </article>
          <article className="feature">
            <span className="feature__num">04</span>
            <h3>100% legal compliance</h3>
            <p>All transactions are fully Shariah-compliant and legally secure.</p>
          </article>
          <article className="feature">
            <span className="feature__num">05</span>
            <h3>Standardized units</h3>
            <p>Buy in fixed units of 50 sq ft — clear and fair.</p>
          </article>
          <article className="feature">
            <span className="feature__num">06</span>
            <h3>Prime location</h3>
            <p>In the heart of Nathia Gali, near major access points.</p>
          </article>
          <article className="feature">
            <span className="feature__num">07</span>
            <h3>Modern design</h3>
            <p>Luxury apartments with contemporary finishes and smart space planning.</p>
          </article>
          <article className="feature">
            <span className="feature__num">08</span>
            <h3>Rental income</h3>
            <p>Managed rentals through the Smart Property Unit programme.</p>
          </article>
          <article className="feature">
            <span className="feature__num">09</span>
            <h3>Backed by experts</h3>
            <p>Powered by trusted developers and managed by DM Consortium.</p>
          </article>
        </div>
        </section>
      </div>

      {/* ============ ENQUIRE ============ */}
      <section className="contact" id="enquire">
        <div className="contact__media"><img src="/assets/img/renders/aerial-clouds.jpg" alt="" /></div>
        <div className="contact__inner">
          <span className="eyebrow">Enquire now</span>
          <h2 className="contact__title split">Own your first<br />unit today</h2>
          <p>Ask our team for a booking form and the current unit availability.</p>
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
