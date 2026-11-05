import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { LazyCanvas } from '../three/LazyCanvas'
import { PlanScene } from '../three/PlanScene'
import { coarsePointer } from '../lib/device'
import { lockScroll } from '../lib/scroll'
import { floorPlanSrc } from '../lib/widgets'

const FLOORS = [
  ['ground', 'Ground · lobby'], ['ground1', 'Ground · layout'], ['1st', '1st'], ['2nd', '2nd'], ['3rd', '3rd'],
  ['5th', '5th'], ['6th', '6th'], ['7th', '7th'], ['8th', '8th'],
] as const

/** A floor plan raised into 3D, full screen. Loaded only when a visitor opens it. */
export default function Plan3DViewer({ plan, onClose }: { plan: string; onClose: () => void }) {
  const [name, setName] = useState(plan)
  const spin = useRef(0.35)
  const zoom = useRef(1)
  const tilt = useRef(0.72)
  const zoomTo = (z: number) => { zoom.current = Math.min(1.6, Math.max(0.35, z)) }

  useEffect(() => {
    lockScroll(true)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { lockScroll(false); window.removeEventListener('keydown', onKey) }
  }, [onClose])

  // touch: drag to turn and tilt, pinch to zoom
  const gesture = useRef<{ x: number; y: number; d: number } | null>(null)
  const pinch = (t: React.TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    gesture.current = { x: t.clientX, y: t.clientY, d: e.touches.length >= 2 ? pinch(e.touches) : 0 }
  }
  const onTouchMove = (e: React.TouchEvent) => {
    const g = gesture.current
    if (!g) return
    if (e.touches.length >= 2) {
      const d = pinch(e.touches)
      if (g.d) zoomTo(zoom.current * (g.d / d))
      g.d = d
      return
    }
    const { clientX: x, clientY: y } = e.touches[0]
    spin.current -= (x - g.x) * 0.012
    tilt.current = Math.min(1.3, Math.max(0.25, tilt.current - (y - g.y) * 0.006))
    g.x = x
    g.y = y
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    gesture.current = e.touches.length ? { x: e.touches[0].clientX, y: e.touches[0].clientY, d: 0 } : null
  }

  // on the body, as the page's pinned sections would otherwise trap a fixed element
  return createPortal(
    <div className="plan3d" role="dialog" aria-modal="true" aria-label="Floor plan in 3D"
      {...(coarsePointer ? { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: onTouchEnd } : {})}>
      <LazyCanvas scene={PlanScene} sceneProps={{ name, spin, zoom, tilt, full: true }} premount
        canvas={{ dpr: [1, 1.5], shadows: true, camera: { fov: 35, position: [5.2, 11.2, 12.3] }, gl: { antialias: true } }}
        fallback={<img className="plan3d__fallback" src={floorPlanSrc(name)} alt="Floor plan" />} />
      <div className="plan3d__top">
        <div className="plan3d__floors" role="group" aria-label="Choose a floor">
          {FLOORS.map(([id, label]) => (
            <button key={id} type="button" aria-pressed={id === name} onClick={() => setName(id)}>{label}</button>
          ))}
        </div>
        <button type="button" className="plan3d__btn" aria-label="Close 3D view" onClick={onClose}>✕</button>
      </div>
      <div className="plan3d__foot">
        <span className="plan3d__hint">{coarsePointer ? 'Drag to turn and tilt · pinch to zoom' : 'Drag to turn · scroll to zoom · right-drag to move'}</span>
        <div className="plan3d__tools">
          <button type="button" className="plan3d__btn" aria-label="Turn left" onClick={() => { spin.current -= Math.PI / 4 }}>←</button>
          <button type="button" className="plan3d__btn" aria-label="Turn right" onClick={() => { spin.current += Math.PI / 4 }}>→</button>
          <button type="button" className="plan3d__btn" aria-label="Zoom in" onClick={() => zoomTo(zoom.current * 0.75)}>+</button>
          <button type="button" className="plan3d__btn" aria-label="Zoom out" onClick={() => zoomTo(zoom.current / 0.75)}>−</button>
        </div>
      </div>
      <p className="plan3d__note">Raised from the architect’s drawings. Indicative only.</p>
    </div>,
    document.body,
  )
}
