"use client";
// Expérience A — l'ordinateur s'ouvre mécaniquement, l'écran s'allume, le clavier se révèle, le profil se dévoile.
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { Studio } from "../Studio";
import { Laptop } from "../models";
import { seg } from "../materials";
import { cameraPath, type Key } from "../camera";

const KEYS: Key[] = [
  { p: 0, pos: [0, 1.4, 5.8], look: [0, 0, 0] },
  { p: 0.14, pos: [0.4, 1.2, 4.9], look: [0, 0.05, 0] },
  { p: 0.38, pos: [0.6, 1.1, 4.2], look: [0, 0.35, 0] },
  { p: 0.52, pos: [0, 3.1, 2.4], look: [0, 0, 0.1] },
  { p: 0.7, pos: [0.2, 0.6, 5.3], look: [0, 0.3, 0] },
  { p: 0.86, pos: [0.15, 0.75, 3.4], look: [0, 0.45, -0.2] },
  { p: 1, pos: [0, 0.6, 1.5], look: [0, 0.55, -0.45] },
];

function Rig({ progress }: { progress: MutableRefObject<number> }) {
  const lid = useRef(0);
  const screen = useRef(0);
  const g = useRef<THREE.Group>(null);
  const { size } = useThree();
  useFrame((st) => {
    const p = progress.current;
    lid.current = seg(p, 0.12, 0.38);
    screen.current = seg(p, 0.28, 0.42);
    if (g.current) {
      const enter = seg(p, 0, 0.12);
      // lacet : 3/4 → face → profil → 3/4
      const yaw = -0.9 + enter * 0.35 + seg(p, 0.38, 0.52) * 0.55 - seg(p, 0.55, 0.7) * 1.75 + seg(p, 0.72, 0.86) * 1.75;
      g.current.rotation.set(0, yaw, 0);
      g.current.position.y = -0.5 + enter * 0.5 + Math.sin(st.clock.elapsedTime * 0.8) * 0.03;
    }
    cameraPath(st.camera, KEYS, p, size.width < 720);
  });
  return (
    <group ref={g}>
      <Laptop lid={lid} screen={screen} />
    </group>
  );
}

export default function LaptopScene({ progress, active, low, bg }: { progress: MutableRefObject<number>; active: boolean; low: boolean; bg?: string }) {
  return (
    <Studio bg={bg ?? "#f5f0e7"} active={active} camera={{ position: [0, 1.4, 5.8], fov: 32 }} shadowY={-0.6} shadows={!low} mood="ivory">
      <Rig progress={progress} />
    </Studio>
  );
}
