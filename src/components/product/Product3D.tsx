"use client";
import { OrbitControls, Float } from "@react-three/drei";
import { Studio } from "../three/Studio";
import { Phone, Laptop, Headphones, Watch, Controller, Earbuds, Speaker, Monitor, Printer } from "../three/models";

const MODELS: Record<string, () => React.ReactNode> = {
  phone: () => <Phone />,
  tablet: () => <group scale={[1.7, 1.15, 1]}><Phone /></group>,
  laptop: () => <Laptop />,
  headphones: () => <Headphones />,
  watch: () => <Watch />,
  controller: () => <Controller />,
  earbuds: () => <Earbuds open={{ current: 1 }} out={{ current: 0.5 }} />,
  speaker: () => <Speaker />,
  monitor: () => <group scale={0.55} position={[0, -0.6, 0]}><Monitor /></group>,
  printer: () => <group position={[0, -0.3, 0]}><Printer /></group>,
};

export const HAS_3D = Object.keys(MODELS);

export default function Product3D({ kind }: { kind: string }) {
  const Model = MODELS[kind];
  if (!Model) return null;
  return (
    <Studio bg="#f7f3eb" camera={{ position: [0, 0.5, 3.6], fov: 38 }} shadowY={-1.05}>
      <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.25}>
        <group scale={1.5}>
          <Model />
        </group>
      </Float>
      <OrbitControls enablePan={false} minDistance={2} maxDistance={6} autoRotate autoRotateSpeed={1} />
    </Studio>
  );
}
