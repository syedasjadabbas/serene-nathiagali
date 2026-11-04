import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { TOWERS as SPECS } from './towers'
import { Landscape } from './Landscape'

export type FloorRef = { tower: number; floor: number }

/** Residential floors per tower (the ground floor is the lobby). */
export const residentialFloors = (t: number) => SPECS[t].floors - 1

// The architect's SketchUp model, simplified to a 2 MB GLB: one primitive per material
// (stone, iron, glass, stair, roof), in metres, ground at y = 0.
const MODEL_URL = '/assets/model/serene-heights.glb'
const S = 0.28 // metres to scene units
// floor slab levels measured from the model, in metres; the last entries are the roof line
const LEVELS = [-0.3, 4.3, 8.1, 12, 15.8, 19.6, 24.3, 28.1, 31.9, 35.7, 39.5, 43]
const floorMid = (f: number) => (LEVELS[f] + LEVELS[f + 1]) / 2 * S
// The building is one ring round a courtyard, so each tower is a stretch of it along x (metres)
const ZONES = [[-8, 8], [-30, -8], [8, 30]] as const
const ROOF = 41
const TOWERS = ZONES.map(([a, b]) => ({ a, b, x: (a + b) / 2 * S, z: 0, w: (b - a) * S, h: ROOF * S }))
const HOME = new THREE.Vector3(0, 5.2, 0)
// camera distance and height angle for the overview, a chosen tower and a chosen floor
// (`width` is how much of the scene must fit across a narrow phone screen)
const VIEW = { all: { dist: 34, phi: 1.3, width: 20 }, tower: { dist: 24, phi: 1.25, width: 9 }, floor: { dist: 15, phi: 1.36, width: 7 } }
const SWAY = 0.35 // the overview drifts this far either side of front-on

import { coarsePointer } from '../lib/device'

type Props = {
  spin: React.RefObject<number> // target azimuth for touch devices, nudged by the turn buttons
  tower: number | null
  floor: number | null
  hover: FloorRef | null
  onHover: (f: FloorRef | null) => void
  onPick: (f: FloorRef) => void
  onTower: (t: number) => void
}

// shared by every material: a glowing band for the chosen floor, the other towers dimmed,
// and rooms lit behind some of the glass
const uniforms = {
  uBand: { value: new THREE.Vector4(0, 0, 0, 0) }, // y from, y to, x from, x to (metres)
  uBandOn: { value: 0 },
  uZone: { value: new THREE.Vector2(-99, 99) },
  uDim: { value: 0 },
}
function tuned(m: THREE.MeshStandardMaterial, lit: boolean) {
  m.flatShading = true
  m.side = THREE.DoubleSide
  m.customProgramCacheKey = () => (lit ? 'lit' : 'plain') // the two variants share one function source
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms)
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vMp;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvMp = (modelMatrix * vec4(transformed, 1.0)).xyz / ${S.toFixed(3)};`)
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vMp;
        uniform vec4 uBand; uniform float uBandOn; uniform vec2 uZone; uniform float uDim;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        ${lit ? `
        vec2 pane = floor(vec2(vMp.x + vMp.z, vMp.y) / vec2(2.6, 3.8));
        float room = fract(sin(dot(pane, vec2(12.9898, 78.233))) * 43758.5453);
        if (room > 0.62) totalEmissiveRadiance += vec3(1.0, 0.62, 0.3) * (0.28 + room * 0.3);` : ''}
        bool inZone = vMp.x > uZone.x && vMp.x < uZone.y;
        if (!inZone) { diffuseColor.rgb *= 1.0 - uDim * 0.72; totalEmissiveRadiance *= 1.0 - uDim * 0.8; }
        if (vMp.y > uBand.x && vMp.y < uBand.y && vMp.x > uBand.z && vMp.x < uBand.w)
          totalEmissiveRadiance += vec3(0.45, 0.85, 0.65) * uBandOn;`)
  }
  return m
}

function Building({ props }: { props: Props }) {
  const { scene } = useGLTF(MODEL_URL, false, true)
  useMemo(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const m = mesh.material as THREE.MeshStandardMaterial
      if (m.name === 'stone') m.color.set('#e6dccb')
      if (m.name === 'iron') m.color.set('#161513')
      if (m.name === 'stair') m.color.set('#8e2620')
      if (m.name === 'glass') { m.color.set('#27323c'); m.roughness = 0.08; m.metalness = 0.7 }
      tuned(m, m.name === 'glass')
      mesh.castShadow = m.name !== 'glass'
      mesh.receiveShadow = true
    })
  }, [scene])
  useFrame(() => {
    const active = props.hover ?? (props.tower !== null && props.floor !== null ? { tower: props.tower, floor: props.floor } : null)
    if (active) {
      const [a, b] = ZONES[active.tower]
      uniforms.uBand.value.set(LEVELS[active.floor], LEVELS[active.floor + 1], a, b)
    }
    uniforms.uBandOn.value += ((active ? (props.hover ? 0.14 : 0.24) : 0) - uniforms.uBandOn.value) * 0.2
    uniforms.uDim.value += ((props.tower !== null ? 1 : 0) - uniforms.uDim.value) * 0.15
    if (props.tower !== null) uniforms.uZone.value.set(ZONES[props.tower][0], ZONES[props.tower][1])
  })
  // picking runs against one plain box per tower, not the 680,000 triangles of the model;
  // the height of the hit gives the floor
  const floorAt = (t: number, y: number) => {
    const m = y / S
    let f = 0
    while (f < LEVELS.length - 2 && m >= LEVELS[f + 1]) f++
    return Math.min(f, residentialFloors(t))
  }
  const over = (t: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const f = floorAt(t, e.point.y)
    if (f === 0) { props.onHover(null); document.body.style.cursor = ''; return }
    if (props.hover?.tower !== t || props.hover.floor !== f) props.onHover({ tower: t, floor: f })
    document.body.style.cursor = 'pointer'
  }
  return (
    <group>
      <group scale={S}><primitive object={scene} /></group>
      {TOWERS.map((z, t) => (
        <mesh key={t} visible={false} position={[z.x, z.h / 2, 0]}
          onPointerMove={over(t)}
          onPointerOut={() => { props.onHover(null); document.body.style.cursor = '' }}
          onClick={(e) => { e.stopPropagation(); const f = floorAt(t, e.point.y); if (f > 0) props.onPick({ tower: t, floor: f }); else props.onTower(t) }}>
          <boxGeometry args={[z.w, z.h, 23.4 * S]} />
        </mesh>
      ))}
    </group>
  )
}
useGLTF.preload(MODEL_URL, false, true)

// image-based light for the glass and iron, built from three's studio room (no download),
// and sun shadows that are drawn once: nothing in the scene moves
function Atmosphere() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    scene.environmentIntensity = 0.35
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    return () => { scene.environment = null; env.dispose(); pmrem.dispose() }
  }, [gl, scene])
  return null
}

function Rig({ tower, floor, spin }: Pick<Props, 'tower' | 'floor' | 'spin'>) {
  const controls = useRef<OrbitControlsImpl>(null)
  const { camera, size } = useThree()
  const orbit = useMemo(() => ({ az: 0.19, target: HOME.clone(), r: undefined as number | undefined, pol: undefined as number | undefined }), [])
  const want = useMemo(() => HOME.clone(), [])
  const v = useMemo(() => new THREE.Vector3(), [])
  const sph = useMemo(() => new THREE.Spherical(), [])
  // a camera flight runs after each selection, and stops as soon as the visitor drags
  const fly = useMemo(() => ({ active: false, dist: VIEW.all.dist, phi: VIEW.all.phi, front: false }), [])

  useEffect(() => {
    if (tower === null) want.copy(HOME)
    else want.set(TOWERS[tower].x, floor ? floorMid(floor) : TOWERS[tower].h / 2, TOWERS[tower].z)
    const view = tower === null ? VIEW.all : floor ? VIEW.floor : VIEW.tower
    Object.assign(fly, { active: true, dist: view.dist, phi: view.phi, front: floor !== null && tower !== null })
  }, [tower, floor, want, fly])

  useEffect(() => {
    const c = controls.current
    if (!c) return
    const stop = () => { fly.active = false }
    c.addEventListener('start', stop)
    return () => c.removeEventListener('start', stop)
  }, [fly])

  useFrame((state, dt) => {
    const c = controls.current
    // time-based easing, so the flight takes the same time at any frame rate
    const ease = 1 - Math.exp(-dt * 4)
    if (c) {
      c.target.lerp(want, ease)
      if (fly.active) {
        // ease the camera in (or back out) around the new target
        const k = ease
        sph.setFromVector3(v.copy(camera.position).sub(c.target))
        sph.radius += (fly.dist - sph.radius) * k
        sph.phi += (fly.phi - sph.phi) * k
        if (fly.front) sph.theta += (Math.atan2(Math.sin(0.12 - sph.theta), Math.cos(0.12 - sph.theta))) * k // swing round to face the floor
        camera.position.copy(c.target).add(v.setFromSpherical(sph))
        if (Math.abs(sph.radius - fly.dist) < 0.03 && Math.abs(sph.phi - fly.phi) < 0.005 && c.target.distanceTo(want) < 0.01) fly.active = false
      }
      c.autoRotate = tower === null && !fly.active
      // turn back and forth across the front instead of all the way round
      const az = c.getAzimuthalAngle()
      if (az > SWAY) c.autoRotateSpeed = -0.4
      else if (az < -SWAY) c.autoRotateSpeed = 0.4
      c.update()
    } else if (spin.current !== null) {
      // touch: a fixed-height orbit driven by the turn buttons; the overview sways gently
      if (floor !== null) spin.current += (Math.round((spin.current - 0.12) / (Math.PI * 2)) * Math.PI * 2 + 0.12 - spin.current) * ease
      const sway = tower === null ? Math.sin(state.clock.elapsedTime * 0.3) * SWAY : 0
      orbit.az += (spin.current + sway - orbit.az) * Math.min(1, dt * 4)
      orbit.target.lerp(want, ease)
      // far enough back that the view's width fits the screen, whatever its shape
      const view = tower === null ? VIEW.all : floor ? VIEW.floor : VIEW.tower
      const cam = camera as THREE.PerspectiveCamera
      const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * (size.width / size.height))
      const fit = view.width / 2 / Math.tan(hfov / 2)
      const r = Math.max(view.dist * 0.8, Number.isFinite(fit) ? fit : view.dist) // the canvas can measure 0 x 0 before layout
      orbit.r = orbit.r === undefined || !Number.isFinite(orbit.r) ? r : orbit.r + (r - orbit.r) * ease
      orbit.pol = (orbit.pol ?? view.phi) + (view.phi - (orbit.pol ?? view.phi)) * ease
      camera.position.set(
        orbit.target.x + orbit.r * Math.sin(orbit.pol) * Math.sin(orbit.az),
        orbit.target.y + orbit.r * Math.cos(orbit.pol),
        orbit.target.z + orbit.r * Math.sin(orbit.pol) * Math.cos(orbit.az),
      )
      camera.lookAt(orbit.target)
    }
  })
  if (coarsePointer) return null
  return (
    <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping dampingFactor={0.08}
      minDistance={8} maxDistance={44} minPolarAngle={0.35} maxPolarAngle={1.45} autoRotateSpeed={0.4} />
  )
}

export function SelectorScene(props: Props) {
  return (
    <>
      <fog attach="fog" args={['#8f96a8', 80, 460]} />
      <Atmosphere />
      {/* dusk, as in the renders: a slate sky, snow bounce from below, low warm sun with shadows */}
      <hemisphereLight args={['#93a7c4', '#6f747e', 0.55]} />
      <directionalLight position={[-26, 15, 18]} intensity={1.5} color="#ffe2c4" castShadow
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.005} shadow-normalBias={0.12}
        shadow-camera-left={-32} shadow-camera-right={32} shadow-camera-top={32} shadow-camera-bottom={-32} shadow-camera-near={1} shadow-camera-far={90} />
      <directionalLight position={[14, 8, -12]} intensity={0.45} color="#9fb6cf" />
      <Rig tower={props.tower} floor={props.floor} spin={props.spin} />
      <group onPointerMissed={() => props.onHover(null)}>
        <Building props={props} />
      </group>
      <Landscape />
      {/* a soft glow round the lit rooms */}
      <EffectComposer multisampling={2}>
        <Bloom mipmapBlur intensity={0.4} luminanceThreshold={0.93} luminanceSmoothing={0.15} radius={0.5} />
        <Vignette eskil={false} offset={0.35} darkness={0.5} />
      </EffectComposer>
    </>
  )
}
