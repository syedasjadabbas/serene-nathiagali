import { useRef } from 'react'
import { Link } from '../lib/router'
import { openLightbox } from '../lib/lightbox'
import { usePage } from '../lib/usePage'
import { homeSetup } from './homeSetup'
import { MapSection } from '../components/MapSection'
import { TowerModel } from '../components/TowerModel'
import { PaymentCalc } from '../components/PaymentCalc'

const playWalkthrough = () => openLightbox(
  '<video src="/assets/video/walkthrough.mp4" poster="/assets/video/walkthrough.jpg" controls autoplay playsinline></video>')

export default function Home() {
  const root = useRef<HTMLDivElement>(null)
  usePage(root, '', homeSetup, { reveal: false })
  return (
    <div ref={root} className="home">
      <div className="loader" id="loader" aria-hidden="true">
          {/* the green cover with a capsule window cut in it, and the gold logo round the window;
              the film plays behind, and the camera pushes through the window into it */}
          <svg className="loader__gate" aria-hidden="true">
            <defs>
              <mask id="loaderWindow" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
                <rect width="100%" height="100%" fill="#fff" />
                <g className="loader__move"><rect x="3" y="3" width="94" height="130" rx="47" ry="47" fill="#000" /></g>
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="#0a1410" mask="url(#loaderWindow)" />
            <g className="loader__move loader__logo">
              <rect x="3" y="3" width="94" height="130" rx="47" ry="47" pathLength="1" />
              <rect x="8" y="8" width="84" height="120" rx="42" ry="42" pathLength="1" />
              <path d="M8 68C22 58 35 48 48 32L56 62L68 44L92 68V84C92 107.192 73.192 126 50 126C26.808 126 8 107.192 8 84V68Z" pathLength="1" />
              <path d="M48 32L56 62L68 44L54 70Z" pathLength="1" />
            </g>
          </svg>
          <div className="loader__lockup">
            <strong>Serene Heights</strong>
            <span>Nathia Gali &nbsp;·&nbsp; 7,906 ft</span>
          </div>
          <div className="loader__bar">
            <span className="loader__line"></span>
            <span className="loader__count" id="count">0</span>
          </div>
        </div>
      
        

      {/* ============ HERO ============ */}
      <section className="hero" id="hero">
        <div className="hero__media">
          <canvas className="hero__canvas" role="img" aria-label="Aerial fly-over of Serene Heights above the ski slope in winter"></canvas>
        </div>
        <div className="hero__shade"></div>
        <div className="hero__dim"></div>
        <p className="hero__caption" aria-hidden="true">
          <span>Two hours from Islamabad</span>
          <strong>Deep in the pines</strong>
        </p>
        <p className="hero__caption" aria-hidden="true">
          <span>Ski slope at the door</span>
          <strong>Pakistan's first winter resort</strong>
        </p>
        <p className="hero__caption" aria-hidden="true">
          <span>Serene Heights Nathia Gali</span>
          <strong>7,906 ft above the Galyat</strong>
        </p>
        <div className="hero__hud" aria-hidden="true">
          <span className="hero__hud-count"><b>01</b> / 03</span>
          <span className="hero__hud-name">The forest</span>
          <i className="hero__hud-line"><i></i></i>
        </div>
        <div className="hero__content">
          <div className="hero__main">
            <span className="hero__kicker reveal-up">Nathia Gali · 7,906 ft</span>
            <h1 className="hero__title">
              <span className="line"><span>A Haven in the</span></span>
              <span className="line"><span>Highlands</span></span>
            </h1>
            <div className="hero__bar">
              <p className="hero__lede">Pakistan’s first winter resort — fully furnished hotel apartments, managed as one hotel.</p>
              <div className="hero__actions">
                <Link to="#tour" className="hero__btn hero__btn--solid">Explore the Resort <span aria-hidden="true">→</span></Link>
                <button type="button" className="hero__btn hero__btn--play" onClick={playWalkthrough}><i aria-hidden="true" />Watch Video</button>
              </div>
            </div>
          </div>
          <span className="hero__scroll" aria-hidden="true">Scroll <b>↓</b></span>
        </div>
      </section>

      {/* ============ PINNED TOUR ============ */}
      <section className="tour" id="tour">
        <div className="tour__stage">
          <div className="scene"><img loading="lazy" decoding="async" srcSet="/assets/img/renders/tower-forest-mist-m.webp 1280w, /assets/img/renders/tower-forest-mist.webp 2048w" sizes="100vw" src="/assets/img/renders/tower-forest-mist.jpg" alt="Serene Heights tower rising above the pine forest and mist" /></div>
          <div className="scene"><img loading="lazy" decoding="async" srcSet="/assets/img/renders/tower-closeup-m.webp 1280w, /assets/img/renders/tower-closeup.webp 2048w" sizes="100vw" src="/assets/img/renders/tower-closeup.jpg" alt="Upper floors and balconies of the Serene Heights apartments" /></div>
          <div className="scene"><img loading="lazy" decoding="async" srcSet="/assets/img/renders/rooftop-dining-m.webp 1280w, /assets/img/renders/rooftop-dining.webp 2048w" sizes="100vw" src="/assets/img/renders/rooftop-dining.jpg" alt="Rooftop restaurant with glass walls above the clouds" /></div>
          <div className="scene"><img loading="lazy" decoding="async" srcSet="/assets/img/renders/tower-sky-m.webp 1280w, /assets/img/renders/tower-sky.webp 2048w" sizes="100vw" src="/assets/img/renders/tower-sky.jpg" alt="Serene Heights tower against the open sky" /></div>
          <div className="tour__shade"></div>

          <div className="tour__progress"><span></span></div>

          <div className="captions">
            <article className="caption">
              <span className="caption__num">01</span>
              <h2>Three towers in the pines</h2>
              <p>150+ apartments across three towers on a 30+ kanal campus — designed on a downhill site to open every home onto the valley.</p>
              <Link to="/about" className="btn btn--sm">About the project <span className="btn__dot">→</span></Link>
            </article>
            <article className="caption">
              <span className="caption__num">02</span>
              <h2>Refined, ready to live</h2>
              <p>1, 2 &amp; 3 bed hotel apartments, fully furnished. Limestone and marble finishes, double-glazed UPVC windows and heated flooring.</p>
              <Link to="/floor-plans" className="btn btn--sm">Floor plans <span className="btn__dot">→</span></Link>
            </article>
            <article className="caption">
              <span className="caption__num">03</span>
              <h2>Dining above the clouds</h2>
              <p>The Coffee, Tea &amp; Company rooftop restaurant at 7,906 ft — plus a heated infinity pool open year-round, sauna, jacuzzi and massage.</p>
              <Link to="/amenities" className="btn btn--sm">Amenities <span className="btn__dot">→</span></Link>
            </article>
            <article className="caption">
              <span className="caption__num">04</span>
              <h2>Ownership that earns</h2>
              <p>Fully managed hotel apartments with monthly rental income after operations, 28 free nights every year and zero maintenance charges.</p>
              <Link to="/payment-plan" className="btn btn--sm">Payment plan <span className="btn__dot">→</span></Link>
            </article>
          </div>

          <span className="scroll-cue">Scroll to discover</span>
        </div>
      </section>

      {/* ============ MARQUEE ============ */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee__track">
          <span>Pakistan's first winter resort</span>
          <span>7,906 ft</span>
          <span>150+ apartments</span>
          <span>3 towers</span>
          <span>50+ amenities</span>
          <span>Nathia Gali · Galyat</span>
          <span>Pakistan's first winter resort</span>
          <span>7,906 ft</span>
          <span>150+ apartments</span>
          <span>3 towers</span>
          <span>50+ amenities</span>
          <span>Nathia Gali · Galyat</span>
        </div>
      </div>

      <div className="light">
        {/* ============ THE PROJECT ============ */}
        <section className="project" id="project">
          <div className="section-head">
            <span className="eyebrow">The project</span>
            <h2 className="split">Pakistan's first &amp;<br />largest winter resort</h2>
            <p className="section-head__text">Serene Heights is not just an accommodation but a lifestyle destination — modern comfort, breathtaking mountain views, world-class amenities and activities, in the heart of the Galyat. Developed by DM Consortium.</p>
          </div>
          <ul className="figures">
            <li><strong>150+</strong><span>Apartments</span></li>
            <li><strong>3</strong><span>Towers</span></li>
            <li><strong>7,906<small>ft</small></strong><span>Location altitude</span></li>
            <li><strong>30+</strong><span>Kanals of project area</span></li>
            <li><strong>50+</strong><span>World-class amenities</span></li>
            <li><strong>15+</strong><span>Resort activities</span></li>
            <li><strong>36</strong><span>Monthly installments</span></li>
            <li><strong>24/7</strong><span>Concierge &amp; power backup</span></li>
          </ul>
        </section>

        {/* ============ RESIDENCES ============ */}
        <section className="residences" id="residences">
          <div className="cards">
            <Link className="card" to="/floor-plans">
              <div className="card__img"><img src="/assets/img/project/aerial-pool.jpg" alt="Aerial view of the tower and its glass-roofed rooftop pool above the misty pine forest" loading="lazy" decoding="async" style={{ objectPosition: '50% 40%' }} /></div>
              <div className="card__body">
                <span className="card__num">01</span>
                <h3>Hotel Apartments</h3>
                <p>Fully furnished 1, 2 and 3 bed apartments — for your own mountain getaways, and managed for rental income the rest of the year.</p>
              </div>
            </Link>
            <Link className="card" to="/payment-plan">
              <div className="card__img"><img src="/assets/img/project/night-facade.jpg" alt="Serene Heights lit up on a snowy evening, with cars at the entrance" loading="lazy" decoding="async" style={{ objectPosition: '50% 45%' }} /></div>
              <div className="card__body">
                <span className="card__num">02</span>
                <h3>Hotel Rooms</h3>
                <p>Serviced rooms within the resort's hospitality programme, with daily housekeeping and 24/7 front desk.</p>
              </div>
            </Link>
            <Link className="card" to="/smart-property-unit">
              <div className="card__img"><img src="/assets/img/project/snow-tower.jpg" alt="The Serene Heights tower among snow-covered pines" loading="lazy" decoding="async" style={{ objectPosition: '50% 55%' }} /></div>
              <div className="card__body">
                <span className="card__num">03</span>
                <h3>Co-ownership</h3>
                <p>An accessible way into mountain real estate — making property more liquid and more accessible for everyone.</p>
              </div>
            </Link>
          </div>
        </section>
      </div>

      {/* ============ GALLERY ============ */}
      <section className="gallery" id="gallery">
        <div className="section-head">
          <span className="eyebrow">Gallery</span>
          <h2 className="split">Every season,<br />every angle</h2>
          <p className="section-head__text">Renders of Serene Heights through snow, sunset and night. Tap any image to view it full size.</p>
        </div>
        <div className="shots" id="shots" data-limit="10"></div>
        <Link className="link-more" to="/gallery">View full gallery <span>→</span></Link>
      </section>

      {/* ============ AMENITIES: sideways strip ============ */}
      <section className="amenities hscroll" id="amenities">
        <div className="hscroll__row">
          <div className="hscroll__intro">
            <span className="eyebrow">Every desire on your doorstep</span>
            <h2 className="split">50+ world-class<br />amenities</h2>
            <p className="section-head__text">Archery, hiking, golf, snowboarding, shooting range, helipad access, massages, alpine roller coaster and rock climbing — all within the resort.</p>
            <Link className="link-more" to="/amenities">All amenities <span>→</span></Link>
          </div>
          <figure className="hscroll__card"><img src="/assets/img/amenities/ski-slope.jpg" alt="Ski slope" loading="lazy" /><figcaption><span>01 · Snow sports</span>Ski slope</figcaption></figure>
          <figure className="hscroll__card"><img src="/assets/img/amenities/rooftop-crown.jpg" alt="Rooftop crown" loading="lazy" /><figcaption><span>02 · Hotel & dining</span>Rooftop crown</figcaption></figure>
          <figure className="hscroll__card"><img src="/assets/img/amenities/infinity-pool.jpg" alt="Glass-roof pool" loading="lazy" /><figcaption><span>03 · Wellness</span>Glass-roof pool</figcaption></figure>
          <figure className="hscroll__card"><img src="/assets/img/amenities/archery.jpg" alt="Archery range" loading="lazy" /><figcaption><span>04 · Outdoor sport</span>Archery range</figcaption></figure>
          <figure className="hscroll__card"><img src="/assets/img/amenities/rooftop-dining.jpg" alt="Rooftop restaurant" loading="lazy" /><figcaption><span>05 · Hotel & dining</span>Rooftop restaurant</figcaption></figure>
          <figure className="hscroll__card"><img src="/assets/img/amenities/mini-golf.jpg" alt="Mini golf" loading="lazy" /><figcaption><span>06 · Outdoor sport</span>Mini golf</figcaption></figure>
          <figure className="hscroll__card"><img src="/assets/img/amenities/sky-lounge.jpg" alt="Sky lounge" loading="lazy" /><figcaption><span>07 · Hotel & dining</span>Sky lounge</figcaption></figure>
          <figure className="hscroll__card"><img src="/assets/img/amenities/adventure-park.jpg" alt="Adventure park" loading="lazy" /><figcaption><span>08 · Family</span>Adventure park</figcaption></figure>
          <figure className="hscroll__card"><img src="/assets/img/amenities/sunset-terrace.jpg" alt="Sunset terrace" loading="lazy" /><figcaption><span>09 · Hotel & dining</span>Sunset terrace</figcaption></figure>
          <figure className="hscroll__card"><img src="/assets/img/amenities/snow-trails.jpg" alt="Winter trails" loading="lazy" /><figcaption><span>10 · Snow sports</span>Winter trails</figcaption></figure>
        </div>
      </section>

      {/* ============ 3D TOWER MODEL ============ */}
      <TowerModel />

      {/* ============ PAYMENT PLAN ============ */}
      <section className="payment" id="payment-plan">
        <div className="section-head">
          <span className="eyebrow">Payment plan</span>
          <h2 className="split">Own it in<br />36 months</h2>
        </div>

        <ul className="price">
          <li><span>Base price</span><strong><small>PKR</small>40,000</strong><em>per sq ft</em></li>
          <li><span>Booking</span><strong><small>from</small>30%</strong><em>of total price</em></li>
          <li><span>Installment plan</span><strong>36</strong><em>monthly installments</em></li>
        </ul>

        <div className="payment__grid">
          <PaymentCalc />

          <div className="benefits">
            <h3>Our hotel apartments model</h3>
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

      {/* ============ PROGRESS ============ */}
      <section className="progress" id="progress">
        <div className="section-head">
          <span className="eyebrow">Construction progress</span>
          <h2 className="split">Rising in<br />the pines</h2>
          <p className="section-head__text">From groundbreaking in December 2021 to today — watch every milestone on site.</p>
        </div>
        <div className="timeline" id="timeline"></div>
        <Link className="link-more" to="/progress">Full progress timeline <span>→</span></Link>
      </section>

      {/* ============ 3D MAP ============ */}
      <MapSection />

      {/* ============ DISTANCES ============ */}
      <section className="block block--dark distances-block rise">
        <div className="section-head">
          <span className="eyebrow">Distances</span>
          <h2 className="split">Every distance,<br />from the front door</h2>
        </div>
        <ul className="distances">
          <li><span>PAF Airbase Nathia Gali</span><strong>50 m</strong></li>
          <li><span>Main Nathia Gali Road</span><strong>1.5 km <em>3 min</em></strong></li>
          <li><span>Hotel Elites Nathia Gali</span><strong>3 km <em>6 min</em></strong></li>
          <li><span>Main Bazar Nathia Gali</span><strong>5 km <em>10 min</em></strong></li>
          <li><span>Abbottabad City Center</span><strong>35 km <em>50 min</em></strong></li>
          <li><span>Islamabad</span><strong>80 km <em>2 hrs</em></strong></li>
        </ul>
      </section>

      {/* ============ CONTACT ============ */}
      <section className="contact" id="contact">
        <div className="contact__media">
          <img loading="lazy" decoding="async" srcSet="/assets/img/renders/snow-aerial-sunset-m.webp 1280w" sizes="100vw" src="/assets/img/renders/snow-aerial-sunset.jpg" alt="" />
        </div>
        <div className="contact__inner">
          <span className="eyebrow">Enquire now</span>
          <h2 className="contact__title split">Your home<br />in the highlands</h2>
          <p>Book a visit, request a brochure or ask about the 36-month payment plan.</p>
          <a className="btn btn--light" href="mailto:sereneheightsnathiagali@gmail.com">sereneheightsnathiagali@gmail.com <span className="btn__dot">→</span></a>
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
