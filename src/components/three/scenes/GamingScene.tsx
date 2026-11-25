"use client";
// Expérience D — gaming : lumière plus riche, la manette révèle boutons, sticks et gâchettes.
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { Studio } from "../Studio";
import { Controller } from "../models";
import { mats, seg } from "../materials";
import { cameraPath, type Key } from "../camera";
import { RoundedBox } from "@react-three/drei";

const KEYS: Key[] = [
  { p: 0, pos: [0, 0.5, 4.6], look: [0, 0, 0] },
  { p: 0.3, pos: [0.5, 0.5, 3.6], look: [0.2, 0, 0] },
  { p: 0.5, pos: [-0.4, 0.4, 3.6], look: [-0.1, -0.1, 0] },
  { p: 0.68, pos: [0, 2.4, 3.2], look: [0, 0.1, 0] },
  { p: 1, pos: [0, 0.8, 5.6], look: [0, 0.2, -0.6] },
];

function Lights() {
  const a = useRef<THREE.PointLight>(null);
  const b = useRef<THREE.PointLight>(null);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    a.current?.position.set(Math.cos(t * 0.7) * 2.5, 1.2, Math.sin(t * 0.7) * 2.5);
    b.current?.position.set(Math.cos(t * 0.7 + Math.PI) * 2.5, 0.6, Math.sin(t * 0.7 + Math.PI) * 2.5);
  });
  return (
    <>
      <pointLight ref={a} intensity={14} distance={6} color="#d9575c" />
      <pointLight ref={b} intensity={14} distance={6} color="#7fa38a" />
    </>
  );
}

function Rig({ progress }: { progress: MutableRefObject<number> }) {
  const pulse = useRef(0);
  const sticks = useRef(0);
  const trigger = useRef(0);
  const g = useRef<THREE.Group>(null);
  const consoles = useRef<THREE.Group>(null);
  const { size } = useThree();
  const m = mats();
  useFrame((st) => {
    const p = progress.current;
    pulse.current = seg(p, 0.15, 0.45) * 4;
    sticks.current = seg(p, 0.35, 0.5) * (1 - seg(p, 0.6, 0.7));
    trigger.current = seg(p, 0.55, 0.62) * (1 - seg(p, 0.66, 0.72));
    if (g.current) {
      const enter = seg(p, 0, 0.15);
      g.current.position.y = -1.2 + enter * 1.2 + Math.sin(st.clock.elapsedTime * 1.1) * 0.04;
      g.current.rotation.set(0.35 - enter * 0.25 - seg(p, 0.52, 0.66) * 0.9 + seg(p, 0.72, 0.85) * 0.9, (1 - enter) * 1.6 + Math.sin(st.clock.elapsedTime * 0.5) * 0.08, 0);
    }
    if (consoles.current) {
      const c = seg(p, 0.72, 0.92);
      consoles.current.position.y = -2 + c * 2;
      consoles.current.visible = c > 0.01;
    }
    cameraPath(st.camera, KEYS, p, size.width < 720);
  });
  return (
    <>
      <Lights />
      <group ref={g}>
        <Controller pulse={pulse} sticks={sticks} trigger={trigger} />
      </group>
      <group ref={consoles} position={[0, -2, -1.6]}>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.75, 0.2, 0]} rotation={[0, -s * 0.25, 0]}>
            <RoundedBox args={[0.42, 1.5, 0.9]} radius={0.12} smoothness={4} material={m.ceramic} />
            <mesh position={[s * -0.22, 0, 0]} material={m.graphite}>
              <boxGeometry args={[0.03, 1.4, 0.8]} />
            </mesh>
          </group>
        ))}
      </group>
    </>
  );
}

export default function GamingScene({ progress, active, low, bg }: { progress: MutableRefObject<number>; active: boolean; low: boolean; bg?: string }) {
  return (
    <Studio bg={bg ?? "#eef1ea"} active={active} camera={{ position: [0, 0.5, 4.6], fov: 34 }} shadowY={-0.75} shadows={!low} mood="gaming">
      <Rig progress={progress} />
    </Studio>
  );
}
