"use client";
// Expérience C — chorégraphie audio : les écouteurs sortent du boîtier, le casque se dévoile, la montre se décompose, puis tout se compose.
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useRef, type MutableRefObject, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { Studio } from "../Studio";
import { Earbuds, Headphones, Watch, Speaker } from "../models";
import { seg } from "../materials";
import { cameraPath, type Key } from "../camera";

const KEYS: Key[] = [
  { p: 0, pos: [-0.6, 0.9, 4.6], look: [-0.6, 0, 0] },
  { p: 0.35, pos: [-0.4, 0.9, 4.8], look: [-0.2, 0.25, 0] },
  { p: 0.55, pos: [0.6, 0.7, 5.2], look: [0.6, 0.2, -0.3] },
  { p: 0.75, pos: [0, 0.5, 5.4], look: [0, 0, 0.1] },
  { p: 1, pos: [0, 0.7, 6.6], look: [0, -0.05, 0] },
];

const L = THREE.MathUtils.lerp;

function Clickable({ href, children, gref }: { href: string; children: ReactNode; gref: React.RefObject<THREE.Group | null> }) {
  const router = useRouter();
  return (
    <group
      ref={gref}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => (e.stopPropagation(), (document.body.style.cursor = "pointer"))}
      onPointerOut={() => (document.body.style.cursor = "")}
      onClick={(e: ThreeEvent<MouseEvent>) => (e.stopPropagation(), (document.body.style.cursor = ""), router.push(href))}
    >
      {children}
    </group>
  );
}

function Rig({ progress }: { progress: MutableRefObject<number> }) {
  const open = useRef(0);
  const out = useRef(0);
  const fold = useRef(0);
  const split = useRef(0);
  const buds = useRef<THREE.Group>(null);
  const phones = useRef<THREE.Group>(null);
  const watch = useRef<THREE.Group>(null);
  const speaker = useRef<THREE.Group>(null);
  const { size } = useThree();
  useFrame((st) => {
    const p = progress.current;
    const t = st.clock.elapsedTime;
    open.current = seg(p, 0.08, 0.24);
    out.current = seg(p, 0.2, 0.38) * (1 - seg(p, 0.86, 1) * 0.6);
    split.current = seg(p, 0.6, 0.68) * (1 - seg(p, 0.72, 0.8));
    fold.current = seg(p, 0.42, 0.52) * (1 - seg(p, 0.56, 0.62));
    const comp = seg(p, 0.82, 1); // composition finale
    const float = (o: number) => Math.sin(t * 0.8 + o) * 0.04;
    if (buds.current) {
      const s = seg(p, 0, 0.08);
      buds.current.scale.setScalar(0.001 + s * 0.9);
      buds.current.position.set(L(-0.9, -1.75, comp), L(-0.2, -0.4, comp) + float(0), L(0, 0.2, comp));
      buds.current.rotation.set(0.25, L(0.3, 0.4, comp), 0);
    }
    if (phones.current) {
      const s = seg(p, 0.36, 0.44);
      phones.current.scale.setScalar(0.001 + s * 0.8);
      phones.current.position.set(L(1.35, 0.05, comp), L(0.35, 0.8, comp) + float(1), L(-0.7, -0.9, comp));
      phones.current.rotation.set(0.15, seg(p, 0.4, 0.6) * Math.PI * 2 - 0.4, 0.05);
    }
    if (watch.current) {
      const s = seg(p, 0.55, 0.62);
      watch.current.scale.setScalar(0.001 + s * 0.75);
      watch.current.position.set(L(0.25, 1.7, comp), L(-0.05, -0.15, comp) + float(2), L(0.9, 0.35, comp));
      watch.current.rotation.set(0.1, L(0.5 - seg(p, 0.6, 0.7) * 0.9, -0.45, comp), 0);
    }
    if (speaker.current) {
      const s = seg(p, 0.76, 0.86);
      speaker.current.scale.setScalar(0.001 + s * 0.65);
      speaker.current.position.set(L(2.6, 0.15, s), -1.1 + float(3), L(0, 1.0, s));
      speaker.current.rotation.set(0, -0.2, 0);
    }
    cameraPath(st.camera, KEYS, p, size.width < 720);
  });
  return (
    <>
      <Clickable href="/boutique?categorie=ecouteurs" gref={buds}>
        <Earbuds open={open} out={out} />
      </Clickable>
      <Clickable href="/boutique?categorie=casques" gref={phones}>
        <Headphones fold={fold} />
      </Clickable>
      <Clickable href="/boutique?categorie=montres" gref={watch}>
        <Watch split={split} />
      </Clickable>
      <Clickable href="/boutique?categorie=enceintes" gref={speaker}>
        <Speaker />
      </Clickable>
    </>
  );
}

export default function AudioScene({ progress, active, low, bg }: { progress: MutableRefObject<number>; active: boolean; low: boolean; bg?: string }) {
  return (
    <Studio bg={bg ?? "#f5f0e7"} active={active} camera={{ position: [-0.9, 0.9, 4.2], fov: 32 }} shadowY={-1.45} shadows={!low} mood="ivory">
      <Rig progress={progress} />
    </Studio>
  );
}
