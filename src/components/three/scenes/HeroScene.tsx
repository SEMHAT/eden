"use client";
import { useFrame } from "@react-three/fiber";
import { useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { Studio } from "../Studio";
import { Constellation } from "./Constellation";

function Rig({ scroll }: { scroll: MutableRefObject<number> }) {
  const sculpt = useRef(0);
  const reveal = useRef(0);
  const orbit = useRef(0);
  useFrame((st, dt) => {
    sculpt.current = Math.min(1, sculpt.current + dt / 1.4);
    reveal.current = Math.min(1, reveal.current + dt / 2.6);
    orbit.current = THREE.MathUtils.lerp(orbit.current, scroll.current * 0.8, Math.min(1, dt * 3));
    const cam = st.camera;
    // au défilement : la caméra recule et descend légèrement, la scène s'ouvre
    cam.position.z = THREE.MathUtils.lerp(cam.position.z, 8.2 + scroll.current * 2.2, Math.min(1, dt * 3));
    cam.position.y = THREE.MathUtils.lerp(cam.position.y, 0.35 - scroll.current * 0.6, Math.min(1, dt * 3));
    cam.lookAt(0, 0.1 - scroll.current * 0.3, 0);
  });
  return <Constellation sculpt={sculpt} reveal={reveal} orbit={orbit} interactive />;
}

export default function HeroScene({ scroll, active }: { scroll: MutableRefObject<number>; active: boolean }) {
  return (
    <Studio active={active} camera={{ position: [0, 0.35, 8.2], fov: 34 }} shadowY={-1.75}>
      <Rig scroll={scroll} />
    </Studio>
  );
}
