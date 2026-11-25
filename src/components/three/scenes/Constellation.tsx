"use client";
// La sculpture EDEN entourée des cinq produits phares, utilisée par l'intro et le hero.
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { EdenSculpture, Laptop, Phone, Headphones, Watch, Earbuds, type Drive } from "../models";
import { seg } from "../materials";

type Item = { key: string; href: string; base: [number, number, number]; rot: [number, number, number]; scale: number; node: ReactNode; delay: number };

const half = { current: 0.72 } as Drive;
const on = { current: 1 } as Drive;
const budsOut = { current: 0.35 } as Drive;
const caseOpen = { current: 1 } as Drive;

export const ITEMS: Item[] = [
  { key: "laptop", href: "/boutique?categorie=ordinateurs", base: [2.35, -0.4, -1.1], rot: [0.28, -0.75, 0.04], scale: 1.05, delay: 0, node: <Laptop lid={half} screen={on} /> },
  { key: "phone", href: "/boutique?categorie=smartphones", base: [-2.05, 0.5, 0.2], rot: [0.06, 0.55, -0.22], scale: 1, delay: 0.12, node: <Phone screen={on} /> },
  { key: "headphones", href: "/boutique?categorie=casques", base: [1.6, 1.45, -0.7], rot: [0.25, -0.35, 0.18], scale: 0.85, delay: 0.24, node: <Headphones /> },
  { key: "watch", href: "/boutique?categorie=montres", base: [1.6, -1.25, 0.9], rot: [0.15, -0.5, -0.12], scale: 0.85, delay: 0.36, node: <Watch /> },
  { key: "earbuds", href: "/boutique?categorie=ecouteurs", base: [-1.75, -1.1, 0.8], rot: [0.35, 0.5, 0.05], scale: 0.9, delay: 0.48, node: <Earbuds open={caseOpen} out={budsOut} /> },
];

function Orbiter({ item, reveal, orbit, compact, interactive }: { item: Item; reveal: Drive; orbit: Drive; compact: boolean; interactive: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const router = useRouter();
  const phase = useRef(Math.random() * Math.PI * 2);
  useFrame((st, dt) => {
    const g = ref.current;
    if (!g) return;
    const t = st.clock.elapsedTime;
    const r = seg(reveal.current, item.delay, item.delay + 0.45);
    const [bx, by, bz] = item.base;
    const k = compact ? 0.62 : 1;
    // orbite : rotation de la position de base autour de l'axe vertical
    const ang = orbit.current * (Math.PI * 2) * 0.25 + Math.sin(t * 0.25 + phase.current) * 0.04;
    const x = bx * k * Math.cos(ang) - bz * Math.sin(ang);
    const z = bx * k * Math.sin(ang) + bz * Math.cos(ang);
    const float = Math.sin(t * 0.8 + phase.current) * 0.07;
    g.position.set(x * (0.4 + 0.6 * r), by * (compact ? 0.9 : 1) + float - (1 - r) * 0.6, z);
    const target = item.scale * (compact ? 0.72 : 1) * r * (hover ? 1.1 : 1);
    g.scale.lerp(new THREE.Vector3(target, target, target), Math.min(1, dt * 6));
    g.rotation.set(item.rot[0] + Math.sin(t * 0.5 + phase.current) * 0.05, item.rot[1] + Math.sin(t * 0.3 + phase.current) * 0.12 + (hover ? 0.35 : 0), item.rot[2]);
    g.visible = r > 0.01;
  });
  return (
    <group
      ref={ref}
      onPointerOver={interactive ? (e: ThreeEvent<PointerEvent>) => (e.stopPropagation(), setHover(true), (document.body.style.cursor = "pointer")) : undefined}
      onPointerOut={interactive ? () => (setHover(false), (document.body.style.cursor = "")) : undefined}
      onClick={interactive ? (e: ThreeEvent<MouseEvent>) => (e.stopPropagation(), (document.body.style.cursor = ""), router.push(item.href)) : undefined}
    >
      {item.node}
    </group>
  );
}

/** sculpt : apparition de la sculpture ; reveal : apparition des produits ; orbit : rotation d'ensemble ; parallax : suivi souris */
export function Constellation({ sculpt, reveal, orbit, interactive = false, parallax = true }: { sculpt: Drive; reveal: Drive; orbit: Drive; interactive?: boolean; parallax?: boolean }) {
  const root = useRef<THREE.Group>(null);
  const apple = useRef<THREE.Group>(null);
  const { size, pointer } = useThree();
  const compact = size.width < 720;
  useFrame((st, dt) => {
    const s = seg(sculpt.current, 0, 1);
    if (apple.current) {
      apple.current.scale.setScalar(0.001 + 0.999 * (1 - Math.pow(1 - s, 3)) * (compact ? 0.82 : 1));
      apple.current.rotation.y = Math.sin(st.clock.elapsedTime * 0.35) * 0.45 - (1 - s) * 1.2;
      apple.current.position.y = Math.sin(st.clock.elapsedTime * 0.6) * 0.05;
    }
    if (root.current && parallax) {
      root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, pointer.x * 0.18, Math.min(1, dt * 2.5));
      root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, -pointer.y * 0.08, Math.min(1, dt * 2.5));
    }
  });
  return (
    <group ref={root}>
      <group ref={apple}>
        <EdenSculpture />
      </group>
      {ITEMS.map((it) => (
        <Orbiter key={it.key} item={it} reveal={reveal} orbit={orbit} compact={compact} interactive={interactive} />
      ))}
    </group>
  );
}
