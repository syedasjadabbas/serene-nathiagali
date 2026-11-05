import { Suspense, lazy, useMemo, useRef, useState } from 'react'
import { LazyCanvas } from '../three/LazyCanvas'
import type { FloorRef } from '../three/SelectorScene'
import { TOWERS } from '../three/towers'
import { coarsePointer, hasWebGL } from '../lib/device'
import { Link } from '../lib/router'
import { openLightbox, lightboxImage } from '../lib/lightbox'
import { floorPlanSrc } from '../lib/widgets'

const Plan3DViewer = lazy(() => import('./Plan3DViewer'))
const SelectorScene = lazy(() => import('../three/SelectorScene').then((m) => ({ default: m.SelectorScene })))

const TOWER_NAMES = ['Tower A', 'Tower B', 'Tower C']
const TOWER_LETTERS = ['A', 'B', 'C']
const residentialFloors = (t: number) => TOWERS[t].floors - 1
// Published floor plans (from the official site). Floors not listed have no plan published yet.
const PLAN_FOR_FLOOR: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 5: '5th', 6: '6th', 7: '7th', 8: '8th' }
const TOWER_C = 2 // its plans aren't published yet
const planFor = (t: number | null, f: number) => (t === TOWER_C ? undefined : PLAN_FOR_FLOOR[f])
const ordinal = (n: number) => n + (['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : n % 10] ?? 'th')

/** Interactive 3D model of the three towers: pick a tower, then a floor, to open its plan. */
export function TowerModel() {
  const [tower, setTower] = useState<number | null>(null)
  const [floor, setFloor] = useState<number | null>(null)
  const [hover, setHover] = useState<FloorRef | null>(null)
  const [view3d, setView3d] = useState<string | null>(null)
  const spin = useRef(0.19)
  const webgl = useMemo(() => hasWebGL(), [])

  const pickTower = (t: number | null) => { setTower(t); setFloor(null) }
  const pickFloor = ({ tower: t, floor: f }: FloorRef) => { setTower(t); setFloor(f) }
  const plan = floor ? planFor(tower, floor) : undefined
  const planHint = (t: number | null, f: number) => (planFor(t, f) ? 'Plan available' : 'Plan coming soon')

  return (
    <section className="towers rise" id="towers">
      <div className="section-head towers__head">
        <span className="eyebrow">Explore the towers</span>
        <h2 className="split">Pick a tower.<br />Pick a floor.</h2>
        <p className="section-head__text">Turn the model, then click any floor to open its published plan. Three towers, 150+ fully furnished hotel apartments.</p>
      </div>

      <div className="sel-stage">
        <div className="sel-canvas">
          <LazyCanvas scene={SelectorScene}
            sceneProps={{ spin, tower, floor, hover, onHover: setHover, onPick: pickFloor, onTower: pickTower }}
            warmup="1500px" premount canvas={{ dpr: [1, 1.25], camera: { fov: 36, far: 1200, position: [6, 12, 34] }, gl: { antialias: true }, shadows: true, flat: true }}
            fallback={<div className="sel-fallback"><img src="/assets/img/renders/tower-forest-mist-sm.jpg" alt="Serene Heights towers" /><p>The 3D model isn’t available on this device. Choose a tower and floor from the list.</p></div>} />
          <div className="sel-hint">
            {hover ? `${TOWER_NAMES[hover.tower]} · Floor ${hover.floor} · ${planHint(hover.tower, hover.floor)}` : coarsePointer ? 'Tap a floor' : 'Drag to turn · Click a floor'}
          </div>
          {coarsePointer && webgl && (
            <div className="turn">
              <button type="button" aria-label="Turn the model left" onClick={() => { spin.current -= Math.PI / 4 }}>←</button>
              <button type="button" aria-label="Turn the model right" onClick={() => { spin.current += Math.PI / 4 }}>→</button>
            </div>
          )}
        </div>

        <aside className="sel-panel" aria-live="polite">
          <div className="seg" role="group" aria-label="Tower">
            <button type="button" aria-pressed={tower === null} onClick={() => pickTower(null)}>All</button>
            {TOWER_LETTERS.map((l, t) => <button key={l} type="button" aria-pressed={tower === t} onClick={() => pickTower(t)} aria-label={`Tower ${l}`}>Tower {l}</button>)}
          </div>

          {tower === null && (
            <div className="panel-empty">
              <h3>Three towers in the pines.</h3>
              <p>Choose a tower above or click any floor on the model to see its plan.</p>
              <ul className="tower-facts">
                {TOWER_NAMES.map((n, t) => <li key={n}><span>{n}</span><strong>{residentialFloors(t)} floors</strong></li>)}
              </ul>
            </div>
          )}

          {tower !== null && !floor && (
            <div className="floors">
              <span className="floors__label">{TOWER_NAMES[tower]} · choose a floor</span>
              <ol>
                {Array.from({ length: residentialFloors(tower) }, (_, i) => residentialFloors(tower) - i).map((f) => (
                  <li key={f}>
                    <button type="button" onClick={() => pickFloor({ tower, floor: f })}
                      onMouseEnter={() => setHover({ tower, floor: f })} onMouseLeave={() => setHover(null)}>
                      <span>{ordinal(f)} floor{f === residentialFloors(tower) ? ' · Top' : ''}</span>
                      <span className={`floors__tag${planFor(tower, f) ? ' has-plan' : ''}`}>{planHint(tower, f)}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {tower !== null && floor && (
            <div className="floor-view">
              <button type="button" className="back" onClick={() => setFloor(null)}>← {TOWER_NAMES[tower]}</button>
              <h3>{TOWER_NAMES[tower]} · {ordinal(floor)} floor</h3>
              {plan ? (
                <>
                  <button type="button" className="floor-view__plan" onClick={() => openLightbox(lightboxImage(floorPlanSrc(plan), `${ordinal(floor)} floor plan`))}>
                    <img src={floorPlanSrc(plan)} alt={`${ordinal(floor)} floor plan`} />
                    <span>View full size ↗</span>
                  </button>
                  <button type="button" className="btn btn--sm plan3d-open" onClick={() => setView3d(plan)}>View in 3D <span className="btn__dot">→</span></button>
                  <p className="fine">Apartment numbers and areas (sq ft) are listed on the plan. Layouts may vary between towers — please confirm with the sales team.</p>
                </>
              ) : (
                <p className="fine">The plan for this floor hasn’t been published yet. Our team can share it on request.</p>
              )}
              <Link className="btn btn--sm" to="/contact">Enquire about this floor <span className="btn__dot">→</span></Link>
            </div>
          )}
        </aside>
      </div>
      {view3d && <Suspense fallback={null}><Plan3DViewer plan={view3d} onClose={() => setView3d(null)} /></Suspense>}
    </section>
  )
}
