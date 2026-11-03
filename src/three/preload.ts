// Background loading for the 3D scenes, so they are ready before the visitor scrolls to them.
// The homepage starts it once the hero has what it needs; pages that open on a 3D scene start it straight away.

let started: Promise<void> | null = null
const idle = (fn: () => void) =>
  ('requestIdleCallback' in window ? window.requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200))

/** Downloads the 3D engine, both scenes and the map's elevation data. Safe to call repeatedly. */
export function preload3D() {
  started ??= Promise.all([
    import('./CanvasHost'),
    import('./SelectorScene'),
    import('./MapScene'),
    import('./geo').then((g) => g.loadDem()),
  ]).then(() => undefined, () => undefined)
  return started
}

/** Resolves once everything is downloaded and the browser has a quiet moment to build a scene. */
export function whenPreloaded() {
  return preload3D().then(() => new Promise<void>((resolve) => idle(() => resolve())))
}
