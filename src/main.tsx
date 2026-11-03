import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/site.css'
import './styles/three.css'
import * as scroll from './lib/scroll'
import { mapState } from './three/state'

const { startSmoothScroll } = scroll
// dev only: a handle for stepping animations from the browser console during testing
if (import.meta.env.DEV) (window as unknown as { __sh: unknown }).__sh = { scroll, mapState }

// Every load starts at the top: no restored scroll position, no jump to a #section.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
if (location.hash) history.replaceState(null, '', location.pathname + location.search)
window.scrollTo(0, 0)

startSmoothScroll()

// No StrictMode: pages drive the DOM imperatively (GSAP), which must run exactly once per mount.
createRoot(document.getElementById('root')!).render(<App />)
