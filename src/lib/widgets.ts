import { gsap, ScrollTrigger } from './scroll'
import { openLightbox, lightboxImage, lightboxVideo } from './lightbox'

// Interactive widgets that live in page markup. Each only runs if its markup is present,
// and returns a cleanup for when the page unmounts.

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode) => root.querySelector<T>(sel)
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode) => [...root.querySelectorAll<T>(sel)]
type Cleanup = () => void

/* ---------- floor plans ---------- */
export const FLOORS = [
  { id: 'ground', label: 'Ground', name: 'Ground floor', note: 'Banquet hall · conference rooms' },
  { id: 'ground1', label: 'Ground — Apts', name: 'Ground floor', note: 'Apartments' },
  { id: '1st', label: '1st', name: '1st floor', note: 'Apartments 101 – 116' },
  { id: '2nd', label: '2nd', name: '2nd floor', note: 'Apartments' },
  { id: '3rd', label: '3rd', name: '3rd floor', note: 'Apartments' },
  { id: '5th', label: '5th', name: '5th floor', note: 'Apartments' },
  { id: '6th', label: '6th', name: '6th floor', note: 'Apartments' },
  { id: '7th', label: '7th', name: '7th floor', note: 'Apartments' },
  { id: '8th', label: '8th', name: '8th floor', note: 'Apartments' },
]
export const floorPlanSrc = (id: string) => `/assets/img/floors/${id}.jpg`

function floorPlans(root: ParentNode): Cleanup | void {
  const planImg = $<HTMLImageElement>('#planImg', root)
  const tabs = $('.plans__tabs', root)
  if (!planImg || !tabs) return
  tabs.innerHTML = FLOORS.map((f, i) =>
    `<button role="tab" aria-selected="${i === 0}" data-floor="${i}">${f.label}</button>`).join('')
  const show = (i: number) => {
    const f = FLOORS[i]
    $$('button', tabs).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.floor === String(i))))
    planImg.style.opacity = '0'
    const next = new Image()
    next.onload = () => {
      planImg.src = next.src
      planImg.alt = `${f.name} plan — ${f.note}`
      planImg.style.opacity = '1'
    }
    next.src = floorPlanSrc(f.id)
    const name = $('#planName', root), note = $('#planNote', root)
    if (name) name.textContent = f.name
    if (note) note.textContent = f.note
  }
  const onTab = (e: Event) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('button')
    if (b) show(+(b.dataset.floor ?? 0))
  }
  const opener = $('.plans__open', root)
  const onOpen = () => openLightbox(lightboxImage(planImg.src, planImg.alt))
  tabs.addEventListener('click', onTab)
  opener?.addEventListener('click', onOpen)
  show(0)
  return () => { tabs.removeEventListener('click', onTab); opener?.removeEventListener('click', onOpen) }
}

/* ---------- gallery ---------- */
// [file, caption, tile size, category]
export const SHOTS: [string, string, string, string][] = [
  ['sunset-rooftop', 'Rooftop terraces at sunset', 'big', 'exterior'],
  ['night-facade', 'Serene Heights lit up on a snowy night', 'tall', 'winter'],
  ['snow-tower', 'The tower in winter', '', 'winter'],
  ['snow-aerial-sunset', 'Aerial view over snowy pines at dusk', '', 'winter'],
  ['rooftop-terrace', 'Rooftop dining terrace', '', 'rooftop'],
  ['snow-valley', 'Tower above the snowy valley', '', 'winter'],
  ['rooftop-lounge', 'Sunlit rooftop lounge', 'wide', 'rooftop'],
  ['snow-street', 'Arrival road in the snow', '', 'winter'],
  ['rooftop-view', 'Rooftop restaurant overlooking the pines', '', 'rooftop'],
  ['snow-facade', 'Facade in fresh snow', '', 'winter'],
  ['tower-forest-mist', 'The tower rising above the pines and mist', 'big', 'exterior'],
  ['aerial-clouds', 'Aerial view above the clouds', 'wide', 'exterior'],
  ['tower-sky', 'Tower against the open sky', 'tall', 'exterior'],
  ['facade-entrance', 'Main entrance and facade', '', 'exterior'],
  ['tower-closeup', 'Upper floors and balconies', '', 'exterior'],
  ['aerial-pool', 'Rooftop infinity pool from above', '', 'rooftop'],
  ['rooftop-dining', 'Glass-walled rooftop restaurant', 'wide', 'rooftop'],
]

function gallery(root: ParentNode): Cleanup | void {
  const el = $('#shots', root)
  if (!el) return
  const limit = +(el.dataset.limit ?? 0) || SHOTS.length
  const render = (cat: string) => {
    el.innerHTML = SHOTS.filter((s) => cat === 'all' || s[3] === cat).slice(0, limit).map(([id, alt, size]) => `
      <button class="shot ${size}" data-full="/assets/img/renders/${id}.jpg" aria-label="View full size: ${alt}">
        <img src="/assets/img/renders/${id}-sm.jpg" alt="${alt}" loading="lazy">
      </button>`).join('')
  }
  render('all')
  const onShot = (e: Event) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('.shot')
    if (b) openLightbox(lightboxImage(b.dataset.full ?? '', b.querySelector('img')?.alt ?? ''))
  }
  const filters = $('.filters', root)
  const onFilter = (e: Event) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('button')
    if (!b || !filters) return
    $$('button', filters).forEach((x) => x.setAttribute('aria-pressed', String(x === b)))
    gsap.to(el, {
      opacity: 0, duration: 0.25,
      onComplete: () => {
        render(b.dataset.cat ?? 'all')
        gsap.fromTo(el.children, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.04, ease: 'power3.out' })
        gsap.to(el, { opacity: 1, duration: 0.2 })
        ScrollTrigger.refresh()
      },
    })
  }
  el.addEventListener('click', onShot)
  filters?.addEventListener('click', onFilter)
  return () => { el.removeEventListener('click', onShot); filters?.removeEventListener('click', onFilter) }
}

/* ---------- payment calculator ---------- */
const PRICE_PER_SQFT = 40000
const pkr = (n: number) => 'PKR ' + Math.round(n).toLocaleString('en-PK')

function calculator(root: ParentNode): Cleanup | void {
  const area = $<HTMLInputElement>('#calcArea', root)
  const range = $<HTMLInputElement>('#calcRange', root)
  if (!area || !range) return
  const update = (sqft: number) => {
    const total = sqft * PRICE_PER_SQFT
    const booking = total * 0.3
    const set = (id: string, v: string) => { const n = $(id, root); if (n) n.textContent = v }
    set('#calcTotal', pkr(total))
    set('#calcBooking', pkr(booking))
    set('#calcMonthly', pkr((total - booking) / 36))
  }
  const onArea = () => { const v = Math.max(0, +area.value || 0); range.value = String(v); update(v) }
  const onRange = () => { area.value = range.value; update(+range.value) }
  area.addEventListener('input', onArea)
  range.addEventListener('input', onRange)
  update(+area.value)
  return () => { area.removeEventListener('input', onArea); range.removeEventListener('input', onRange) }
}

/* ---------- construction progress ---------- */
export const MILESTONES: [string, string][] = [
  ['April 2026', 'lxc9yQty3BA'],
  ['December 2025', 'HIewLGoRr2g'],
  ['September 2025', '_b7QhNjmldk'],
  ['April 2025', 'zih0inhf1hM'],
  ['July 2024', '_RjucM01Vp8'],
  ['February 2024', 'J_EAtfLGICw'],
  ['November 2023', 'YbcwSm0l4Es'],
  ['July 2023', 'deh7Edv0cFM'],
  ['October 2022', '_ArGeucKghA'],
  ['December 2021', '-j6c51b2Dis'],
]

function progress(root: ParentNode): Cleanup | void {
  const lists = $$('#timeline, #progressList', root)
  if (!lists.length) return
  const onClick = (e: Event) => {
    const m = (e.target as HTMLElement).closest<HTMLElement>('.milestone')
    if (m) openLightbox(lightboxVideo(m.dataset.video ?? ''))
  }
  lists.forEach((list) => {
    list.innerHTML = MILESTONES.map(([date, id]) => `
      <button class="milestone" data-video="${id}" aria-label="Play construction progress video, ${date}">
        <span class="milestone__thumb">
          <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy">
          <span class="milestone__play">▶</span>
        </span>
        <span class="milestone__date">${date}</span>
      </button>`).join('')
    list.addEventListener('click', onClick)
  })
  return () => lists.forEach((list) => list.removeEventListener('click', onClick))
}

/* ---------- enquiry form (no backend: hands the message to WhatsApp or email) ---------- */
function enquiryForm(root: ParentNode): Cleanup | void {
  const form = $<HTMLFormElement>('#enquiryForm', root)
  if (!form) return
  const onSubmit = (e: SubmitEvent) => {
    e.preventDefault()
    if (!form.reportValidity()) return
    const d = Object.fromEntries(new FormData(form)) as Record<string, string>
    const text = [
      'Enquiry — Serene Heights Nathia Gali',
      `Name: ${d.name}`,
      `Phone: ${d.phone}`,
      d.email && `Email: ${d.email}`,
      d.city && `City: ${d.city}`,
      d.interest && `Interested in: ${d.interest}`,
      d.message && `Message: ${d.message}`,
    ].filter(Boolean).join('\n')
    const via = (e.submitter as HTMLButtonElement | null)?.value || 'whatsapp'
    const url = via === 'email'
      ? `mailto:info@sereneheightsnathiagali.com?subject=${encodeURIComponent('Enquiry — Serene Heights Nathia Gali')}&body=${encodeURIComponent(text)}`
      : `https://wa.me/923214979447?text=${encodeURIComponent(text)}`
    window.open(url, via === 'email' ? '_self' : '_blank', 'noopener')
    const note = $('.form__note', form)
    if (note) note.textContent = via === 'email'
      ? 'Your email app has opened with the enquiry — just press send.'
      : 'WhatsApp has opened with your enquiry — just press send.'
  }
  form.addEventListener('submit', onSubmit)
  return () => form.removeEventListener('submit', onSubmit)
}

/** Starts every widget found in `root`. */
export function initWidgets(root: ParentNode): Cleanup {
  const offs = [floorPlans, gallery, calculator, progress, enquiryForm].map((w) => w(root)).filter(Boolean) as Cleanup[]
  return () => offs.forEach((off) => off())
}
