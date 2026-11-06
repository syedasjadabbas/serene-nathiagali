// Background loading for the 3D scenes, so they are ready before the visitor scrolls to them.
// The homepage starts it once the hero has what it needs; pages that open on a 3D scene start it straight away.

let tower: Promise<void> | null = null
let started: Promise<void> | null = null
let begin = () => {}
const begun = new Promise<void>((resolve) => { begin = resolve })
const idle = (fn: () => void) =>
  ('requestIdleCallback' in window ? window.requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200))

/** Downloads the 3D engine, both scenes, the map's elevation data and satellite texture. Safe to call repeatedly. */
export function preload3D() {
  begin()
  tower ??= Promise.all([
    import('./CanvasHost'),
    import('./SelectorScene'),
    import('./geo').then((g) => g.loadDem()),
  ]).then(() => undefined, () => undefined)
  // the tower comes first on the page, so the 4 MB map texture waits its turn
  started ??= tower.then(() => import('./MapScene'))
    .then((m) => m.preloadMapTexture(window.innerWidth < 760 || navigator.hardwareConcurrency <= 4))
    .then(() => undefined, () => undefined)
  return started
}

// building a scene holds up the page for a moment, so wait for a pause in the scrolling, but not
// for long: someone scrolling steadily must not reach a scene that was never built
const scrollRest = () => new Promise<void>((resolve) => {
  let y = window.scrollY, still = 0, ticks = 0
  const id = setInterval(() => {
    still = window.scrollY === y ? still + 1 : 0
    y = window.scrollY
    if (still >= 3 || ++ticks >= 20) { clearInterval(id); resolve() }
  }, 150)
})

/** Once something has started the preload: resolves when the engine is in and the browser has a quiet moment to build a scene. */
export function whenPreloaded() {
  return begun.then(() => tower!).then(scrollRest).then(() => new Promise<void>((resolve) => idle(() => resolve())))
}
