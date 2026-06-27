import { useFBO } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import {
  DoubleSide,
  LinearFilter,
  MathUtils,
  MeshStandardMaterial,
  Vector2,
} from 'three'
import type { Group, ShaderMaterial } from 'three'

export interface ItemProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}

const BOOTH_RADIUS = 0.92
const BOOTH_HEIGHT = 1.72
const BOOTH_BOTTOM = 0.08
const BOOTH_Y = BOOTH_BOTTOM + BOOTH_HEIGHT / 2
const OPENING_ARC = MathUtils.degToRad(54)
const SHELL_ARC = Math.PI * 2 - OPENING_ARC
const SHELL_START = OPENING_ARC / 2
const PIXEL_COUNT = 18

const railMaterial = new MeshStandardMaterial({
  color: '#c4f5ff',
  roughness: 0.42,
  metalness: 0.18,
})

const postMaterial = new MeshStandardMaterial({
  color: '#102028',
  roughness: 0.68,
  metalness: 0.12,
})

export function Item({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: ItemProps) {
  const boothRef = useRef<Group>(null)

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group ref={boothRef} name="mosaic-filter-booth">
        <mesh position={[0, BOOTH_Y, 0]} castShadow receiveShadow>
          <cylinderGeometry
            args={[
              BOOTH_RADIUS,
              BOOTH_RADIUS,
              BOOTH_HEIGHT,
              96,
              1,
              true,
              SHELL_START,
              SHELL_ARC,
            ]}
          />
          <MosaicFilterMaterial captureRootRef={boothRef} />
        </mesh>

        <BoothRail y={BOOTH_BOTTOM} />
        <BoothRail y={BOOTH_BOTTOM + BOOTH_HEIGHT} />
        <BoothPost angle={SHELL_START} />
        <BoothPost angle={SHELL_START + SHELL_ARC} />
        <BoothPost angle={SHELL_START + SHELL_ARC * 0.25} />
        <BoothPost angle={SHELL_START + SHELL_ARC * 0.5} />
        <BoothPost angle={SHELL_START + SHELL_ARC * 0.75} />

        <mesh position={[0, 0.026, 0]} receiveShadow>
          <cylinderGeometry args={[BOOTH_RADIUS + 0.08, BOOTH_RADIUS + 0.08, 0.052, 96]} />
          <meshStandardMaterial color="#081219" roughness={0.7} metalness={0.08} />
        </mesh>
      </group>
    </group>
  )
}

function BoothRail({ y }: { y: number }) {
  return (
    <mesh position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <torusGeometry args={[BOOTH_RADIUS, 0.028, 8, 96, SHELL_ARC]} />
      <primitive object={railMaterial} attach="material" />
    </mesh>
  )
}

function BoothPost({ angle }: { angle: number }) {
  const x = Math.cos(angle) * BOOTH_RADIUS
  const z = -Math.sin(angle) * BOOTH_RADIUS

  return (
    <mesh position={[x, BOOTH_Y, z]} castShadow receiveShadow>
      <boxGeometry args={[0.06, BOOTH_HEIGHT + 0.12, 0.06]} />
      <primitive object={postMaterial} attach="material" />
    </mesh>
  )
}

function MosaicFilterMaterial({ captureRootRef }: { captureRootRef: RefObject<Group | null> }) {
  const { gl, scene, camera, size } = useThree()
  const materialRef = useRef<ShaderMaterial>(null)
  const resolution = useMemo(() => new Vector2(size.width, size.height), [size.height, size.width])
  const sceneTarget = useFBO(
    Math.max(320, Math.floor(size.width * 0.75)),
    Math.max(220, Math.floor(size.height * 0.75)),
    {
      depthBuffer: true,
      stencilBuffer: false,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
    },
  )
  const uniforms = useMemo(
    () => ({
      uPixelCount: { value: PIXEL_COUNT },
      uResolution: { value: resolution },
      uSceneTexture: { value: sceneTarget.texture },
    }),
    [resolution, sceneTarget.texture],
  )

  useFrame(() => {
    const material = materialRef.current
    if (!material) return

    const captureRoot = captureRootRef.current
    const wasVisible = captureRoot?.visible ?? true
    const previousTarget = gl.getRenderTarget()
    const previousAutoClear = gl.autoClear

    try {
      if (captureRoot) captureRoot.visible = false
      gl.autoClear = true
      gl.setRenderTarget(sceneTarget)
      gl.clear()
      gl.render(scene, camera)
    } finally {
      gl.setRenderTarget(previousTarget)
      gl.autoClear = previousAutoClear
      if (captureRoot) captureRoot.visible = wasVisible
    }

    material.uniforms.uPixelCount.value = PIXEL_COUNT
    material.uniforms.uResolution.value.set(size.width, size.height)
    material.uniforms.uSceneTexture.value = sceneTarget.texture
  })

  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={uniforms}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      transparent={false}
      depthWrite
      depthTest
      side={DoubleSide}
      toneMapped={false}
    />
  )
}

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
precision highp float;

uniform float uPixelCount;
uniform vec2 uResolution;
uniform sampler2D uSceneTexture;

varying vec2 vUv;

void main() {
  vec2 screenUv = gl_FragCoord.xy / uResolution;
  vec2 screenCells = vec2(uPixelCount * (uResolution.x / max(uResolution.y, 1.0)), uPixelCount);
  vec2 grid = floor(screenUv * screenCells);
  vec2 blockUv = (grid + 0.5) / screenCells;
  vec2 cellUv = fract(screenUv * screenCells);
  vec3 sceneColor = texture2D(uSceneTexture, clamp(blockUv, vec2(0.001), vec2(0.999))).rgb;
  float luma = dot(sceneColor, vec3(0.299, 0.587, 0.114));
  vec3 liftedScene = pow(sceneColor, vec3(0.82));
  vec3 posterized = floor(liftedScene * 7.0) / 7.0;
  vec3 color = mix(posterized, vec3(luma), 0.1);
  float cellEdge = step(0.045, cellUv.x) * step(0.045, cellUv.y) *
    step(cellUv.x, 0.955) * step(cellUv.y, 0.955);
  color *= mix(0.84, 1.0, cellEdge);
  color = mix(color, vec3(0.72, 0.92, 1.0), 0.025);

  gl_FragColor = vec4(color, 1.0);
}
`
