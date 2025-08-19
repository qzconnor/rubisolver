<script setup lang="ts">
import * as THREE from 'three'
import { onMounted, ref } from 'vue'
import { useRenderLoop } from '@tresjs/core'
import { useTresContext } from '@tresjs/core'

export interface RubikAPI {
  rotate: (face: 'U'|'D'|'L'|'R'|'F'|'B', dir: 1|-1, duration?: number) => Promise<boolean>
  scramble: (moves?: number, minDelayMs?: number) => Promise<void>
  isBusy: () => boolean
}
const exposeApi: RubikAPI = { rotate: async () => false, scramble: async () => {}, isBusy: () => false }
defineExpose(exposeApi)

const root = ref<THREE.Group | null>(null)
const { invalidate } = useTresContext() // needed because parent canvas is manual

function createRubiksCube() {
  const GAP = 0.02
  const CUBIE = 1 - GAP
  const SPACING = 1.0

  const COLORS = {
    U: 0xffffff, D: 0xffd500, F: 0xc41e3a, B: 0xff5800, R: 0x009e60, L: 0x0051ba, BLANK: 0x141414
  }

  const group = new THREE.Group()
  group.name = 'RubiksCube'

  const boxGeo = new THREE.BoxGeometry(CUBIE, CUBIE, CUBIE)
  const mkMats = (ix:number, iy:number, iz:number) => {
    const m = (cond:boolean, color:number) =>
      new THREE.MeshStandardMaterial({ color: cond ? color : COLORS.BLANK, metalness: 0.1, roughness: 0.6 })
    // +X, -X, +Y, -Y, +Z, -Z
    return [ m(ix===+1, COLORS.R), m(ix===-1, COLORS.L),
             m(iy===+1, COLORS.U), m(iy===-1, COLORS.D),
             m(iz===+1, COLORS.F), m(iz===-1, COLORS.B) ]
  }

  for (let ix=-1; ix<=1; ix++) for (let iy=-1; iy<=1; iy++) for (let iz=-1; iz<=1; iz++) {
    const cube = new THREE.Mesh(boxGeo, mkMats(ix,iy,iz))
    cube.position.set(ix*SPACING, iy*SPACING, iz*SPACING)
    cube.castShadow = true; cube.receiveShadow = true
    ;(cube as any).userData.index = { x: ix, y: iy, z: iz }
    group.add(cube)
  }

  let isRotating = false

  const axisFor = (face:string) =>
    face === 'U' || face === 'D' ? new THREE.Vector3(0,1,0) :
    face === 'R' || face === 'L' ? new THREE.Vector3(1,0,0) :
                                   new THREE.Vector3(0,0,1)

  const layerCoord = (face:string) => (
    face === 'U' ? { axis:'y', value:+1 } :
    face === 'D' ? { axis:'y', value:-1 } :
    face === 'R' ? { axis:'x', value:+1 } :
    face === 'L' ? { axis:'x', value:-1 } :
    face === 'F' ? { axis:'z', value:+1 } :
                   { axis:'z', value:-1 }
  )

  const angleFor = (face:string, dir:1|-1) => {
    const base = Math.PI/2
    const sign = (face === 'U' || face === 'R' || face === 'F') ? -1 : +1
    return sign * dir * base
  }

  const selectLayer = (face:string) => {
    const { axis, value } = layerCoord(face)
    return group.children.filter((c:any) => Math.round(c.userData.index[axis]) === value) as THREE.Object3D[]
  }

  const centerFor = (face:string) => {
    const { axis, value } = layerCoord(face)
    const v = new THREE.Vector3(0,0,0) as any
    v[axis] = value * SPACING
    return v as THREE.Vector3
  }

  const rotateIndex = (idx:{x:number;y:number;z:number}, face:string, dir:1|-1) => {
    const s = (face==='U'||face==='R'||face==='F') ? dir : -dir
    let {x,y,z} = idx
    if (face==='U'||face==='D'){
      if (s===1){ const nx=z; const nz=-x; x=nx; z=nz } else { const nx=-z; const nz=x; x=nx; z=nz }
    } else if (face==='R'||face==='L'){
      if (s===1){ const ny=-z; const nz=y; y=ny; z=nz } else { const ny=z; const nz=-y; y=ny; z=nz }
    } else {
      if (s===1){ const nx=-y; const ny=x; x=nx; y=ny } else { const nx=y; const ny=-x; x=nx; y=ny }
    }
    return {x,y,z}
  }

  async function rotate(face:'U'|'D'|'L'|'R'|'F'|'B', dir:1|-1, duration=250): Promise<boolean> {
    if (isRotating) return false
    isRotating = true

    const angle = angleFor(face, dir)
    const axis = axisFor(face).normalize()
    const layer = selectLayer(face)
    const pivot = new THREE.Group()
    pivot.position.copy(centerFor(face))
    group.add(pivot)
    layer.forEach((c)=> pivot.attach(c))

    const start = performance.now()
    const step = (now:number, prev=0):Promise<void> => new Promise(res => {
      const t = Math.min(1, (now - start) / duration)
      const target = angle * t
      const delta = target - prev
      pivot.rotateOnAxis(axis, delta)
      invalidate() // tell parent <TresCanvas render-mode="manual"> to render this frame
      if (t < 1) requestAnimationFrame((n)=>step(n, target).then(res))
      else res()
    })

    await new Promise<void>(r => requestAnimationFrame((n)=>step(n, 0).then(r)))

    layer.forEach((c:any) => {
      group.attach(c)
      c.userData.index = rotateIndex(c.userData.index, face, dir)
      const idx = c.userData.index
      c.position.set(idx.x*SPACING, idx.y*SPACING, idx.z*SPACING)
      const snap90 = (r:number) => Math.round(r/(Math.PI/2))*(Math.PI/2)
      c.rotation.x = snap90(c.rotation.x)
      c.rotation.y = snap90(c.rotation.y)
      c.rotation.z = snap90(c.rotation.z)
    })
    group.remove(pivot)
    invalidate() // final frame
    isRotating = false
    return true
  }

  async function scramble(moves=25, minDelayMs=40) {
    if (isRotating) return
    const faces: Array<'U'|'D'|'L'|'R'|'F'|'B'> = ['U','D','L','R','F','B']
    for (let i=0; i<moves; i++){
      const f = faces[Math.floor(Math.random()*faces.length)]
      const d = Math.random()<0.5 ? 1 : -1
      await rotate(f, d as 1|-1, 150)
      await new Promise(r => setTimeout(r, minDelayMs))
    }
  }

  return { group, rotate, scramble, isBusy: () => isRotating }
}

onMounted(() => {
  const g = root.value!
  const { group, rotate, scramble, isBusy } = createRubiksCube()
  g.add(group)

  // Lights & ground (use parent's renderer/camera)
  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  const dir = new THREE.DirectionalLight(0xffffff, 1)
  dir.position.set(6,10,4)
  dir.castShadow = true
  g.add(ambient, dir)

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(40,40),
    new THREE.MeshStandardMaterial({ color: 0xE7ECF5, roughness: 1, metalness: 0 })
  )
  ground.rotation.x = -Math.PI/2
  ground.position.y = -2
  ground.receiveShadow = true
  g.add(ground)

  // expose API to parent
  exposeApi.rotate = rotate
  exposeApi.scramble = scramble
  exposeApi.isBusy = isBusy

  // first paint (manual mode needs one)
  invalidate()
})
</script>

<template>
  <!-- attaches to the parent's TresCanvas -->
  <TresGroup ref="root" />
</template>
