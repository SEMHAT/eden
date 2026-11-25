"use client";
// Appareils 3D procéduraux partagés par la scène d'accueil et les fiches produits.
import { RoundedBox } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

export const GOLD = "#d9b36a";

export function useGold(rough = 0.22) {
  return useMemo(() => new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.9, roughness: rough + 0.1, emissive: "#3a2a0c", emissiveIntensity: 0.6 }), [rough]);
}

function useScreenMat() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 512;
    const g = c.getContext("2d")!;
    const grd = g.createLinearGradient(0, 0, 256, 512);
    grd.addColorStop(0, "#0d5a39");
    grd.addColorStop(0.6, "#063b25");
    grd.addColorStop(1, "#1a1208");
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 512);
    const wave = g.createLinearGradient(0, 300, 256, 512);
    wave.addColorStop(0, "#f3dca4");
    wave.addColorStop(1, "#b98c3e");
    g.fillStyle = wave;
    g.beginPath();
    g.moveTo(0, 420);
    g.bezierCurveTo(80, 320, 170, 470, 256, 330);
    g.lineTo(256, 512);
    g.lineTo(0, 512);
    g.fill();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({ map: tex, emissive: "#ffffff", emissiveMap: tex, emissiveIntensity: 0.35, roughness: 0.15, metalness: 0.1 });
  }, []);
}

const darkMetal = () => new THREE.MeshStandardMaterial({ color: "#1d1f1e", metalness: 0.85, roughness: 0.3 });

export function Phone() {
  const screen = useScreenMat();
  const body = useMemo(darkMetal, []);
  return (
    <group>
      <RoundedBox args={[0.6, 1.2, 0.07]} radius={0.07} smoothness={4} material={body} />
      <mesh position={[0, 0, 0.037]} material={screen}>
        <planeGeometry args={[0.54, 1.12]} />
      </mesh>
      {[[-0.14, 0.42], [-0.02, 0.42], [-0.14, 0.3]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, -0.045]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.03, 24]} />
          <meshStandardMaterial color="#0a0a0a" metalness={1} roughness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

export function Laptop() {
  const screen = useScreenMat();
  const body = useMemo(() => new THREE.MeshStandardMaterial({ color: "#b9bcbf", metalness: 0.9, roughness: 0.28 }), []);
  return (
    <group>
      <RoundedBox args={[1.5, 0.05, 1.0]} radius={0.025} smoothness={3} material={body} />
      <group position={[0, 0.02, -0.48]} rotation={[-0.25, 0, 0]}>
        <RoundedBox args={[1.5, 0.98, 0.035]} radius={0.03} smoothness={3} position={[0, 0.49, 0]} material={body} />
        <mesh position={[0, 0.5, 0.019]} material={screen}>
          <planeGeometry args={[1.38, 0.86]} />
        </mesh>
      </group>
      <mesh position={[0, 0.027, 0.08]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.25, 0.5]} />
        <meshStandardMaterial color="#2a2c2e" roughness={0.6} />
      </mesh>
    </group>
  );
}

export function Headphones() {
  const body = useMemo(darkMetal, []);
  const gold = useGold(0.25);
  return (
    <group>
      <mesh material={body}>
        <torusGeometry args={[0.5, 0.05, 16, 64, Math.PI]} />
      </mesh>
      <mesh material={gold}>
        <torusGeometry args={[0.47, 0.012, 8, 64, Math.PI]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.5, -0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh material={body}>
            <cylinderGeometry args={[0.22, 0.22, 0.16, 32]} />
          </mesh>
          <mesh material={gold} position={[0, s * 0.085, 0]}>
            <torusGeometry args={[0.16, 0.018, 8, 40]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Watch() {
  const screen = useScreenMat();
  const body = useMemo(darkMetal, []);
  const gold = useGold(0.2);
  return (
    <group>
      <RoundedBox args={[0.2, 0.9, 0.04]} radius={0.02} position={[0, 0, -0.04]} material={body} />
      <RoundedBox args={[0.46, 0.54, 0.13]} radius={0.1} smoothness={4} material={body} />
      <mesh position={[0, 0, 0.068]} material={screen}>
        <planeGeometry args={[0.36, 0.44]} />
      </mesh>
      <mesh position={[0.24, 0.06, 0]} rotation={[0, 0, Math.PI / 2]} material={gold}>
        <cylinderGeometry args={[0.04, 0.04, 0.05, 20]} />
      </mesh>
    </group>
  );
}

export function Controller() {
  const body = useMemo(() => new THREE.MeshStandardMaterial({ color: "#151716", metalness: 0.3, roughness: 0.45 }), []);
  const gold = useGold(0.25);
  return (
    <group>
      <RoundedBox args={[0.95, 0.42, 0.22]} radius={0.1} smoothness={4} material={body} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.36, -0.22, 0]} rotation={[0, 0, s * 0.35]} material={body}>
          <capsuleGeometry args={[0.13, 0.22, 8, 16]} />
        </mesh>
      ))}
      {[[0.3, 0.08], [0.38, 0], [0.22, 0], [0.3, -0.08]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.115]}>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshStandardMaterial color={i === 0 ? GOLD : i === 1 ? "#a80f1c" : i === 2 ? "#1d6b45" : "#888"} metalness={0.5} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[-0.3, 0.02, 0.115]} material={gold}>
        <boxGeometry args={[0.16, 0.05, 0.02]} />
      </mesh>
      <mesh position={[-0.3, 0.02, 0.115]} material={gold}>
        <boxGeometry args={[0.05, 0.16, 0.02]} />
      </mesh>
    </group>
  );
}

export function Earbuds() {
  const white = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#f4f2ee", roughness: 0.25, clearcoat: 1 }), []);
  return (
    <group>
      <RoundedBox args={[0.5, 0.4, 0.24]} radius={0.11} smoothness={5} material={white} />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.14, 0.38, 0]} rotation={[0, 0, s * -0.3]}>
          <mesh material={white}>
            <sphereGeometry args={[0.08, 24, 24]} />
          </mesh>
          <mesh material={white} position={[0, -0.12, 0]}>
            <capsuleGeometry args={[0.03, 0.14, 6, 12]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

