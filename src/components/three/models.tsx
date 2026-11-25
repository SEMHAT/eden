"use client";
// Modèles 3D EDEN, construits en code (aucun fichier externe, aucune licence tierce).
// Chaque modèle expose des « commandes » (refs numériques 0→1) que les scènes pilotent au défilement.
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { mats, makeScreen, setScreen } from "./materials";

export type Drive = MutableRefObject<number>;
const zero = { current: 0 } as Drive;
const one = { current: 1 } as Drive;

/* ───────────────────────── Sculpture EDEN ───────────────────────── */
export function EdenSculpture({ bite = true }: { bite?: boolean }) {
  const appleGeo = useMemo(() => {
    const pts = [
      [0.0, -0.9], [0.16, -1.0], [0.4, -1.02], [0.64, -0.9], [0.84, -0.66], [0.98, -0.32],
      [1.04, 0.05], [1.0, 0.4], [0.88, 0.7], [0.66, 0.9], [0.4, 0.94], [0.18, 0.84], [0.05, 0.74], [0.0, 0.72],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const g = new THREE.LatheGeometry(new THREE.SplineCurve(pts).getPoints(140), 180);
    // morsure : on projette les sommets situés dans une sphère sur sa surface (creux concave)
    const pos = g.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const red = new THREE.Color("#a5141f");
    const cream = new THREE.Color("#f1e4c6");
    const gold = new THREE.Color("#c6a36a");
    const c = new THREE.Vector3(1.02, 0.1, 0.42);
    const r = 0.5;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const d = v.distanceTo(c);
      let col = red;
      if (bite && d < r) {
        v.sub(c).normalize().multiplyScalar(r).add(c);
        pos.setXYZ(i, v.x, v.y, v.z);
        col = d > r * 0.93 ? gold : cream;
      } else if (bite && d < r * 1.05) col = gold;
      colors.set([col.r, col.g, col.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [bite]);

  const appleMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.15, sheenColor: new THREE.Color("#ff8a8a") }),
    [],
  );
  const leafMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#2f5a3a", roughness: 0.4, clearcoat: 0.7, clearcoatRoughness: 0.2, side: THREE.DoubleSide }), []);

  const triGeo = useMemo(() => {
    const s = new THREE.Shape();
    const k = 0.07;
    s.moveTo(-0.28 + k, 0.34);
    s.lineTo(0.34 - k, 0.04);
    s.quadraticCurveTo(0.37, 0, 0.34 - k, -0.04);
    s.lineTo(-0.28 + k, -0.34);
    s.quadraticCurveTo(-0.3, -0.37, -0.3, -0.3);
    s.lineTo(-0.3, 0.3);
    s.quadraticCurveTo(-0.3, 0.37, -0.28 + k, 0.34);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 6, curveSegments: 20 });
    g.center();
    return g;
  }, []);

  const leafGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(0.28, 0.08, 0.6, 0.48, 0.66, 1.0);
    s.bezierCurveTo(0.2, 0.9, -0.06, 0.48, 0, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.015, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.01, bevelSegments: 3, curveSegments: 32 });
    // légère courbure de la feuille
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + Math.sin(p.getY(i) * 2.4) * 0.08 - p.getX(i) * 0.1);
    g.computeVertexNormals();
    return g;
  }, []);

  const m = mats();
  return (
    <group>
      <mesh geometry={appleGeo} material={appleMat} scale={[0.94, 1, 0.94]} castShadow />
      <mesh geometry={triGeo} material={m.gold} position={[-0.02, -0.1, 1.03]} rotation={[0, -0.05, 0]} scale={1.12} />
      <mesh position={[-0.1, 0.98, 0.04]} rotation={[0.08, 0, 0.35]} material={m.gold}>
        <cylinderGeometry args={[0.03, 0.045, 0.46, 16]} />
      </mesh>
      <mesh geometry={leafGeo} material={leafMat} position={[0.06, 0.84, 0.16]} rotation={[0.12, 0.15, -0.48]} scale={1.05} />
      {/* liseré doré de la feuille */}
      <mesh position={[0.24, 1.18, 0.2]} rotation={[0.1, 0.15, -1.05]} material={m.gold}>
        <cylinderGeometry args={[0.008, 0.012, 0.95, 8]} />
      </mesh>
    </group>
  );
}

/* ───────────────────────── Ordinateur portable ───────────────────────── */
/** lid : 0 fermé → 1 ouvert à ~110° ; screen : 0 éteint → 1 allumé */
export function Laptop({ lid = one, screen = one, keys = true }: { lid?: Drive; screen?: Drive; keys?: boolean }) {
  const m = mats();
  const scr = useMemo(() => makeScreen(), []);
  const hinge = useRef<THREE.Group>(null);
  const keyMesh = useRef<THREE.InstancedMesh>(null);
  const W = 1.6, D = 1.08, T = 0.05;
  const keyCount = 14 * 5;
  const keyMatrices = useMemo(() => {
    const arr: THREE.Matrix4[] = [];
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 14; c++) arr.push(new THREE.Matrix4().makeTranslation(-0.62 + c * 0.0955, T / 2 + 0.006, -0.36 + r * 0.095));
    return arr;
  }, []);
  useFrame(() => {
    // fermé : capot à plat sur la base (π/2) ; ouvert : ~110°
    if (hinge.current) hinge.current.rotation.x = Math.PI / 2 - lid.current * 1.92;
    setScreen(scr, screen.current * Math.min(1, lid.current * 1.6));
    if (keyMesh.current && !keyMesh.current.userData.ready) {
      keyMatrices.forEach((mx, i) => keyMesh.current!.setMatrixAt(i, mx));
      keyMesh.current.instanceMatrix.needsUpdate = true;
      keyMesh.current.userData.ready = true;
    }
  });
  return (
    <group>
      {/* base */}
      <RoundedBox args={[W, T, D]} radius={0.022} smoothness={4} material={m.aluminium} />
      <mesh position={[0, T / 2 + 0.001, 0.32]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.6, 0.3]} />
        <meshStandardMaterial color="#cfcbc4" metalness={0.8} roughness={0.35} />
      </mesh>
      {keys && (
        <instancedMesh ref={keyMesh} args={[undefined, undefined, keyCount]} material={m.keycap}>
          <boxGeometry args={[0.082, 0.012, 0.08]} />
        </instancedMesh>
      )}
      {/* charnière + capot */}
      <group position={[0, T / 2, -D / 2 + 0.01]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={m.graphite}>
          <cylinderGeometry args={[0.022, 0.022, W * 0.86, 16]} />
        </mesh>
        <group ref={hinge} rotation={[Math.PI / 2, 0, 0]}>
          <RoundedBox args={[W, D, 0.03]} radius={0.02} smoothness={4} position={[0, D / 2, -0.016]} material={m.aluminium} />
          <mesh position={[0, D / 2, 0.0005]} material={m.glassDark}>
            <planeGeometry args={[W - 0.05, D - 0.05]} />
          </mesh>
          <mesh position={[0, D / 2 + 0.02, 0.001]} material={scr}>
            <planeGeometry args={[W - 0.12, D - 0.14]} />
          </mesh>
          {/* pomme EDEN au dos du capot */}
          <mesh position={[0, D / 2, -0.033]} rotation={[0, Math.PI, 0]} material={m.champagneMetal}>
            <circleGeometry args={[0.09, 40]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/* ───────────────────────── Smartphone ───────────────────────── */
/** explode : 0 assemblé → 1 éclaté ; screen : 0→1 ; highlight : anneau du module photo */
export function Phone({ explode = zero, screen = one, highlight = zero, color = "aluminium" }: { explode?: Drive; screen?: Drive; highlight?: Drive; color?: "aluminium" | "graphite" | "champagneMetal" }) {
  const m = mats();
  const scr = useMemo(() => makeScreen(), []);
  const ring = useMemo(() => new THREE.MeshBasicMaterial({ color: "#c6a36a", transparent: true, opacity: 0, side: THREE.DoubleSide }), []);
  const parts = {
    glass: useRef<THREE.Group>(null),
    board: useRef<THREE.Group>(null),
    battery: useRef<THREE.Group>(null),
    camera: useRef<THREE.Group>(null),
    back: useRef<THREE.Group>(null),
  };
  useFrame((st) => {
    const e = explode.current;
    // éclaté en éventail : chaque couche glisse en profondeur et latéralement, sans chaos
    if (parts.glass.current) parts.glass.current.position.set(e * 0.55, e * 0.08, 0.05 + e * 0.5);
    if (parts.board.current) parts.board.current.position.set(e * 0.3, e * 0.04, e * 0.26);
    if (parts.battery.current) parts.battery.current.position.set(-e * 0.28, -e * 0.03, -e * 0.24);
    if (parts.back.current) parts.back.current.position.set(-e * 0.5, -e * 0.06, -0.045 - e * 0.45);
    if (parts.camera.current) parts.camera.current.position.set(-0.16 - e * 0.85, 0.5 + e * 0.12, -0.06 - e * 0.8);
    setScreen(scr, screen.current);
    ring.opacity = highlight.current * (0.55 + 0.35 * Math.sin(st.clock.elapsedTime * 3));
  });
  const frame = m[color];
  return (
    <group>
      {/* cadre */}
      <RoundedBox args={[0.72, 1.48, 0.08]} radius={0.08} smoothness={6} material={frame} />
      {/* écran */}
      <group ref={parts.glass}>
        <RoundedBox args={[0.69, 1.45, 0.012]} radius={0.075} smoothness={6} material={m.glassDark} />
        <mesh position={[0, 0, 0.0065]} material={scr}>
          <planeGeometry args={[0.64, 1.38]} />
        </mesh>
        <mesh position={[0, 0.64, 0.007]}>
          <capsuleGeometry args={[0.02, 0.08, 4, 12]} />
          <meshBasicMaterial color="#000" />
        </mesh>
      </group>
      {/* carte mère */}
      <group ref={parts.board}>
        <mesh position={[0.05, 0.38, 0]} material={m.board}>
          <boxGeometry args={[0.5, 0.5, 0.012]} />
        </mesh>
        {[[-0.08, 0.45], [0.12, 0.3], [0.15, 0.5]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.012]} material={i === 0 ? m.gold : m.graphite}>
            <boxGeometry args={[0.09, 0.09, 0.012]} />
          </mesh>
        ))}
      </group>
      {/* batterie */}
      <group ref={parts.battery}>
        <RoundedBox args={[0.5, 0.72, 0.03]} radius={0.01} position={[0, -0.25, 0]} material={m.battery} />
      </group>
      {/* dos */}
      <group ref={parts.back}>
        <RoundedBox args={[0.7, 1.46, 0.012]} radius={0.075} smoothness={6} material={color === "champagneMetal" ? m.champagneMetal : m.graphite} />
      </group>
      {/* module photo */}
      <group ref={parts.camera} position={[-0.16, 0.5, -0.06]}>
        <RoundedBox args={[0.32, 0.32, 0.03]} radius={0.06} smoothness={4} material={m.graphite} />
        {[[-0.07, 0.07], [0.07, 0.07], [-0.07, -0.07]].map(([x, y], i) => (
          <group key={i} position={[x, y, -0.025]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh material={m.aluminium}>
              <cylinderGeometry args={[0.058, 0.058, 0.03, 32]} />
            </mesh>
            <mesh position={[0, -0.016, 0]} material={m.lens}>
              <cylinderGeometry args={[0.042, 0.042, 0.005, 32]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0.07, -0.07, -0.02]}>
          <sphereGeometry args={[0.018, 16, 16]} />
          <meshStandardMaterial color="#fff8e6" emissive="#fff3d0" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 0, -0.05]} rotation={[0, 0, 0]} material={ring}>
          <ringGeometry args={[0.24, 0.26, 64]} />
        </mesh>
      </group>
    </group>
  );
}

/* ───────────────────────── Écouteurs et boîtier ───────────────────────── */
/** open : couvercle 0→1 ; out : sortie des écouteurs 0→1 */
export function Earbuds({ open = zero, out = zero }: { open?: Drive; out?: Drive }) {
  const m = mats();
  const lidRef = useRef<THREE.Group>(null);
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  useFrame(() => {
    if (lidRef.current) lidRef.current.rotation.x = -open.current * 1.9;
    const o = out.current;
    if (left.current) {
      left.current.position.set(-0.09 - o * 0.55, 0.12 + o * 0.75, o * 0.25);
      left.current.rotation.set(0, o * 0.9, -0.25 - o * 0.4);
    }
    if (right.current) {
      right.current.position.set(0.09 + o * 0.55, 0.12 + o * 0.62, o * 0.3);
      right.current.rotation.set(0, -o * 0.9, 0.25 + o * 0.4);
    }
  });
  const bud = (
    <group>
      <mesh material={m.ceramic} scale={[1, 1.05, 0.95]}>
        <sphereGeometry args={[0.085, 32, 32]} />
      </mesh>
      <mesh material={m.ceramic} position={[0, -0.13, 0]}>
        <capsuleGeometry args={[0.032, 0.16, 8, 16]} />
      </mesh>
      <mesh material={m.graphite} position={[0, 0.01, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.02, 24]} />
      </mesh>
      <mesh material={m.gold} position={[0, -0.215, 0]}>
        <cylinderGeometry args={[0.033, 0.033, 0.012, 24]} />
      </mesh>
    </group>
  );
  return (
    <group>
      {/* boîte */}
      <RoundedBox args={[0.62, 0.36, 0.28]} radius={0.12} smoothness={6} position={[0, -0.04, 0]} material={m.ceramic} />
      <mesh position={[0, 0.0, 0.142]} material={m.gold}>
        <circleGeometry args={[0.014, 20]} />
      </mesh>
      <group ref={lidRef} position={[0, 0.14, -0.14]}>
        <RoundedBox args={[0.62, 0.14, 0.28]} radius={0.065} smoothness={6} position={[0, 0.03, 0.14]} material={m.ceramic} />
      </group>
      <group ref={left}>{bud}</group>
      <group ref={right}>{bud}</group>
    </group>
  );
}

/* ───────────────────────── Casque ───────────────────────── */
export function Headphones({ fold = zero }: { fold?: Drive }) {
  const m = mats();
  const l = useRef<THREE.Group>(null);
  const r = useRef<THREE.Group>(null);
  useFrame(() => {
    const f = fold.current;
    if (l.current) l.current.rotation.y = f * 0.9;
    if (r.current) r.current.rotation.y = -f * 0.9;
  });
  const cup = (side: 1 | -1, ref: React.RefObject<THREE.Group | null>) => (
    <group ref={ref} position={[side * 0.62, -0.18, 0]}>
      <mesh material={m.aluminium} position={[0, 0.2, 0]}>
        <boxGeometry args={[0.04, 0.32, 0.06]} />
      </mesh>
      <group rotation={[0, 0, Math.PI / 2]}>
        <mesh material={m.champagneMetal}>
          <cylinderGeometry args={[0.27, 0.27, 0.16, 48]} />
        </mesh>
        <mesh material={m.sage} position={[0, side * -0.1, 0]}>
          <torusGeometry args={[0.2, 0.07, 20, 48]} />
        </mesh>
        <mesh material={m.gold} position={[0, side * 0.082, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.22, 48]} />
        </mesh>
      </group>
    </group>
  );
  return (
    <group>
      <mesh material={m.aluminium} position={[0, 0.02, 0]}>
        <torusGeometry args={[0.62, 0.035, 20, 80, Math.PI]} />
      </mesh>
      <mesh material={m.sage} position={[0, 0.0, 0]}>
        <torusGeometry args={[0.58, 0.05, 20, 80, Math.PI]} />
      </mesh>
      {cup(-1, l)}
      {cup(1, r)}
    </group>
  );
}

/* ───────────────────────── Montre ───────────────────────── */
/** split : 0 assemblée → 1 bracelet et boîtier séparés */
export function Watch({ split = zero, screen = one }: { split?: Drive; screen?: Drive }) {
  const m = mats();
  const scr = useMemo(() => makeScreen(), []);
  const top = useRef<THREE.Group>(null);
  const bottom = useRef<THREE.Group>(null);
  const face = useRef<THREE.Group>(null);
  useFrame(() => {
    const s = split.current;
    if (top.current) top.current.position.y = 0.42 + s * 0.35;
    if (bottom.current) bottom.current.position.y = -0.42 - s * 0.35;
    if (face.current) face.current.position.z = 0.074 + s * 0.25;
    setScreen(scr, screen.current);
  });
  return (
    <group>
      <group ref={top}>
        <RoundedBox args={[0.34, 0.6, 0.05]} radius={0.024} position={[0, 0.2, -0.04]} material={m.sage} />
      </group>
      <group ref={bottom}>
        <RoundedBox args={[0.34, 0.6, 0.05]} radius={0.024} position={[0, -0.2, -0.04]} material={m.sage} />
        <mesh position={[0, -0.32, -0.012]} material={m.gold}>
          <boxGeometry args={[0.2, 0.025, 0.01]} />
        </mesh>
      </group>
      <RoundedBox args={[0.5, 0.6, 0.14]} radius={0.12} smoothness={6} material={m.champagneMetal} />
      <group ref={face}>
        <RoundedBox args={[0.44, 0.54, 0.01]} radius={0.1} smoothness={6} material={m.glassDark} />
        <mesh position={[0, 0, 0.006]} material={scr}>
          <planeGeometry args={[0.36, 0.46]} />
        </mesh>
      </group>
      <group position={[0.27, 0.08, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh material={m.gold}>
          <cylinderGeometry args={[0.045, 0.045, 0.06, 24]} />
        </mesh>
      </group>
      <mesh position={[0.26, -0.12, 0]} material={m.redAccent}>
        <boxGeometry args={[0.03, 0.12, 0.05]} />
      </mesh>
    </group>
  );
}

/* ───────────────────────── Enceinte ───────────────────────── */
export function Speaker() {
  const m = mats();
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh material={m.sage}>
        <capsuleGeometry args={[0.24, 0.62, 16, 32]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[0, s * 0.56, 0]}>
          <mesh material={m.champagneMetal}>
            <cylinderGeometry args={[0.2, 0.2, 0.06, 40]} />
          </mesh>
          <mesh material={m.gold} position={[0, s * 0.035, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.02, 32]} />
          </mesh>
        </group>
      ))}
      <mesh material={m.redAccent} position={[0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.1, 0.02, 0.06]} />
      </mesh>
    </group>
  );
}

/* ───────────────────────── Manette ───────────────────────── */
/** pulse : index du bouton mis en valeur (0→4) ; sticks : inclinaison ; trigger : pression */
export function Controller({ pulse = zero, sticks = zero, trigger = zero }: { pulse?: Drive; sticks?: Drive; trigger?: Drive }) {
  const m = mats();
  const btnMats = useMemo(
    () => ["#c6a36a", "#b82e35", "#66866d", "#a7b9a5"].map((c) => new THREE.MeshStandardMaterial({ color: c, emissive: new THREE.Color(c), emissiveIntensity: 0, roughness: 0.3, metalness: 0.2 })),
    [],
  );
  const lStick = useRef<THREE.Group>(null);
  const rStick = useRef<THREE.Group>(null);
  const lTrig = useRef<THREE.Mesh>(null);
  const rTrig = useRef<THREE.Mesh>(null);
  const bodyGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.55, 0.22);
    s.bezierCurveTo(-0.3, 0.32, 0.3, 0.32, 0.55, 0.22);
    s.bezierCurveTo(0.78, 0.1, 0.86, -0.38, 0.72, -0.56);
    s.bezierCurveTo(0.6, -0.68, 0.46, -0.56, 0.38, -0.36);
    s.bezierCurveTo(0.2, -0.26, -0.2, -0.26, -0.38, -0.36);
    s.bezierCurveTo(-0.46, -0.56, -0.6, -0.68, -0.72, -0.56);
    s.bezierCurveTo(-0.86, -0.38, -0.78, 0.1, -0.55, 0.22);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 8, curveSegments: 32 });
    g.center();
    return g;
  }, []);
  useFrame((st) => {
    const idx = pulse.current;
    btnMats.forEach((bm, i) => {
      const d = Math.max(0, 1 - Math.abs(idx - (i + 0.5)) * 1.4);
      bm.emissiveIntensity = d * (0.8 + 0.3 * Math.sin(st.clock.elapsedTime * 6));
    });
    const s = sticks.current;
    const t = st.clock.elapsedTime;
    if (lStick.current) lStick.current.rotation.set(Math.sin(t * 2) * 0.35 * s, 0, Math.cos(t * 2) * 0.35 * s);
    if (rStick.current) rStick.current.rotation.set(Math.cos(t * 1.6) * 0.35 * s, 0, Math.sin(t * 1.6) * 0.35 * s);
    if (lTrig.current) lTrig.current.rotation.x = -trigger.current * 0.5;
    if (rTrig.current) rTrig.current.rotation.x = -trigger.current * 0.5;
  });
  const stick = (ref: React.RefObject<THREE.Group | null>, x: number, y: number) => (
    <group ref={ref} position={[x, y, 0.15]}>
      <mesh material={m.softTouch} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.08, 16]} />
      </mesh>
      <mesh material={m.softTouch} position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.085, 0.08, 0.035, 32]} />
      </mesh>
      <mesh material={m.gold} position={[0, 0, 0.069]}>
        <ringGeometry args={[0.06, 0.07, 32]} />
      </mesh>
    </group>
  );
  return (
    <group>
      <mesh geometry={bodyGeo} material={m.ceramic} />
      <mesh position={[0, 0.02, 0.141]} material={m.graphite}>
        <circleGeometry args={[0.16, 48]} />
      </mesh>
      {stick(lStick, -0.28, -0.12)}
      {stick(rStick, 0.18, -0.24)}
      {/* croix directionnelle */}
      <group position={[-0.42, 0.08, 0.14]}>
        <mesh material={m.graphite}><boxGeometry args={[0.16, 0.05, 0.03]} /></mesh>
        <mesh material={m.graphite}><boxGeometry args={[0.05, 0.16, 0.03]} /></mesh>
      </group>
      {/* boutons */}
      {[[0.44, 0.17], [0.53, 0.08], [0.35, 0.08], [0.44, -0.01]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.14]} material={btnMats[i]}>
          <sphereGeometry args={[0.042, 24, 24]} />
        </mesh>
      ))}
      {/* gâchettes */}
      <mesh ref={lTrig} position={[-0.5, 0.3, -0.05]} material={m.graphite}>
        <boxGeometry args={[0.22, 0.06, 0.12]} />
      </mesh>
      <mesh ref={rTrig} position={[0.5, 0.3, -0.05]} material={m.graphite}>
        <boxGeometry args={[0.22, 0.06, 0.12]} />
      </mesh>
      <mesh position={[0, 0.2, 0.145]} material={m.redAccent}>
        <boxGeometry args={[0.07, 0.015, 0.01]} />
      </mesh>
    </group>
  );
}

/* ───────────────────────── Équipement de bureau ───────────────────────── */
export function Monitor({ screen = one }: { screen?: Drive }) {
  const m = mats();
  const scr = useMemo(() => makeScreen(), []);
  useFrame(() => setScreen(scr, screen.current));
  return (
    <group>
      <RoundedBox args={[2.2, 1.3, 0.05]} radius={0.03} position={[0, 1.05, 0]} material={m.aluminium} />
      <mesh position={[0, 1.07, 0.026]} material={scr}>
        <planeGeometry args={[2.1, 1.18]} />
      </mesh>
      <mesh position={[0, 0.3, -0.12]} material={m.aluminium}>
        <boxGeometry args={[0.16, 0.6, 0.05]} />
      </mesh>
      <RoundedBox args={[0.7, 0.03, 0.45]} radius={0.012} position={[0, 0.015, -0.08]} material={m.aluminium} />
    </group>
  );
}

export function Printer() {
  const m = mats();
  return (
    <group>
      <RoundedBox args={[0.9, 0.42, 0.7]} radius={0.06} position={[0, 0.21, 0]} material={m.ceramic} />
      <RoundedBox args={[0.6, 0.02, 0.38]} radius={0.008} position={[0, 0.43, -0.02]} material={m.graphite} />
      <mesh position={[0, 0.45, 0.05]} rotation={[-1.2, 0, 0]} material={m.paper}>
        <planeGeometry args={[0.42, 0.5]} />
      </mesh>
      <mesh position={[0.32, 0.3, 0.351]} material={m.botanical}>
        <circleGeometry args={[0.025, 20]} />
      </mesh>
    </group>
  );
}

export function Desk() {
  const m = mats();
  return (
    <group>
      <RoundedBox args={[4.2, 0.08, 1.7]} radius={0.03} position={[0, 0, 0]} material={m.wood} />
      {[[-1.95, -0.75], [1.95, -0.75], [-1.95, 0.75], [1.95, 0.75]].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.62, z]} material={m.champagneMetal}>
          <boxGeometry args={[0.05, 1.2, 0.05]} />
        </mesh>
      ))}
    </group>
  );
}
