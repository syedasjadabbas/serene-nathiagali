import { use, useEffect, useMemo, useRef } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { elevation, loadDem, project, EXAG, MAP_W, MAP_D, PLACES, SERENE, ROUTE_MAIN, ROUTE_ABBOTTABAD, LABELLED, type Place } from './geo'
import { fogGLSL } from './shaders'

import { mapState } from './state'

// mapState.shown follows the scroll at a capped pace so the whole drive takes at least DRIVE_SECONDS.
const DRIVE_SECONDS = 3.5

function Pacer() {
  useFrame((_, dt) => {
    const step = Math.min(dt, 0.1) / DRIVE_SECONDS
    mapState.drawn = true
    const d = mapState.progress - mapState.shown
    mapState.shown += Math.max(-step, Math.min(step, d))
  })
  return null
}

// daylight haze: the sky colour at the horizon and the colour distant terrain fades into
const BG = '#8a9ea8'

// Real satellite imagery of the Galyat (Copernicus Sentinel-2, 23 Feb 2026), aligned with the
// terrain grid: it covers world x -40…34 km and z -44…48 km, the same tile as the elevation mesh.
export const SAT_URL = (lite: boolean) => `/assets/map/galyat-sat-${lite ? 2048 : 4096}.jpg`
const SAT_RECT = new THREE.Vector4(-40, -44, 74, 92)
/** Starts loading the satellite texture early (called from the 3D preloader). */
export const preloadMapTexture = (lite: boolean) => useLoader.preload(THREE.ImageBitmapLoader, SAT_URL(lite))
const worldAt = (lat: number, lon: number, lift = 0) => {
  const [x, z] = project(lat, lon)
  return new THREE.Vector3(x, elevation(x, z) * EXAG + lift, z)
}
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

// scroll choreography
export const PHASE = { grow: [0, 0.14], main: [0.14, 0.66], abbottabad: [0.6, 0.76], arrive: [0.74, 0.96] } as const

/* ---------- terrain ---------- */

const terrainVert = /* glsl */ `
uniform float uGrow;
varying float vH;
varying vec3 vN;
varying vec3 vWorld;
varying float vDepth;
void main(){
  vH = position.y / ${EXAG.toFixed(2)};
  vec3 p = position; p.y *= uGrow;
  vN = normalize(normal * vec3(1.0, 1.0 / max(uGrow, 0.05), 1.0));
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWorld = wp.xyz;
  vec4 mv = viewMatrix * wp; vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`

const terrainFrag = /* glsl */ `
uniform sampler2D uSat;
uniform vec4 uSatRect;
uniform vec2 uHome;
uniform float uScan;
uniform vec2 uHalf;
uniform vec3 uBg;
varying float vH;
varying vec3 vN;
varying vec3 vWorld;
varying float vDepth;
${fogGLSL}
void main(){
  vec3 n = normalize(vN);
  // ground colour from the satellite image under this point
  vec2 uv = (vWorld.xz - uSatRect.xy) / uSatRect.zw;
  vec3 albedo = texture2D(uSat, uv).rgb;

  // relief from the elevation model, lit from the south-east like the image's own sun
  vec3 sun = normalize(vec3(0.45, 0.7, 0.55));
  float shade = 0.7 + 0.5 * max(dot(n, sun), 0.0) + 0.08 * (n.y - 0.9);
  vec3 c = albedo * shade;

  // gentle grade: a touch more contrast and colour than the raw scene
  c = (c - 0.5) * 1.1 + 0.5;
  float luma = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(luma), c, 1.15);

  // warm pulse travelling out from Serene Heights
  float d = distance(vWorld.xz, uHome);
  float ring = exp(-pow((d - uScan) * 1.6, 2.0)) * smoothstep(40.0, 0.0, uScan);
  float halo = exp(-d * 0.6);
  c += vec3(1.0, 0.86, 0.62) * (ring * 0.1 + halo * 0.07);

  // aerial perspective: distant ground fades into the haze
  c = applyFog(clamp(c, 0.0, 1.0), vDepth);
  // soft, rounded fade at the tile's edge so it never reads as a flat rectangle
  vec2 e = abs(vWorld.xz - vec2(-3.0, 2.0)) / uHalf;
  float r = pow(pow(e.x, 4.0) + pow(e.y, 4.0), 0.25);
  float edge = smoothstep(1.0, 0.6, r);
  gl_FragColor = vec4(mix(uBg, c, edge), 1.0);
}`

function Terrain({ segs, grow, scan, sat }: { segs: number; grow: React.RefObject<number>; scan: React.RefObject<number>; sat: THREE.Texture }) {
  const { geometry, material } = useMemo(() => {
    const g = new THREE.PlaneGeometry(MAP_W, MAP_D, segs, Math.round(segs * (MAP_D / MAP_W)))
    g.rotateX(-Math.PI / 2)
    g.translate(-3, 0, 2) // centre the tile between Islamabad and Abbottabad
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) pos.setY(i, elevation(pos.getX(i), pos.getZ(i)) * EXAG)
    g.computeVertexNormals()
    const [hx, hz] = project(SERENE.lat, SERENE.lon)
    const m = new THREE.ShaderMaterial({
      vertexShader: terrainVert, fragmentShader: terrainFrag, toneMapped: false,
      uniforms: {
        uGrow: { value: 0 }, uScan: { value: 0 }, uTime: { value: 0 },
        uSat: { value: sat }, uSatRect: { value: SAT_RECT },
        uHome: { value: new THREE.Vector2(hx, hz) },
        uHalf: { value: new THREE.Vector2(MAP_W / 2, MAP_D / 2) },
        uBg: { value: new THREE.Color(BG) },
        uFogColor: { value: new THREE.Color(BG) }, uFogNear: { value: 70 }, uFogFar: { value: 230 },
      },
    })
    return { geometry: g, material: m }
  }, [segs, sat])
  useFrame((s) => {
    material.uniforms.uGrow.value = Math.max(0.02, grow.current ?? 0)
    material.uniforms.uScan.value = scan.current ?? 0
    material.uniforms.uTime.value = s.clock.elapsedTime
  })
  return <mesh geometry={geometry} material={material} />
}

/* ---------- routes: glowing line that draws itself along the road ---------- */

const routeVert = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
const routeFrag = /* glsl */ `
uniform float uDraw;
uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;
void main(){
  if (vUv.x > uDraw) discard;
  // bright drawing head, which fades out once the route is complete
  float head = exp(-(uDraw - vUv.x) * 60.0) * (1.0 - smoothstep(0.96, 1.0, uDraw));
  float pulse = 0.5 + 0.5 * sin(vUv.x * 160.0 - uTime * 4.0);
  // stays just under the bloom threshold, so only the drawing head glows
  vec3 c = uColor * (0.82 + pulse * 0.12) + vec3(1.0, 0.95, 0.85) * head * 1.4;
  gl_FragColor = vec4(c, 1.0);
}`

function buildRoute(points: [number, number][]) {
  const raw = points.map(([la, lo]) => worldAt(la, lo, 0.28))
  const rough = new THREE.CatmullRomCurve3(raw, false, 'centripetal')
  // drape: resample and lift each point above the terrain beneath it
  const dense = rough.getSpacedPoints(400).map((p) => new THREE.Vector3(p.x, elevation(p.x, p.z) * EXAG + 0.28, p.z))
  return new THREE.CatmullRomCurve3(dense, false, 'centripetal')
}

function Route({ curve, draw, color, radius }: { curve: THREE.CatmullRomCurve3; draw: React.RefObject<number>; color: string; radius: number }) {
  const { geometry, material } = useMemo(() => {
    const g = new THREE.TubeGeometry(curve, 600, radius, 6, false)
    const m = new THREE.ShaderMaterial({
      vertexShader: routeVert, fragmentShader: routeFrag, toneMapped: false,
      uniforms: { uDraw: { value: 0 }, uTime: { value: 0 }, uColor: { value: new THREE.Color(color) } },
    })
    return { geometry: g, material: m }
  }, [curve, color, radius])
  useFrame((s) => {
    material.uniforms.uDraw.value = draw.current ?? 0
    material.uniforms.uTime.value = s.clock.elapsedTime
  })
  return <mesh geometry={geometry} material={material} />
}

// The second road as a row of round dots, kept in front of the terrain: a line on the ground
// disappears behind every ridge between Abbottabad and the resort.
const dotsVert = /* glsl */ `
attribute float aAlong;
uniform float uSize;
varying float vAlong;
void main(){
  vAlong = aAlong;
  gl_PointSize = uSize;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`
const dotsFrag = /* glsl */ `
uniform float uDraw;
uniform vec3 uColor;
varying float vAlong;
void main(){
  if (vAlong > uDraw) discard;
  float r = length(gl_PointCoord - 0.5) * 2.0;
  // a thin dark rim keeps the dots readable over pale ground
  float dot_ = 1.0 - smoothstep(0.82, 1.0, r);
  float core = 1.0 - smoothstep(0.6, 0.74, r);
  gl_FragColor = vec4(mix(vec3(0.1, 0.07, 0.04), uColor, core), dot_);
}`

function DottedRoute({ curve, draw, color, count }: { curve: THREE.CatmullRomCurve3; draw: React.RefObject<number>; color: string; count: number }) {
  const dpr = useThree((s) => s.viewport.dpr)
  const { geometry, material } = useMemo(() => {
    const pts = curve.getSpacedPoints(count)
    const g = new THREE.BufferGeometry().setFromPoints(pts)
    g.setAttribute('aAlong', new THREE.BufferAttribute(new Float32Array(pts.map((_, i) => i / count)), 1))
    const m = new THREE.ShaderMaterial({
      vertexShader: dotsVert, fragmentShader: dotsFrag, toneMapped: false, transparent: true, depthTest: false, depthWrite: false,
      uniforms: { uDraw: { value: 0 }, uColor: { value: new THREE.Color(color) }, uSize: { value: 9 } },
    })
    return { geometry: g, material: m }
  }, [curve, color, count])
  useFrame(() => {
    material.uniforms.uDraw.value = draw.current ?? 0
    material.uniforms.uSize.value = 9 * dpr
  })
  return <points geometry={geometry} material={material} renderOrder={5} frustumCulled={false} />
}

/* ---------- Serene Heights beacon ---------- */

const beamFrag = /* glsl */ `
uniform float uOn;
uniform float uTime;
varying vec2 vUv;
void main(){
  float a = pow(1.0 - vUv.y, 2.2) * uOn * (0.75 + 0.25 * sin(uTime * 2.0));
  gl_FragColor = vec4(vec3(0.85, 1.0, 0.93) * a * 2.2, a);
}`
const ringFrag = /* glsl */ `
uniform float uOn;
uniform float uTime;
varying vec2 vUv;
void main(){
  float r = length(vUv - 0.5) * 2.0;
  float t = fract(uTime * 0.45);
  float ring = smoothstep(0.06, 0.0, abs(r - t)) * (1.0 - t);
  float core = smoothstep(0.16, 0.0, r);
  float a = (ring + core) * uOn;
  gl_FragColor = vec4(vec3(0.85, 1.0, 0.93) * a * 2.0, a);
}`

function Beacon({ on }: { on: React.RefObject<number> }) {
  const pos = useMemo(() => worldAt(SERENE.lat, SERENE.lon), [])
  const mats = useMemo(() => {
    const mk = (frag: string) => new THREE.ShaderMaterial({
      vertexShader: routeVert, fragmentShader: frag, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide,
      uniforms: { uOn: { value: 0 }, uTime: { value: 0 } },
    })
    return [mk(beamFrag), mk(ringFrag)]
  }, [])
  useFrame((s) => mats.forEach((m) => { m.uniforms.uOn.value = on.current ?? 0; m.uniforms.uTime.value = s.clock.elapsedTime }))
  return (
    <group position={pos}>
      <mesh material={mats[0]} position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.05, 0.22, 4.4, 16, 1, true]} />
      </mesh>
      <mesh material={mats[1]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
        <planeGeometry args={[3.2, 3.2]} />
      </mesh>
    </group>
  )
}

/* ---------- labels: plain DOM, positioned from the camera every frame ---------- */


function LabelProjector({ els }: { els: React.RefObject<(HTMLDivElement | null)[]> }) {
  const { camera, size } = useThree()
  const anchors = useMemo(() => LABELLED.map((pl) => worldAt(pl.lat, pl.lon, pl.kind === 'home' ? 2.6 : 1.2)), [])
  const v = useMemo(() => new THREE.Vector3(), [])
  const homeAt = useMemo(() => ({ x: 0, y: 0, on: false }), [])
  useFrame(() => {
    const p = mapState.shown
    const on = p > 0.1, arrived = p >= PHASE.arrive[0]
    // phones: keep names inside the screen, out from under the header and the text card,
    // and clear of Serene Heights once arrived
    const narrow = size.width < 760
    const top = 104, bottom = size.height * 0.58
    // Serene Heights first, so the towns can keep clear of it in the same frame
    LABELLED.map((pl, i) => [pl, i] as const).sort((x, y) => (x[0].kind === 'home' ? -1 : y[0].kind === 'home' ? 1 : 0)).forEach(([pl, i]) => {
      const el = els.current?.[i]
      if (!el) return
      v.copy(anchors[i]).project(camera)
      let hidden = v.z > 1 || Math.abs(v.x) > 1.2 || Math.abs(v.y) > 1.2
      let x = ((v.x + 1) / 2) * size.width, y = ((1 - v.y) / 2) * size.height
      if (narrow) {
        const half = pl.kind === 'home' ? Math.min(140, size.width / 2 - 8) : 64 // the arrived label is the widest
        x = Math.min(size.width - half, Math.max(half, x))
        if (pl.kind === 'home') {
          // shown once it is really in view; at arrival held inside the open part of the screen
          if (arrived) y = Math.min(bottom, Math.max(top + 20, y))
          else hidden ||= y < top || y > bottom
          homeAt.x = x
          homeAt.y = y
          homeAt.on = !hidden
        } else {
          hidden ||= y < top || y > bottom
          if (homeAt.on && Math.abs(x - homeAt.x) < 175 && Math.abs(y - homeAt.y) < 90) hidden = true
        }
      }
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`
      el.classList.toggle('on', on && !hidden)
      el.classList.toggle('active', pl === SERENE && arrived)
      el.classList.toggle('dim', pl.kind === 'town' && arrived)
    })
  })
  return null
}

/* ---------- camera choreography ---------- */

function CameraRig({ main, home }: { main: THREE.CatmullRomCurve3; home: THREE.Vector3 }) {
  const { camera, size } = useThree()
  const s = useMemo(() => ({ p: 0, px: 0, py: 0, pos: new THREE.Vector3(-8, 108, 66), look: new THREE.Vector3() }), [])
  const want = useMemo(() => new THREE.Vector3(), [])
  const look = useMemo(() => new THREE.Vector3(), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    const a = size.width / size.height
    cam.fov = a < 0.8 ? 60 : a < 1.2 ? 48 : 38
    cam.updateProjectionMatrix()
  }, [camera, size])

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 3)
    s.p += (mapState.shown - s.p) * k
    s.px += (mapState.pointerX - s.px) * k
    s.py += (mapState.pointerY - s.py) * k
    const p = s.p

    // 1. overview of the whole Galiyat, tilting down as the terrain rises
    const g = ease(range(p, 0, PHASE.grow[1]))
    want.set(-8, 108 - g * 18, 66 - g * 6)
    look.set(-15, 0, 0)

    // 2. follow the road from Islamabad up through Murree and the galis
    const m = range(p, PHASE.main[0], PHASE.main[1])
    if (m > 0) {
      const t = ease(m)
      main.getPointAt(Math.min(0.999, t), tmp)
      const blend = ease(range(p, PHASE.main[0], PHASE.main[0] + 0.08))
      // aim left of the road so it sits on the right, clear of the caption
      const aim = tmp.clone().add(new THREE.Vector3(size.width > 760 ? -9 : 0, 0, size.width > 760 ? 2 : 6))
      want.lerp(aim.clone().add(new THREE.Vector3(-9, 22, 24)), blend)
      look.lerp(aim, blend)
    }

    // 3. settle on Serene Heights, low and close, Abbottabad valley behind
    const a = ease(range(p, PHASE.arrive[0], PHASE.arrive[1]))
    if (a > 0) {
      const side = size.width > 760 ? -3.2 : 0
      want.lerp(tmp.copy(home).add(new THREE.Vector3(8 + side, 9.5, 14)), a)
      look.lerp(home.clone().add(new THREE.Vector3(-1 + side, 2.2, -1.5)), a)
    }

    want.x += s.px * 2
    want.y += s.py * 1.2
    s.pos.lerp(want, k * 1.4)
    s.look.lerp(look, k * 1.4)
    camera.position.copy(s.pos)
    camera.lookAt(s.look)
  })
  return null
}

/* ---------- scene ---------- */

export function MapScene({ lite, onStop, labelEls }: { lite: boolean; onStop: (i: number) => void; labelEls: React.RefObject<(HTMLDivElement | null)[]> }) {
  use(loadDem()) // suspend until the elevation grid is in
  // decoded off the main thread as an ImageBitmap; a plain image would be decoded during the
  // first draw, stalling the page while the 13-megapixel photo unpacks
  const satImage = useLoader(THREE.ImageBitmapLoader, SAT_URL(lite))
  const sat = useMemo(() => {
    const t = new THREE.Texture(satImage)
    t.colorSpace = THREE.NoColorSpace // sampled as-is: the shader outputs the image's own sRGB values
    t.flipY = false // image row 0 is the north edge, i.e. the smallest z (bitmaps are never flipped)
    t.anisotropy = 8
    t.needsUpdate = true
    return t
  }, [satImage])
  const main = useMemo(() => buildRoute(ROUTE_MAIN), [])
  const abbottabad = useMemo(() => buildRoute(ROUTE_ABBOTTABAD), [])
  const home = useMemo(() => worldAt(SERENE.lat, SERENE.lon), [])

  const grow = useRef(0), scan = useRef(0)
  const drawMain = useRef(0), drawAbb = useRef(0), beacon = useRef(0)
  const stopRef = useRef(-1)

  // where each labelled stop sits along the main road (0–1)
  const stops = useMemo(() => {
    const names = ['Islamabad', 'Murree', 'Ayubia', 'Nathia Gali']
    const samples = main.getSpacedPoints(400)
    return names.map((n) => {
      const pl = PLACES.find((p) => p.name === n)!
      const w = worldAt(pl.lat, pl.lon)
      let best = 0, bd = Infinity
      samples.forEach((s, i) => { const d = Math.hypot(s.x - w.x, s.z - w.z); if (d < bd) { bd = d; best = i } })
      return best / 400
    })
  }, [main])

  useFrame((st) => {
    const p = mapState.shown
    grow.current = ease(range(p, 0.01, PHASE.grow[1]))
    drawMain.current = ease(range(p, PHASE.main[0], PHASE.main[1]))
    drawAbb.current = ease(range(p, PHASE.abbottabad[0], PHASE.abbottabad[1]))
    beacon.current = range(p, 0.08, 0.18)
    scan.current = (st.clock.elapsedTime * 9) % 46

    // HUD stop index: 0..3 along the main road, 4 = Abbottabad, 5 = arrival
    let idx = -1
    stops.forEach((t, i) => { if (drawMain.current >= t - 0.02) idx = i })
    if (drawAbb.current > 0.3) idx = 4
    if (p >= PHASE.arrive[0] + 0.06) idx = 5
    if (idx !== stopRef.current) { stopRef.current = idx; onStop(idx) }

  })

  return (
    <>
      <color attach="background" args={[BG]} />
      <Pacer />
      <CameraRig main={main} home={home} />
      <LabelProjector els={labelEls} />
      <group>
        <Terrain segs={lite ? 160 : 240} grow={grow} scan={scan} sat={sat} />
        <Route curve={main} draw={drawMain} color="#ffd79a" radius={0.08} />
        <DottedRoute curve={abbottabad} draw={drawAbb} color="#ffe7c4" count={64} />
        <Beacon on={beacon} />
      </group>
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={lite ? 0.5 : 0.65} luminanceThreshold={0.97} luminanceSmoothing={0.1} radius={0.6} />
        <Vignette eskil={false} offset={0.3} darkness={0.55} />
      </EffectComposer>
    </>
  )
}
