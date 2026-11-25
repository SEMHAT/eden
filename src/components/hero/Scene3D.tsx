"use client";
// Scène 3D du hero : pomme EDEN et appareils procéduraux (aucun fichier 3D externe à télécharger).
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Float, Lightformer, ContactShadows } from "@react-three/drei";
import { useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { Phone, Laptop, Headphones, Watch, Controller, Earbuds, useGold } from "./devices3d";

const RED = "#b0101e";

/* ─────────── Pomme EDEN ─────────── */
function EdenApple() {
  const appleGeo = useMemo(() => {
    const pts = [
      [0.0, -0.9], [0.16, -1.0], [0.4, -1.02], [0.64, -0.9], [0.84, -0.66], [0.98, -0.32],
      [1.04, 0.05], [1.0, 0.4], [0.88, 0.7], [0.66, 0.9], [0.4, 0.94], [0.18, 0.84], [0.05, 0.74], [0.0, 0.72],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const curve = new THREE.SplineCurve(pts);
    const g = new THREE.LatheGeometry(curve.getPoints(80), 96);
    g.computeVertexNormals();
    return g;
  }, []);

  const triGeo = useMemo(() => {
    const s = new THREE.Shape();
    const r = 0.06;
    // triangle « lecture » aux coins arrondis
    s.moveTo(-0.28 + r, 0.34);
    s.lineTo(0.34 - r, 0.04);
    s.quadraticCurveTo(0.36, 0, 0.34 - r, -0.04);
    s.lineTo(-0.28 + r, -0.34);
    s.quadraticCurveTo(-0.3, -0.36, -0.3, -0.3);
    s.lineTo(-0.3, 0.3);
    s.quadraticCurveTo(-0.3, 0.36, -0.28 + r, 0.34);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 4, curveSegments: 16 });
    g.center();
    return g;
  }, []);

  const leafGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(0.25, 0.1, 0.55, 0.45, 0.62, 0.95);
    s.bezierCurveTo(0.2, 0.85, -0.05, 0.45, 0, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.01, bevelSegments: 2, curveSegments: 24 });
    return g;
  }, []);

  const gold = useGold(0.18);
  const red = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: RED, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.3, sheenColor: new THREE.Color("#ff6b6b") }),
    [],
  );
  const leaf = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#1d4a2a", roughness: 0.45, clearcoat: 0.6, side: THREE.DoubleSide }), []);

  return (
    <group>
      <mesh geometry={appleGeo} material={red} castShadow />
      <mesh geometry={triGeo} material={gold} position={[0.06, -0.08, 1.06]} scale={1.1} />
      {/* tige */}
      <mesh position={[-0.08, 0.98, 0.05]} rotation={[0.1, 0, 0.3]} material={gold}>
        <cylinderGeometry args={[0.035, 0.05, 0.5, 12]} />
      </mesh>
      <mesh geometry={leafGeo} material={leaf} position={[0.06, 0.82, 0.2]} rotation={[0.15, 0.1, -0.45]} scale={1.05} />
    </group>
  );
}

/* ─────────── Orbites dorées ─────────── */
function Orbits() {
  const ref = useRef<THREE.Group>(null);
  const sparks = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.15;
    if (sparks.current) sparks.current.rotation.y -= dt * 0.35;
  });
  const glow = useMemo(() => new THREE.MeshBasicMaterial({ color: "#f3d48a", transparent: true, opacity: 0.85 }), []);
  return (
    <group>
      <group ref={ref}>
        {[
          { r: 2.0, rot: [1.42, 0, 0.12] as const },
          { r: 2.35, rot: [1.5, 0, -0.08] as const },
        ].map((o, i) => (
          <mesh key={i} rotation={o.rot as unknown as THREE.Euler} material={glow}>
            <torusGeometry args={[o.r, 0.006 + i * 0.002, 8, 160]} />
          </mesh>
        ))}
      </group>
      <group ref={sparks} rotation={[0.3, 0, 0.1]}>
        {Array.from({ length: 7 }).map((_, i) => {
          const a = (i / 7) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 2.05, Math.sin(a * 2) * 0.15, Math.sin(a) * 2.05]} material={glow}>
              <sphereGeometry args={[0.035, 12, 12]} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function Pedestal() {
  const gold = useGold(0.3);
  return (
    <group position={[0, -1.35, 0]}>
      <mesh material={gold} position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[1.25, 1.35, 0.14, 96]} />
      </mesh>
      <mesh material={gold} position={[0, -0.16, 0]}>
        <cylinderGeometry args={[1.6, 1.7, 0.16, 96]} />
      </mesh>
      <mesh material={gold} position={[0, -0.34, 0]}>
        <cylinderGeometry args={[2.0, 2.1, 0.18, 96]} />
      </mesh>
    </group>
  );
}

type DeviceSpec = { key: string; href: string; label: string; pos: [number, number, number]; rot: [number, number, number]; scale: number; speed: number; node: ReactNode };

function Device({ d, compact }: { d: DeviceSpec; compact: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const router = useRouter();
  useFrame((_, dt) => {
    if (!ref.current) return;
    const target = (hover ? 1.15 : 1) * d.scale * (compact ? 0.78 : 1);
    ref.current.scale.lerp(new THREE.Vector3(target, target, target), Math.min(1, dt * 8));
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, d.rot[1] + (hover ? 0.4 : 0), Math.min(1, dt * 4));
  });
  const pos: [number, number, number] = compact ? [d.pos[0] * 0.62, d.pos[1] * 0.95 + 0.1, d.pos[2]] : d.pos;
  return (
    <Float speed={d.speed} rotationIntensity={0.35} floatIntensity={0.6} floatingRange={[-0.08, 0.08]}>
      <group
        ref={ref}
        position={pos}
        rotation={d.rot}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "";
        }}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          document.body.style.cursor = "";
          router.push(d.href);
        }}
      >
        {d.node}
      </group>
    </Float>
  );
}

const DEVICES: DeviceSpec[] = [
  { key: "phone", href: "/boutique?categorie=smartphones", label: "Smartphones", pos: [-2.55, 1.25, -0.3], rot: [0.1, 0.5, -0.35], scale: 1, speed: 1.6, node: <Phone /> },
  { key: "laptop", href: "/boutique?categorie=ordinateurs", label: "Ordinateurs", pos: [2.75, 0.85, -0.9], rot: [0.35, -0.6, 0.08], scale: 1, speed: 1.2, node: <Laptop /> },
  { key: "headphones", href: "/boutique?categorie=casques", label: "Casques", pos: [2.0, 2.0, -0.6], rot: [0.1, -0.5, 0.15], scale: 0.85, speed: 1.4, node: <Headphones /> },
  { key: "watch", href: "/boutique?categorie=montres", label: "Montres", pos: [2.45, -0.75, 0.3], rot: [0.1, -0.4, -0.2], scale: 0.85, speed: 1.9, node: <Watch /> },
  { key: "controller", href: "/boutique?categorie=gaming", label: "Gaming", pos: [-2.2, -0.75, 0.4], rot: [0.5, 0.45, 0.2], scale: 0.95, speed: 1.5, node: <Controller /> },
  { key: "earbuds", href: "/boutique?categorie=ecouteurs", label: "Écouteurs", pos: [-1.55, 2.25, -1.1], rot: [0.2, 0.4, 0.1], scale: 0.75, speed: 2.1, node: <Earbuds /> },
];

/* ─────────── Mise en scène ─────────── */
function Rig({ scroll, intro }: { scroll: MutableRefObject<number>; intro: MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const apple = useRef<THREE.Group>(null);
  const { size, pointer, camera } = useThree();
  const compact = size.width < 700;
  const devicesVisible = useRef(0);
  const devGroup = useRef<THREE.Group>(null);

  useFrame((state, dt) => {
    intro.current = Math.min(1, intro.current + dt / 1.6);
    const e = 1 - Math.pow(1 - intro.current, 3);
    const s = scroll.current;
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, pointer.x * 0.25 + s * 0.6, Math.min(1, dt * 3));
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -pointer.y * 0.12, Math.min(1, dt * 3));
      group.current.position.y = -s * 1.2;
      group.current.scale.setScalar((compact ? 0.95 : 0.82) * (0.6 + 0.4 * e));
    }
    // rotation lente qui ramène toujours le symbole doré face au visiteur
    if (apple.current) apple.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.45) * 0.7;
    devicesVisible.current = Math.min(1, Math.max(0, (state.clock.elapsedTime - 0.5) / 1.2));
    if (devGroup.current) {
      const v = 1 - Math.pow(1 - devicesVisible.current, 3);
      devGroup.current.scale.setScalar(0.4 + 0.6 * v);
      devGroup.current.visible = v > 0.01;
    }
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 8.6 + s * 2.2, Math.min(1, dt * 4));
  });

  return (
    <group ref={group}>
      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
        <group ref={apple} scale={[0.95, 1.05, 0.95]}>
          <EdenApple />
        </group>
      </Float>
      <Orbits />
      <Pedestal />
      <group ref={devGroup}>
        {DEVICES.map((d) => (
          <Device key={d.key} d={d} compact={compact} />
        ))}
      </group>
    </group>
  );
}

export default function Scene3D({ scroll, active }: { scroll: MutableRefObject<number>; active: boolean }) {
  const intro = useRef(0);
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.4, 8.6], fov: 38 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={active ? "always" : "never"}
      shadows={false}
      aria-hidden
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 5]} intensity={2.2} color="#fff3dc" />
      <pointLight position={[-4, 1, 3]} intensity={18} color="#d9b36a" />
      <pointLight position={[0, -1, 3]} intensity={6} color="#ffffff" />
      <Environment resolution={256}>
        <Lightformer intensity={2.2} position={[0, 3, 4]} scale={[8, 2, 1]} color="#fff6e5" />
        <Lightformer intensity={1.4} position={[-5, 0, -1]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} color="#d9b36a" />
        <Lightformer intensity={1} position={[5, 1, 0]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} color="#8fd1a8" />
        <Lightformer intensity={0.6} position={[0, -4, 0]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} color="#0b4d31" />
        <Lightformer intensity={1.6} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} color="#fff3d6" />
      </Environment>
      <Rig scroll={scroll} intro={intro} />
      <ContactShadows position={[0, -1.9, 0]} opacity={0.35} scale={9} blur={2.6} far={3} color="#000000" />
    </Canvas>
  );
}
