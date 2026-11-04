import { Suspense, useCallback, useEffect, useState, type ComponentType } from 'react'
import { Canvas, useThree, type CanvasProps } from '@react-three/fiber'

// Compiles every shader in the scene without blocking the page (the driver links them on its own
// threads), then lets the canvas draw. Drawing first would compile them all at once on the main
// thread, which froze scrolling for a couple of seconds on integrated GPUs.
function Warmup({ onReady }: { onReady: () => void }) {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    let live = true
    gl.compileAsync(scene, camera).catch(() => {}).finally(() => { if (live) onReady() })
    return () => { live = false }
  }, [gl, scene, camera, onReady])
  return null
}

// One draw once the shaders are ready, so a scene built ahead of time is already on the GPU
// (textures uploaded) before it scrolls into view.
function FirstFrame({ onDrawn }: { onDrawn: () => void }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    invalidate()
    const id = requestAnimationFrame(() => requestAnimationFrame(onDrawn))
    return () => cancelAnimationFrame(id)
  }, [invalidate, onDrawn])
  return null
}

// The only module that pulls in the 3D engine for the canvas. LazyCanvas loads it on demand,
// so the first page load ships without three.js.
export default function CanvasHost<P extends object>({ scene: Scene, sceneProps, frameloop, canvas }: {
  scene: ComponentType<P>
  sceneProps: P
  frameloop: 'always' | 'demand' | 'never'
  canvas: Omit<CanvasProps, 'children'>
}) {
  const [ready, setReady] = useState(false)
  const [drawn, setDrawn] = useState(false)
  const onReady = useCallback(() => setReady(true), [])
  const onDrawn = useCallback(() => setDrawn(true), [])
  // after the first draw, a 'never' canvas stays fully stopped (it could not take that one draw)
  const loop = !ready ? 'never' : !drawn && frameloop === 'never' ? 'demand' : frameloop
  return (
    <Canvas {...canvas} frameloop={loop}>
      <Suspense fallback={null}>
        <Scene {...sceneProps} />
        {!ready ? <Warmup onReady={onReady} /> : !drawn && <FirstFrame onDrawn={onDrawn} />}
      </Suspense>
    </Canvas>
  )
}
