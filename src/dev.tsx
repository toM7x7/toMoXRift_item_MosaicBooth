import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { XRiftProvider } from '@xrift/world-components'
import { StrictMode, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { MathUtils } from 'three'
import type { Group } from 'three'
import { Item } from './Item'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

const viewMode = new URLSearchParams(window.location.search).get('view')
const showOccluder = new URLSearchParams(window.location.search).get('occluder') !== '0'
const cameraPosition: [number, number, number] =
  viewMode === 'side'
    ? [3.35, 1.32, 0.38]
    : viewMode === 'back'
      ? [-2.35, 1.36, -3.15]
      : [2.95, 1.42, 2.25]

createRoot(rootElement).render(
  <StrictMode>
    <XRiftProvider baseUrl="/" placementMode="placed">
      <div style={{ width: '100vw', height: '100vh', background: '#0e1820' }}>
        <Canvas shadows camera={{ position: cameraPosition, fov: 42 }}>
          <color attach="background" args={['#0e1820']} />
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[3.5, 6, 4.5]}
            intensity={1.7}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <pointLight position={[0.2, 1.7, 1.25]} color="#66e5ff" intensity={2.6} distance={4.2} />

          <InteriorCast />
          {showOccluder && <ForegroundPost />}
          <Item position={[0, 0, 0]} />

          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
            <planeGeometry args={[8, 8]} />
            <meshStandardMaterial color="#27323a" roughness={0.78} />
          </mesh>
          <gridHelper args={[8, 16, '#53606c', '#303a43']} position={[0, 0.004, 0]} />
          <OrbitControls target={[0, 0.95, 0]} />
        </Canvas>
      </div>
    </XRiftProvider>
  </StrictMode>,
)

function InteriorCast() {
  return (
    <group>
      <MysteryAvatar position={[-0.25, 0, 0.14]} color="#c6d2db" skin="#f3d7bd" phase={0} />
      <MysteryAvatar position={[0.3, 0, -0.18]} color="#8fb4ff" skin="#f6c49c" phase={1.3} />
      <InteriorProps />
    </group>
  )
}

function MysteryAvatar({
  position,
  color,
  skin,
  phase,
}: {
  position: [number, number, number]
  color: string
  skin: string
  phase: number
}) {
  const groupRef = useRef<Group>(null)

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime() + phase
    const group = groupRef.current
    if (!group) return

    group.position.x = position[0] + Math.sin(time * 0.55) * 0.1
    group.position.z = position[2] + Math.cos(time * 0.5) * 0.08
    group.rotation.y = Math.sin(time * 0.7) * 0.22
  })

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 0.82, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.68, 8, 20]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.04} />
      </mesh>
      <mesh position={[0, 1.32, 0]} castShadow>
        <sphereGeometry args={[0.17, 28, 18]} />
        <meshStandardMaterial color={skin} roughness={0.68} />
      </mesh>
      <mesh position={[0, 1.32, 0.2]} rotation={[MathUtils.degToRad(90), 0, 0]}>
        <coneGeometry args={[0.07, 0.24, 24]} />
        <meshBasicMaterial color="#64e9ff" transparent opacity={0.72} toneMapped={false} />
      </mesh>
    </group>
  )
}

function InteriorProps() {
  return (
    <group>
      <mesh position={[0.02, 0.5, 0.54]} rotation={[0, 0, MathUtils.degToRad(10)]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.14, 0.08]} />
        <meshStandardMaterial color="#18a66d" roughness={0.52} metalness={0.02} />
      </mesh>
      <mesh position={[-0.48, 0.94, -0.18]} rotation={[0, 0, MathUtils.degToRad(-28)]} castShadow receiveShadow>
        <boxGeometry args={[0.16, 0.95, 0.08]} />
        <meshStandardMaterial color="#d9445f" roughness={0.5} metalness={0.02} />
      </mesh>
      <mesh position={[0.48, 0.9, 0.18]} castShadow receiveShadow>
        <sphereGeometry args={[0.26, 32, 20]} />
        <meshStandardMaterial color="#2367ff" roughness={0.48} metalness={0.04} />
      </mesh>
    </group>
  )
}

function ForegroundPost() {
  return (
    <group position={[0.82, 0, 1.04]} rotation={[0, 0, MathUtils.degToRad(-7)]}>
      <mesh position={[0, 0.98, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.12, 1.85, 0.12]} />
        <meshStandardMaterial color="#ff8b2d" emissive="#3a1200" emissiveIntensity={0.18} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.38, 0.1, 0.38]} />
        <meshStandardMaterial color="#382018" roughness={0.62} />
      </mesh>
    </group>
  )
}
