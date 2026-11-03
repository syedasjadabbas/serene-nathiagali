import { lenis } from './scroll'

// One lightbox for the whole site (rendered once by the Layout). Pages open it with HTML.
export function openLightbox(html: string) {
  const box = document.getElementById('lightbox')
  const body = box?.querySelector('.lightbox__body')
  if (!box || !body) return
  body.innerHTML = html
  box.classList.add('is-open')
  box.setAttribute('aria-hidden', 'false')
  lenis?.stop()
}

export function closeLightbox() {
  const box = document.getElementById('lightbox')
  if (!box?.classList.contains('is-open')) return
  box.classList.remove('is-open')
  box.setAttribute('aria-hidden', 'true')
  const body = box.querySelector('.lightbox__body')
  if (body) body.innerHTML = '' // stops any playing video
  lenis?.start()
}

export const lightboxImage = (src: string, alt: string) => `<img src="${src}" alt="${alt.replace(/"/g, '&quot;')}">`

export const lightboxVideo = (id: string) => `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="Construction progress video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
  <a class="lightbox__link" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">Watch on YouTube ↗</a>`
