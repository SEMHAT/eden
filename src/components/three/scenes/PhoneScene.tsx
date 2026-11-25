"use client";
// Expérience B — le smartphone entre, s'allume, présente son module photo, se décompose avec retenue, puis l'écran devient un portail.
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { Studio } from "../Studio";
import { Phone } from "../models";
import { seg } from "../materials";
import { cameraPath, type Key } from "../camera";

const KEYS: Key[] = [
  { p: 0, pos: [0, 0.3, 5.2], look: [0, 0, 0] },
  { p: 0.25, pos: [0, 0.2, 4.4], look: [0, 0.05, 0] },
  { p: 0.42, pos: [-0.5, 0.5, 3.8], look: [-0.1, 0.25, 0] },
  { p: 0.65, pos: [-0.4, 1.0, 5.4], look: [-0.2, 0.1, 0] },
  { p: 0.8, pos: [0, 0.2, 4.2], look: [0, 0, 0] },
  { p: 1, pos: [0, 0.05, 1.3], look: [0, 0, 0] },
];

function Rig({ progress }: { progress: MutableRefObject<number> }) {
  const explode = useRef(0);
  const screen = useRef(0);
  const highlight = useRef(0);
  const g = useRef<THREE.Group>(null);
  const { size } = useThree();
  useFrame((st) => {
    const p = progress.current;
    screen.current = seg(p, 0.12, 0.25);
    highlight.current = seg(p, 0.3, 0.4) * (1 - seg(p, 0.5, 0.58));
    explode.current = seg(p, 0.45, 0.62) * (1 - seg(p, 0.66, 0.8));
    if (g.current) {
      const enter = seg(p, 0, 0.15);
      const toBack = seg(p, 0.25, 0.42);
      const angled = seg(p, 0.45, 0.6);
      const toFront = seg(p, 0.72, 0.86);
      g.current.position.x = (1 - enter) * 2.6;
      g.current.rotation.y = -1.3 + enter * 1.55 + toBack * (Math.PI - 0.25) - angled * 1.15 - toFront * (Math.PI - 1.4);
      g.current.rotation.x = angled * 0.12 - toFront * 0.12;
      g.current.rotation.z = (1 - enter) * -0.3;
      g.current.position.y = Math.sin(st.clock.elapsedTime * 0.9) * 0.03;
    }
    cameraPath(st.camera, KEYS, p, size.width < 720);
  });
  return (
    <group ref={g}>
      <Phone explode={explode} screen={screen} highlight={highlight} color="champagneMetal" />
    </group>
  );
}

export default function PhoneScene({ progress, active, low, bg }: { progress: MutableRefObject<number>; active: boolean; low: boolean; bg?: string }) {
  return (
    <Studio bg={bg ?? "#fcfbf8"} active={active} camera={{ position: [0, 0.3, 5.2], fov: 32 }} shadowY={-0.95} shadows={!low} mood="warm">
      <Rig progress={progress} />
    </Studio>
  );
}
