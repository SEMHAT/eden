"use client";
// Studio lumineux partagé : environnement d'éclairage doux, ombres de contact, qualité adaptée à l'appareil.
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { useMemo, useState, type ReactNode } from "react";
import * as THREE from "three";

export type Mood = "ivory" | "warm" | "gaming" | "office";

const MOODS: Record<Mood, { key: string; fill: string; rim: string; ambient: number }> = {
  ivory: { key: "#fff8ec", fill: "#e9efe6", rim: "#f1dcb3", ambient: 0.55 },
  warm: { key: "#fff3df", fill: "#efe6d6", rim: "#d9bf8f", ambient: 0.5 },
  gaming: { key: "#fff1e6", fill: "#c9d8c6", rim: "#e2a7a0", ambient: 0.4 },
  office: { key: "#fbf8f2", fill: "#e3e8e2", rim: "#e8d8bb", ambient: 0.6 },
};

export function Studio({
  children,
  active = true,
  camera = { position: [0, 0.4, 6] as [number, number, number], fov: 32 },
  mood = "ivory",
  shadowY = -1.4,
  shadows = true,
  bg = "#f5f0e7",
}: {
  children: ReactNode;
  active?: boolean;
  camera?: { position: [number, number, number]; fov: number };
  mood?: Mood;
  shadowY?: number;
  shadows?: boolean;
  bg?: string;
}) {
  const [dpr, setDpr] = useState(1.5);
  const m = MOODS[mood];
  return (
    <Canvas
      dpr={dpr}
      camera={camera}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      aria-hidden
    >
      <color attach="background" args={[bg]} />
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(Math.min(2, window.devicePixelRatio || 1.5))} />
      <ambientLight intensity={m.ambient} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} color={m.key} />
      <directionalLight position={[-4, 2, -3]} intensity={0.6} color={m.rim} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 4, 3]} scale={[10, 3, 1]} color={m.key} />
        <Lightformer form="rect" intensity={1.2} position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} color={m.fill} />
        <Lightformer form="rect" intensity={1.4} position={[5, 1.5, -1]} rotation-y={-Math.PI / 2} scale={[8, 4, 1]} color={m.rim} />
        <Lightformer form="rect" intensity={0.9} position={[0, -3, 0]} rotation-x={-Math.PI / 2} scale={[12, 12, 1]} color="#f5f0e7" />
        <Lightformer form="ring" intensity={2} position={[2, 3, 5]} scale={1.5} color="#ffffff" />
        {/* grande source douce face aux objets : reflets dorés et chromés lisibles de face */}
        <Lightformer form="rect" intensity={1.6} position={[0, 0.5, 9]} scale={[14, 7, 1]} color="#fff4e2" />
      </Environment>
      {children}
      {shadows && <SoftShadow y={shadowY} />}
    </Canvas>
  );
}

/** Ombre portée douce : un dégradé radial sous la scène, net sur fond clair et très léger à calculer. */
function SoftShadow({ y, w = 5, d = 2.4 }: { y: number; w?: number; d?: number }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, "rgba(74,63,48,0.22)");
    grd.addColorStop(0.4, "rgba(74,63,48,0.08)");
    grd.addColorStop(1, "rgba(74,63,48,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} renderOrder={-1}>
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
