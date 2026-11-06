import { useRef } from 'react'
import { Link } from '../lib/router'
import { usePage } from '../lib/usePage'

export default function Amenities() {
  const root = useRef<HTMLDivElement>(null)
  usePage(root, 'Amenities')
  return (
    <div ref={root}>
      {/* ============ PAGE HERO ============ */}
      <section className="page-hero">
        <div className="page-hero__media"><img fetchPriority="high" srcSet="/assets/img/renders/rooftop-dining-m.webp 1280w, /assets/img/renders/rooftop-dining.webp 2048w" sizes="100vw" src="/assets/img/renders/rooftop-dining.jpg" alt="" /></div>
        <div className="page-hero__content">
          <nav className="crumbs reveal-up" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><span>Amenities</span></nav>
          <h1 className="split">Every desire<br />on your doorstep</h1>
          <p className="reveal-up">From our signature infinity pool to the rooftop restaurant and adventure activities — 50+ amenities designed for guests and owners alike.</p>
        </div>
      </section>

      <section className="amenities">
        <div className="section-head">
          <span className="eyebrow">Experiences</span>
          <h2 className="split">Play, unwind,<br />explore</h2>
          <p className="section-head__text">Archery, hiking, golf, snowboarding, shooting range, helipad access, massages, alpine roller coaster and rock climbing — all within the resort.</p>
        </div>
        <div className="tiles">
          <figure className="tile"><img src="/assets/img/amenities/ski-slope.jpg" alt="Ski slope" loading="lazy" /><figcaption><span>01 · Snow sports</span>Ski slope</figcaption></figure>
          <figure className="tile"><img src="/assets/img/amenities/infinity-pool.jpg" alt="Glass-roof pool" loading="lazy" /><figcaption><span>02 · Wellness</span>Glass-roof pool</figcaption></figure>
          <figure className="tile"><img src="/assets/img/amenities/rooftop-dining.jpg" alt="Rooftop restaurant" loading="lazy" /><figcaption><span>03 · Hotel & dining</span>Rooftop restaurant</figcaption></figure>
          <figure className="tile"><img src="/assets/img/amenities/archery.jpg" alt="Archery range" loading="lazy" /><figcaption><span>04 · Outdoor sport</span>Archery range</figcaption></figure>
          <figure className="tile"><img src="/assets/img/amenities/mini-golf.jpg" alt="Mini golf" loading="lazy" /><figcaption><span>05 · Outdoor sport</span>Mini golf</figcaption></figure>
          <figure className="tile"><img src="/assets/img/amenities/rooftop-crown.jpg" alt="Rooftop crown" loading="lazy" /><figcaption><span>06 · Hotel & dining</span>Rooftop crown</figcaption></figure>
          <figure className="tile"><img src="/assets/img/amenities/adventure-park.jpg" alt="Adventure park" loading="lazy" /><figcaption><span>07 · Family</span>Adventure park</figcaption></figure>
          <figure className="tile"><img src="/assets/img/amenities/sky-lounge.jpg" alt="Sky lounge" loading="lazy" /><figcaption><span>08 · Hotel & dining</span>Sky lounge</figcaption></figure>
          <figure className="tile"><img src="/assets/img/amenities/snow-trails.jpg" alt="Winter trails" loading="lazy" /><figcaption><span>09 · Snow sports</span>Winter trails</figcaption></figure>
          <figure className="tile"><img src="/assets/img/amenities/sunset-terrace.jpg" alt="Sunset terrace" loading="lazy" /><figcaption><span>10 · Hotel & dining</span>Sunset terrace</figcaption></figure>
          <figure className="tile"><img src="/assets/img/amenities/rooftop-terrace.jpg" alt="Garden terrace" loading="lazy" /><figcaption><span>11 · Hotel & dining</span>Garden terrace</figcaption></figure>
          <figure className="tile"><img src="/assets/img/amenities/snowy-forest.jpg" alt="Pine forest setting" loading="lazy" /><figcaption><span>12 · Nature</span>Pine forest setting</figcaption></figure>
        </div>
      </section>

      <div className="light">
        <section className="block">
          <div className="section-head">
            <span className="eyebrow">Resort facilities</span>
            <h2 className="split">22 signature<br />amenities</h2>
          </div>
        <div className="features">
          <article className="feature">
            <span className="feature__num">01</span>
            <h3>Infinity Pool</h3>
            <p>Signature infinity pool with panoramic valley views. Heated water with year-round operation, lifeguard supervision, lounging areas and towel service.</p>
          </article>
          <article className="feature">
            <span className="feature__num">02</span>
            <h3>Rooftop Restaurant</h3>
            <p>The Coffee, Tea &amp; Company rooftop restaurant at 7,906 ft — breakfast, lunch and dinner, with room service for in-apartment dining.</p>
          </article>
          <article className="feature">
            <span className="feature__num">03</span>
            <h3>Sauna, Jacuzzi &amp; Massage</h3>
            <p>Dedicated sauna and jacuzzi facilities with massage therapy rooms, available to guests throughout their stay.</p>
          </article>
          <article className="feature">
            <span className="feature__num">04</span>
            <h3>Fitness Gym</h3>
            <p>A fully equipped gymnasium with modern cardio and strength equipment.</p>
          </article>
          <article className="feature">
            <span className="feature__num">05</span>
            <h3>Rock Climbing</h3>
            <p>Outdoor climbing for varying skill levels, with professional safety equipment and supervision.</p>
          </article>
          <article className="feature">
            <span className="feature__num">06</span>
            <h3>Zipline</h3>
            <p>A zipline course through the resort grounds with full safety equipment and supervision.</p>
          </article>
          <article className="feature">
            <span className="feature__num">07</span>
            <h3>Archery</h3>
            <p>A professional archery range with trained staff, for individual play and group events.</p>
          </article>
          <article className="feature">
            <span className="feature__num">08</span>
            <h3>Air Gun Shooting Range</h3>
            <p>Recreational shooting with professional safety protocols, trained supervision and maintained equipment.</p>
          </article>
          <article className="feature">
            <span className="feature__num">09</span>
            <h3>Mini Golf Course</h3>
            <p>An 18-hole mini golf course set in the resort landscaping — a family favourite.</p>
          </article>
          <article className="feature">
            <span className="feature__num">10</span>
            <h3>Refractor Telescope</h3>
            <p>A telescope facility for stargazing, taking advantage of clear night skies at altitude.</p>
          </article>
          <article className="feature">
            <span className="feature__num">11</span>
            <h3>Business &amp; Executive Center</h3>
            <p>High-speed WiFi, printing and copying, and a professional workspace for meetings.</p>
          </article>
          <article className="feature">
            <span className="feature__num">12</span>
            <h3>Conference Room</h3>
            <p>Climate-controlled conference facilities for business meetings and corporate events.</p>
          </article>
          <article className="feature">
            <span className="feature__num">13</span>
            <h3>Banquet Hall</h3>
            <p>A large event space for celebrations and corporate functions, catered by the rooftop restaurant.</p>
          </article>
          <article className="feature">
            <span className="feature__num">14</span>
            <h3>Dedicated Lawn</h3>
            <p>An outdoor lawn for events, ceremonies and gatherings.</p>
          </article>
          <article className="feature">
            <span className="feature__num">15</span>
            <h3>24/7 Front Desk &amp; Concierge</h3>
            <p>Round-the-clock front desk, express check-in and check-out, concierge service and luggage storage.</p>
          </article>
          <article className="feature">
            <span className="feature__num">16</span>
            <h3>Fully Furnished</h3>
            <p>Every apartment comes fully furnished with quality fixtures, ready for guests or personal use.</p>
          </article>
          <article className="feature">
            <span className="feature__num">17</span>
            <h3>Dedicated Parking Floor</h3>
            <p>Climate-controlled parking with dedicated spaces, protected from mountain weather.</p>
          </article>
          <article className="feature">
            <span className="feature__num">18</span>
            <h3>Mosque</h3>
            <p>A professionally maintained prayer facility for guests.</p>
          </article>
          <article className="feature">
            <span className="feature__num">19</span>
            <h3>Power Backup</h3>
            <p>Backup generators provide continuous power during outages, with regular maintenance and testing.</p>
          </article>
          <article className="feature">
            <span className="feature__num">20</span>
            <h3>24/7 CCTV Surveillance</h3>
            <p>Complete surveillance of common areas and the property perimeter, monitored around the clock.</p>
          </article>
          <article className="feature">
            <span className="feature__num">21</span>
            <h3>Street Lights</h3>
            <p>Outdoor lighting throughout the grounds for safe pathways in the evening.</p>
          </article>
          <article className="feature">
            <span className="feature__num">22</span>
            <h3>Servants Residence</h3>
            <p>A dedicated staff accommodation floor supporting apartment management and housekeeping.</p>
          </article>
        </div>
        </section>
      </div>

      <section className="block block--dark">
        <div className="section-head">
          <span className="eyebrow">General features</span>
          <h2 className="split">Built for comfort<br />in every season</h2>
        </div>
        <div className="features features--two">
          <article className="feature">
            <span className="feature__num">01</span>
            <h3>Heating &amp; Power</h3>
            <p>Central heating with Italian-manufactured equipment, heated flooring throughout apartments and common areas, and backup generators for year-round comfort.</p>
          </article>
          <article className="feature">
            <span className="feature__num">02</span>
            <h3>Health &amp; Wellness</h3>
            <p>Steam room, sauna, jacuzzi, gym and massage rooms — plus unlimited natural spring water sourced directly from mountain springs.</p>
          </article>
          <article className="feature">
            <span className="feature__num">03</span>
            <h3>Architectural Features</h3>
            <p>Designed on a downhill site to maximise valley views. Limestone and marble finishes, double-glazed UPVC windows, and optional full home automation.</p>
          </article>
          <article className="feature">
            <span className="feature__num">04</span>
            <h3>Cleaning Services</h3>
            <p>Daily housekeeping for apartments and common areas, with laundry services available.</p>
          </article>
          <article className="feature">
            <span className="feature__num">05</span>
            <h3>Reception Services</h3>
            <p>Round-the-clock hospitality reception, guest check-in and concierge assistance.</p>
          </article>
          <article className="feature">
            <span className="feature__num">06</span>
            <h3>Sports Room</h3>
            <p>Indoor recreation with table tennis, snooker and video games — whatever the weather.</p>
          </article>
          <article className="feature">
            <span className="feature__num">07</span>
            <h3>Safe &amp; Secure</h3>
            <p>Complete street lighting, multiple fire escape routes and dedicated firefighting water tanks.</p>
          </article>
          <article className="feature">
            <span className="feature__num">08</span>
            <h3>Location Access</h3>
            <p>Connected via the Murree Expressway and Hazara Expressway, with direct access from the Havelian Interchange.</p>
          </article>
        </div>
      </section>

      {/* ============ ENQUIRE ============ */}
      <section className="contact" id="enquire">
        <div className="contact__media"><img loading="lazy" decoding="async" srcSet="/assets/img/renders/rooftop-view-m.webp 1280w, /assets/img/renders/rooftop-view.webp 2048w" sizes="100vw" src="/assets/img/renders/rooftop-view.jpg" alt="" /></div>
        <div className="contact__inner">
          <span className="eyebrow">Enquire now</span>
          <h2 className="contact__title split">Experience it<br />for yourself</h2>
          <p>Book a site visit to see the resort, the views and the amenities in person.</p>
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
