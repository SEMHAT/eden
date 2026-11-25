"use client";
// Expérience E — professionnels : une mise en scène architecturale, lumineuse et ordonnée.
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, type MutableRefObject } from "react";
import { Studio } from "../Studio";
import { Desk, Monitor, Printer, Laptop } from "../models";
import { mats, seg } from "../materials";
import { cameraPath, type Key } from "../camera";

const KEYS: Key[] = [
  { p: 0, pos: [5.5, 5, 8.5], look: [0, 0.4, 0] },
  { p: 0.4, pos: [3.2, 2.4, 5.8], look: [0, 0.6, 0] },
  { p: 0.75, pos: [-0.4, 1.8, 5.6], look: [0, 0.7, -0.2] },
  { p: 1, pos: [0, 1.6, 7.2], look: [0, 0.5, 0] },
];

const one = { current: 1 };

function Rig({ progress }: { progress: MutableRefObject<number> }) {
  const screen = useRef(0);
  const lid = useRef(0);
  const { size } = useThree();
  const m = mats();
  useFrame((st) => {
    const p = progress.current;
    screen.current = seg(p, 0.3, 0.5);
    lid.current = seg(p, 0.45, 0.65);
    cameraPath(st.camera, KEYS, p, size.width < 720);
  });
  return (
    <group position={[0, -0.4, 0]}>
      {/* sol et colonnes de lumière */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.24, 0]} material={m.porcelainFloor}>
        <planeGeometry args={[30, 30]} />
      </mesh>
      {[-4, -2.6, 2.6, 4].map((x, i) => (
        <mesh key={i} position={[x, 4, -3.2]}>
          <boxGeometry args={[0.08, 14, 0.08]} />
          <meshStandardMaterial color="#ffffff" emissive="#fff6e4" emissiveIntensity={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 4, -3.4]}>
        <planeGeometry args={[60, 14]} />
        <meshStandardMaterial color="#efe9de" roughness={1} />
      </mesh>
      <Desk />
      <group position={[0, 0.04, -0.35]}>
        <Monitor screen={screen} />
      </group>
      <group position={[-1.3, 0.07, 0.25]} rotation={[0, 0.45, 0]} scale={0.7}>
        <Laptop lid={lid} screen={one} keys={false} />
      </group>
      <group position={[1.55, 0.04, 0.15]} rotation={[0, -0.35, 0]} scale={0.8}>
        <Printer />
      </group>
    </group>
  );
}

export default function OfficeScene({ progress, active, low, bg }: { progress: MutableRefObject<number>; active: boolean; low: boolean; bg?: string }) {
  return (
    <Studio bg={bg ?? "#fcfbf8"} active={active} camera={{ position: [5.5, 5, 8.5], fov: 30 }} shadowY={-1.63} shadows={!low} mood="office">
      <Rig progress={progress} />
    </Studio>
  );
}
