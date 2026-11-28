"use client";
// Aperçu 3D en direct de la personnalisation (coque de téléphone, capot et pochette d'ordinateur).
import { useFrame } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Studio } from "./Studio";
import { Laptop, Phone } from "./models";
import { hexOf, type Customization } from "@/lib/custom";

function shade(hex: string, k: number) {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, THREE.MathUtils.clamp(hsl.l + k, 0, 1));
  return `#${c.getHexString()}`;
}

/** Dessine la surface personnalisée (couleur, finition, motif, inscription) sur un canevas. */
function paint(ctx: CanvasRenderingContext2D, w: number, h: number, c: Customization, opts: { cutout?: [number, number, number, number]; transparent?: boolean }) {
  const base = hexOf(c.color);
  ctx.clearRect(0, 0, w, h);
  ctx.globalAlpha = opts.transparent ? 0.28 : 1;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  // finitions spéciales
  if (c.style === "marbre") {
    ctx.strokeStyle = shade(base, 0.22);
    ctx.lineWidth = 3;
    for (let i = 0; i < 14; i++) {
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      let x = (i / 14) * w, y = 0;
      ctx.moveTo(x, y);
      while (y < h) {
        x += Math.sin(y * 0.02 + i) * 14;
        y += 18;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else if (c.style === "bois") {
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = shade(base, -0.18);
    for (let y = 0; y < h; y += 9) {
      ctx.lineWidth = 1 + (y % 27 === 0 ? 2 : 0);
      ctx.beginPath();
      for (let x = 0; x <= w; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.012 + y * 0.05) * 5);
      ctx.stroke();
    }
  } else if (c.style === "cuir") {
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = i % 2 ? "#000" : "#fff";
      ctx.fillRect((i * 97) % w, (i * 57) % h, 2, 2);
    }
  }
  // motifs
  const ink = shade(base, base === "#33312e" ? 0.18 : -0.14);
  ctx.globalAlpha = opts.transparent ? 0.6 : 0.55;
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  if (c.pattern === "lignes") {
    ctx.lineWidth = 2;
    for (let x = -h; x < w; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + h, 0);
      ctx.stroke();
    }
  } else if (c.pattern === "geometrique") {
    const s = 48;
    for (let y = 0; y < h + s; y += s)
      for (let x = 0; x < w + s; x += s) {
        ctx.beginPath();
        ctx.moveTo(x, y + s / 2);
        ctx.lineTo(x + s / 2, y);
        ctx.lineTo(x + s, y + s / 2);
        ctx.lineTo(x + s / 2, y + s);
        ctx.closePath();
        ctx.lineWidth = 2;
        ctx.stroke();
      }
  } else if (c.pattern === "feuillage") {
    for (let i = 0; i < 26; i++) {
      const x = ((i * 137) % w) + 10, y = ((i * 89) % h) + 10, r = 18 + (i % 3) * 8, a = i * 0.7;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.45, r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (c.pattern === "monogramme") {
    ctx.font = `600 ${Math.round(w * 0.06)}px sans-serif`;
    ctx.textAlign = "center";
    for (let y = 30, r = 0; y < h; y += w * 0.12, r++)
      for (let x = r % 2 ? w * 0.18 : 0; x < w + 40; x += w * 0.36) ctx.fillText("EDEN", x, y);
  }
  ctx.globalAlpha = 1;
  // découpe du module photo
  if (opts.cutout) {
    const [x, y, cw, ch] = opts.cutout;
    ctx.fillStyle = "#1a1a19";
    ctx.beginPath();
    ctx.roundRect(x, y, cw, ch, cw * 0.22);
    ctx.fill();
  }
  // inscription
  if (c.text) {
    ctx.fillStyle = base === "#33312e" || base === "#66866d" || base === "#b82e35" ? "#f2ece1" : "#33312e";
    ctx.font = `italic 500 ${Math.round(w * (c.kind === "phone" ? 0.13 : 0.075))}px Georgia, serif`;
    ctx.textAlign = "center";
    ctx.fillText(c.text, w / 2, c.kind === "phone" ? h * 0.86 : h * 0.8);
  }
}

function useSurface(c: Customization, w: number, h: number, opts: { cutout?: [number, number, number, number]; transparent?: boolean }) {
  const canvas = useMemo(() => {
    const el = document.createElement("canvas");
    el.width = w;
    el.height = h;
    return el;
  }, [w, h]);
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [canvas]);
  const key = JSON.stringify([c.color, c.pattern, c.text, c.style, opts.transparent]);
  useEffect(() => {
    paint(canvas.getContext("2d")!, w, h, c, opts);
    tex.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return tex;
}

function PhoneWithCase({ c }: { c: Customization }) {
  const transparent = c.style === "transparente";
  const tex = useSurface(c, 512, 1024, { cutout: [276, 78, 220, 220], transparent });
  const shell = useMemo(() => new THREE.MeshPhysicalMaterial({ roughness: 0.5, clearcoat: 0.3 }), []);
  useEffect(() => {
    shell.color.set(hexOf(c.color));
    shell.transparent = transparent;
    shell.opacity = transparent ? 0.35 : 1;
    shell.roughness = c.style === "cuir" ? 0.75 : c.style === "renforcee" ? 0.55 : 0.35;
    shell.clearcoat = c.style === "silicone" ? 0.15 : 0.5;
    shell.needsUpdate = true;
  }, [c.color, c.style, transparent, shell]);
  const back = useMemo(() => new THREE.MeshPhysicalMaterial({ map: tex, transparent: true, roughness: 0.45, clearcoat: 0.4 }), [tex]);
  const bumper = c.style === "renforcee" ? 0.03 : 0.015;
  return (
    <group>
      <Phone color="graphite" />
      {/* contour de la coque */}
      {/* la coque enveloppe le dos et les côtés ; son rebord avant s'arrête sous la vitre */}
      <RoundedBox args={[0.72 + bumper * 2, 1.48 + bumper * 2, 0.096]} radius={0.09} smoothness={6} position={[0, 0, -0.018]} material={shell} />
      {/* dos imprimé */}
      <mesh position={[0, 0, -0.064 - bumper / 2]} rotation={[0, Math.PI, 0]} material={back}>
        <planeGeometry args={[0.7, 1.44]} />
      </mesh>
    </group>
  );
}

function LaptopWithSkin({ c }: { c: Customization }) {
  const tex = useSurface(c, 1024, 700, {});
  const skin = useMemo(() => new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.4, clearcoat: 0.5 }), [tex]);
  useEffect(() => {
    skin.roughness = c.style === "brillant" ? 0.15 : c.style === "mat" ? 0.7 : 0.35;
    skin.clearcoat = c.style === "brillant" ? 1 : 0.3;
    skin.needsUpdate = true;
  }, [c.style, skin]);
  const open = useRef(0.72);
  return (
    <group>
      <group position={[-0.25, 0, 0]}>
        <Laptop lid={open} />
        {/* skin collé au dos du capot : on le place dans le repère du capot ouvert */}
        <group position={[0, 0.025, -0.53]} rotation={[Math.PI / 2 - open.current * 1.92, 0, 0]}>
          <mesh position={[0, 0.54, -0.0335]} rotation={[0, Math.PI, 0]} material={skin}>
            <planeGeometry args={[1.56, 1.04]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Sleeve({ c }: { c: Customization }) {
  const sleeveMat = useMemo(() => new THREE.MeshPhysicalMaterial({ roughness: 0.8, sheen: 0.6 }), []);
  useEffect(() => {
    sleeveMat.color.set(hexOf(c.sleeveColor ?? "graphite"));
    sleeveMat.roughness = c.sleeve === "cuir" ? 0.45 : 0.85;
    sleeveMat.clearcoat = c.sleeve === "cuir" ? 0.4 : 0;
  }, [c.sleeve, c.sleeveColor, sleeveMat]);
  if (!c.sleeve || c.sleeve === "aucune") return null;
  return (
    <group>
      {(
        <group position={[1.35, 0.05, -0.9]} rotation={[0, -0.55, 0.06]} scale={0.62}>
          <RoundedBox args={[1.78, 1.25, 0.09]} radius={0.04} smoothness={4} material={sleeveMat} />
          <mesh position={[0, 0.5, 0.047]}>
            <boxGeometry args={[1.5, 0.012, 0.004]} />
            <meshStandardMaterial color="#c6a36a" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function Turntable({ children, view }: { children: React.ReactNode; view: "front" | "back" }) {
  const g = useRef<THREE.Group>(null);
  const target = view === "back" ? Math.PI : 0;
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y = THREE.MathUtils.lerp(g.current.rotation.y, target, Math.min(1, dt * 4));
  });
  return <group ref={g}>{children}</group>;
}

export default function CustomPreview({ c, view }: { c: Customization; view: "front" | "back" }) {
  const phone = c.kind === "phone";
  return (
    <Studio bg="#f5f0e7" camera={{ position: [0, phone ? 0.2 : 0.9, phone ? 3.4 : 4.6], fov: 34 }} shadowY={phone ? -1 : -1.15}>
      <Turntable view={view}>{phone ? <PhoneWithCase c={c} /> : <LaptopWithSkin c={c} />}</Turntable>
      {!phone && <Sleeve c={c} />}
      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={1.1} maxPolarAngle={1.9} />
    </Studio>
  );
}
