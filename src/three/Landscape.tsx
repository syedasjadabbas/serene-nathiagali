import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { elevation, loadDem, project, SERENE } from './geo'

// The land round the building, after the renders: the real Galiyat relief from the map's
// elevation data, dusted with snow and pine forest, a sea of cloud in the valleys and a
// dusk sky. Distance is compressed so the ridges fit the frame; their outlines are true.
const KM = 14 // scene units per km of ground
const PER_M = 0.032 // scene units per metre of height
const PLATEAU = 16 // the building's level ground
const REACH = 430 // where the land ends, inside the sky
const [SX, SZ] = project(SERENE.lat, SERENE.lon)

const rng = (seed: number) => {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}
function noise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y)
  let fx = x - ix, fy = y - iy
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy)
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1)
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
}
const fbm = (x: number, y: number) => noise(x, y) * 0.55 + noise(x * 2.1, y * 2.1) * 0.3 + noise(x * 4.3, y * 4.3) * 0.15

/** Ground height at scene x,z: level round the building, the real terrain further out. */
function makeHeight() {
  const base = elevation(SX, SZ)
  return (x: number, z: number) => {
    const r = Math.hypot(x, z)
    const real = (elevation(SX + x / KM, SZ + z / KM) - base) * 1000 * PER_M
    const near = (fbm(x * 0.05 + 7, z * 0.05) - 0.5) * 3 - smooth(PLATEAU, 60, r) * 3
    return near * (1 - smooth(30, 110, r)) + real * smooth(PLATEAU, 110, r)
  }
}

function terrainGeometry(height: (x: number, z: number) => number) {
  // rings packed tight near the building and wide at the horizon
  const RINGS = 170, SPOKES = 360
  const pos = new Float32Array((RINGS + 1) * SPOKES * 3)
  for (let i = 0; i <= RINGS; i++) {
    const r = 2 + (REACH - 2) * Math.pow(i / RINGS, 2.2)
    for (let j = 0; j < SPOKES; j++) {
      const a = (j / SPOKES) * Math.PI * 2
      const x = Math.cos(a) * r, z = Math.sin(a) * r
      pos.set([x, height(x, z), z], (i * SPOKES + j) * 3)
    }
  }
  const idx: number[] = []
  for (let i = 0; i < RINGS; i++) {
    for (let j = 0; j < SPOKES; j++) {
      const a = i * SPOKES + j, b = i * SPOKES + (j + 1) % SPOKES, c = a + SPOKES, d = b + SPOKES
      idx.push(a, c, b, b, c, d)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  // snow on the open ground, dark forest showing through on the slopes and lower down
  const nrm = g.getAttribute('normal')
  const col = new Float32Array(pos.length)
  const snow = new THREE.Color('#e4e9ef'), forest = new THREE.Color('#1d3029'), frosted = new THREE.Color('#71827f'), c = new THREE.Color()
  for (let v = 0; v < pos.length / 3; v++) {
    const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2]
    const r = Math.hypot(x, z)
    const patch = fbm(x * 0.09, z * 0.09)
    const fine = fbm(x * 0.5 + 3, z * 0.5)
    const steep = 1 - nrm.getY(v)
    const bare = smooth(0.42, 0.6, patch + steep * 0.8 + fine * 0.12 - y * 0.0012)
    c.copy(snow).lerp(fine > 0.5 ? frosted : forest, bare * smooth(PLATEAU + 6, 40, r))
    col.set([c.r, c.g, c.b], v * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return g
}

// pines drawn once onto a canvas, bough by bough with snow lying on each, then stood on two
// crossed planes: far more convincing than modelled cones, at 4 triangles a tree
function pineTexture() {
  const W = 512, H = 1024
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const g = c.getContext('2d')!
  const r = rng(11)
  g.strokeStyle = '#2c2119'
  g.lineWidth = 9
  g.beginPath(); g.moveTo(W / 2, H); g.lineTo(W / 2, 40); g.stroke()
  // boughs from the bottom up, so the upper ones overlap the lower
  for (let y = H - 90; y > 30; y -= 7 + r() * 7) {
    const t = 1 - y / H // 0 at the foot, 1 at the tip
    const reach = (W / 2 - 14) * Math.pow(1 - t, 0.85) * (0.72 + r() * 0.28)
    for (const side of [-1, 1]) {
      const len = reach * (0.75 + r() * 0.25)
      const droop = 18 + len * 0.28
      // needles fan out along the bough
      for (let k = 0; k < len / 3; k++) {
        const u = k / (len / 3)
        const x = W / 2 + side * len * u, by = y + droop * u * u
        const l = 12 + r() * 20 * (1 - u * 0.4)
        g.strokeStyle = r() > 0.5 ? '#16291f' : '#1f3a2b'
        g.lineWidth = 2 + r() * 2
        g.beginPath(); g.moveTo(x, by); g.lineTo(x + side * l * 0.5, by + l); g.stroke()
      }
      // snow settled along the top of the bough, in clumps
      for (let k = 0; k < len / 9; k++) {
        const u = 0.15 + r() * 0.85
        const x = W / 2 + side * len * u, by = y + droop * u * u - 3
        const rad = 4 + r() * 11 * (1 - u * 0.5)
        g.fillStyle = r() > 0.3 ? '#f4f6f9' : '#cfd8e4'
        g.beginPath(); g.ellipse(x, by, rad * 1.5, rad * 0.7, side * 0.25, 0, Math.PI * 2); g.fill()
      }
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

function forest(height: (x: number, z: number) => number, map: THREE.Texture) {
  const COUNT = 2600
  const a0 = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0)
  const geo = mergeGeometries([a0, a0.clone().rotateY(Math.PI / 2)])!
  const m = new THREE.MeshStandardMaterial({ map, alphaTest: 0.5, roughness: 1, envMapIntensity: 0.2, side: THREE.DoubleSide })
  const inst = new THREE.InstancedMesh(geo, m, COUNT)
  inst.castShadow = true
  const o = new THREE.Object3D()
  const c = new THREE.Color()
  const r = rng(5)
  let i = 0
  while (i < COUNT) {
    // dense near the building, thinning to where the terrain's own canopy takes over
    const a = r() * Math.PI * 2, d = 13 + Math.pow(r(), 1.5) * 150
    const x = Math.cos(a) * d, z = Math.sin(a) * d
    if (z > 5 && Math.abs(x) < 11 && d < 34) continue // the open slope in front
    if (fbm(x * 0.06 + 4, z * 0.06) < 0.42 && d < 60) continue // clearings
    const h = 3 + r() * 3.6
    o.position.set(x, height(x, z) - 0.15, z)
    o.rotation.set(0, r() * Math.PI, 0)
    const w = h * (0.5 + r() * 0.16)
    o.scale.set(w, h, w)
    o.updateMatrix()
    inst.setMatrixAt(i, o.matrix)
    inst.setColorAt(i++, c.setScalar(0.78 + r() * 0.22))
  }
  return inst
}

// tree tops seen from afar: dark crowns flecked with snow, laid over the forested slopes
function canopyTexture() {
  const S = 512
  const c = document.createElement('canvas')
  c.width = S; c.height = S
  const g = c.getContext('2d')!
  g.fillStyle = '#16251e'
  g.fillRect(0, 0, S, S)
  const r = rng(77)
  for (let i = 0; i < 5200; i++) {
    const x = r() * S, y = r() * S, rad = 2 + r() * 7
    g.fillStyle = ['#1f3429', '#2a4235', '#54675f', '#b9c4c9', '#e6ebf0'][Math.floor(r() * r() * 5 + r() * 1.2) % 5]
    for (const dx of [0, -S, S]) for (const dy of [0, -S, S]) { g.beginPath(); g.arc(x + dx, y + dy, rad, 0, Math.PI * 2); g.fill() }
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 4
  return t
}

// paints the canopy over the darker (forested) ground; snow stays clean
function canopied(m: THREE.MeshStandardMaterial, map: THREE.Texture) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uCanopy = { value: map }
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vGround;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGround = position.xz;')
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vGround; uniform sampler2D uCanopy;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float wood = 1.0 - smoothstep(0.1, 0.7, dot(diffuseColor.rgb, vec3(0.33)));
        vec3 crowns = texture2D(uCanopy, vGround * 0.11).rgb * 0.6 + texture2D(uCanopy, vGround * 0.031).rgb * 0.5;
        diffuseColor.rgb = mix(diffuseColor.rgb, crowns, wood);`)
  }
}

// dusk sky painted once onto a canvas: slate zenith, clouds, a warm band at the horizon
function skyTexture() {
  const W = 2048, H = 1024
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const g = c.getContext('2d')!
  const grad = g.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#182338')
  grad.addColorStop(0.3, '#26364f')
  grad.addColorStop(0.43, '#3d5070')
  grad.addColorStop(0.475, '#76809a')
  grad.addColorStop(0.497, '#d8c4b2')
  grad.addColorStop(0.53, '#a5a6b0')
  grad.addColorStop(1, '#6f7686')
  g.fillStyle = grad
  g.fillRect(0, 0, W, H)
  const r = rng(23)
  const puff = (x: number, y: number, rx: number, ry: number, rgb: string, a: number) => {
    for (const dx of [0, -W, W]) {
      g.save()
      g.translate(x + dx, y)
      g.scale(rx, ry)
      const p = g.createRadialGradient(0, 0, 0, 0, 0, 1)
      p.addColorStop(0, `rgba(${rgb},${a})`)
      p.addColorStop(1, `rgba(${rgb},0)`)
      g.fillStyle = p
      g.fillRect(-1, -1, 2, 2)
      g.restore()
    }
  }
  // long banks of slate cloud, lit from below near the horizon
  for (let i = 0; i < 420; i++) {
    const y = H * (0.2 + Math.pow(r(), 0.55) * 0.285)
    const low = y / (H * 0.5)
    const x = r() * W
    puff(x, y, 60 + r() * 220, 8 + r() * 26, '22,30,46', 0.1 + r() * 0.16)
    if (r() > 0.45) puff(x + 30, y + 10, 40 + r() * 140, 5 + r() * 12, low > 0.86 ? '236,206,178' : '148,162,186', 0.07 + r() * 0.13)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.mapping = THREE.EquirectangularReflectionMapping
  t.wrapS = THREE.RepeatWrapping
  return t
}

// the sea of cloud that fills the valleys below the ridge
function cloudTexture() {
  const S = 1024
  const c = document.createElement('canvas')
  c.width = S; c.height = S
  const g = c.getContext('2d')!
  const r = rng(41)
  for (let i = 0; i < 900; i++) {
    const x = r() * S, y = r() * S, rad = 30 + r() * 120
    for (const dx of [0, -S, S]) for (const dy of [0, -S, S]) {
      const p = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad)
      p.addColorStop(0, `rgba(238,232,230,${0.05 + r() * 0.1})`)
      p.addColorStop(1, 'rgba(238,232,230,0)')
      g.fillStyle = p
      g.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2)
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(3, 3)
  return t
}

export function Landscape() {
  const { gl, scene } = useThree()
  const [land, setLand] = useState<{ ground: THREE.BufferGeometry; trees: THREE.InstancedMesh; soil: THREE.MeshStandardMaterial } | null>(null)
  const clouds = useRef<THREE.MeshBasicMaterial>(null)
  const cloudMap = useMemo(cloudTexture, [])
  useEffect(() => {
    const sky = skyTexture()
    scene.background = sky
    return () => { scene.background = null; sky.dispose() }
  }, [scene])
  useEffect(() => {
    let live = true
    let built: typeof land = null
    loadDem().then(() => {
      if (!live) return
      const height = makeHeight()
      const soil = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, envMapIntensity: 0.25 })
      canopied(soil, canopyTexture())
      built = { ground: terrainGeometry(height), trees: forest(height, pineTexture()), soil }
      setLand(built)
      gl.shadowMap.needsUpdate = true
    })
    return () => {
      live = false
      if (!built) return
      built.ground.dispose()
      built.soil.dispose()
      built.trees.geometry.dispose()
      ;(built.trees.material as THREE.MeshStandardMaterial).map?.dispose()
      ;(built.trees.material as THREE.Material).dispose()
    }
  }, [gl])
  useEffect(() => () => cloudMap.dispose(), [cloudMap])
  useFrame((_, dt) => { if (clouds.current?.map) clouds.current.map.offset.x += dt * 0.0016 })
  return (
    <group>
      {land && (
        <>
          <mesh geometry={land.ground} material={land.soil} receiveShadow />
          <primitive object={land.trees} />
        </>
      )}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -30, 0]}>
        <circleGeometry args={[REACH, 48]} />
        <meshBasicMaterial ref={clouds} map={cloudMap} transparent opacity={0.95} depthWrite={false} />
      </mesh>
    </group>
  )
}
