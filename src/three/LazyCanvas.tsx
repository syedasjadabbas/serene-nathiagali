import { Component, Suspense, lazy, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import type { CanvasProps } from '@react-three/fiber'
import { hasWebGL } from '../lib/device'

const CanvasHost = lazy(() => import('./CanvasHost'))

// Shows `fallback` if the 3D scene throws (lost context, driver bug, failed chunk).
class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

/**
 * 3D canvas that loads the engine and builds its scene as it nears the screen, animates only
 * while visible, and otherwise renders on demand. Devices without WebGL get `fallback`.
 */
export function LazyCanvas<P extends object>({ scene, sceneProps, canvas = {}, fallback = null, warmup = '200px' }: {
  scene: ComponentType<P>
  sceneProps: P
  canvas?: Omit<CanvasProps, 'children'>
  fallback?: ReactNode
  warmup?: string
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
  return (
    <div ref={ref} className="canvas-wrap" aria-hidden="true">
      {!supported ? fallback : mounted && (
        <SceneBoundary fallback={fallback}>
          <Suspense fallback={null}>
            <CanvasHost scene={scene as ComponentType<object>} sceneProps={sceneProps} canvas={canvas} frameloop={visible ? 'always' : 'demand'} />
          </Suspense>
        </SceneBoundary>
      )}
    </div>
  )
}
