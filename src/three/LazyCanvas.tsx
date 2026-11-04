import { Component, Suspense, lazy, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import type { CanvasProps } from '@react-three/fiber'
import { hasWebGL } from '../lib/device'
import { whenPreloaded } from './preload'

const CanvasHost = lazy(() => import('./CanvasHost'))

// Shows `fallback` if the 3D scene throws (lost context, driver bug, failed chunk).
class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

/**
 * 3D canvas that builds its scene ahead of time (`premount`: as soon as the 3D code has been
 * preloaded in the background) or as it nears the screen, whichever comes first. It animates only
 * while visible and is fully stopped otherwise: on demand would not be enough, as auto-rotating
 * controls ask for a new frame every frame. Devices without WebGL get `fallback`.
 */
export function LazyCanvas<P extends object>({ scene, sceneProps, canvas = {}, fallback = null, warmup = '200px', premount = false }: {
  scene: ComponentType<P>
  sceneProps: P
  canvas?: Omit<CanvasProps, 'children'>
  fallback?: ReactNode
  warmup?: string
  /** build the scene in the background once preloaded, instead of waiting to near the screen */
  premount?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const supported = useMemo(() => hasWebGL(), [])
  useEffect(() => {
    const el = ref.current
    if (!el || !supported) return
    const io = new IntersectionObserver(([e]) => {
      setVisible(e.isIntersecting)
      if (e.isIntersecting) setMounted(true)
    }, { rootMargin: warmup })
    // build well ahead of the screen, so a fast scroll never reaches an empty canvas
    const ahead = new IntersectionObserver(([e]) => { if (e.isIntersecting) setMounted(true) }, { rootMargin: '150% 0px' })
    io.observe(el)
    ahead.observe(el)
    return () => { io.disconnect(); ahead.disconnect() }
  }, [warmup, supported])
  useEffect(() => {
    if (!supported || !premount) return
    let live = true
    whenPreloaded().then(() => { if (live) setMounted(true) })
    return () => { live = false }
  }, [supported, premount])
  return (
    <div ref={ref} className="canvas-wrap" aria-hidden="true">
      {!supported ? fallback : mounted && (
        <SceneBoundary fallback={fallback}>
          <Suspense fallback={null}>
            <CanvasHost scene={scene as ComponentType<object>} sceneProps={sceneProps} canvas={canvas} frameloop={visible ? 'always' : 'never'} />
          </Suspense>
        </SceneBoundary>
      )}
    </div>
  )
}
