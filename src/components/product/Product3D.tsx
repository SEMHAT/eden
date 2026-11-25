"use client";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, Float, ContactShadows } from "@react-three/drei";
import { Phone, Laptop, Headphones, Watch, Controller, Earbuds } from "../hero/devices3d";

const MODELS: Record<string, () => React.ReactNode> = {
  phone: () => <Phone />,
  tablet: () => <group scale={[1.6, 1.1, 1]}><Phone /></group>,
  laptop: () => <Laptop />,
  headphones: () => <Headphones />,
  watch: () => <Watch />,
  controller: () => <Controller />,
  earbuds: () => <Earbuds />,
};

export const HAS_3D = Object.keys(MODELS);

export default function Product3D({ kind }: { kind: string }) {
  const Model = MODELS[kind];
  if (!Model) return null;
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0.4, 3.2], fov: 40 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 4]} intensity={2} />
      <Environment resolution={128}>
        <Lightformer intensity={2} position={[0, 3, 3]} scale={[6, 2, 1]} color="#fff6e5" />
        <Lightformer intensity={1.2} position={[-4, 0, 0]} rotation-y={Math.PI / 2} scale={[5, 3, 1]} color="#d9b36a" />
        <Lightformer intensity={0.8} position={[4, 0, 0]} rotation-y={-Math.PI / 2} scale={[5, 3, 1]} color="#ffffff" />
      </Environment>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <group scale={1.6}>
          <Model />
        </group>
      </Float>
      <ContactShadows position={[0, -1.1, 0]} opacity={0.3} scale={6} blur={2.4} />
      <OrbitControls enablePan={false} minDistance={2} maxDistance={6} autoRotate autoRotateSpeed={1.2} />
    </Canvas>
  );
}
