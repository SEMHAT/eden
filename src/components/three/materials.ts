"use client";
// Matériaux partagés : une seule instance par type, réutilisée par toutes les scènes.
import * as THREE from "three";

let cache: ReturnType<typeof build> | null = null;

function screenTexture(variant: "home" | "laptop" | "off") {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 1024;
  const g = c.getContext("2d")!;
  if (variant === "off") {
    g.fillStyle = "#0d0d0c";
    g.fillRect(0, 0, 512, 1024);
  } else {
    const grd = g.createLinearGradient(0, 0, 512, 1024);
    grd.addColorStop(0, "#f6efe2");
    grd.addColorStop(0.45, "#dfe7dc");
    grd.addColorStop(1, "#a7b9a5");
    g.fillStyle = grd;
    g.fillRect(0, 0, 512, 1024);
    // vagues douces
    g.globalAlpha = 0.55;
    g.fillStyle = "#66866d";
    g.beginPath();
    g.moveTo(0, 760);
    g.bezierCurveTo(160, 640, 330, 860, 512, 700);
    g.lineTo(512, 1024);
    g.lineTo(0, 1024);
    g.fill();
    g.globalAlpha = 0.9;
    g.fillStyle = "#c6a36a";
    g.beginPath();
    g.moveTo(0, 880);
    g.bezierCurveTo(200, 800, 330, 960, 512, 860);
    g.lineTo(512, 1024);
    g.lineTo(0, 1024);
    g.fill();
    g.globalAlpha = 1;
    g.fillStyle = "#33312e";
    g.font = "600 44px sans-serif";
    g.textAlign = "center";
    g.fillText("EDEN", 256, 300);
    g.font = "italic 26px serif";
    g.fillStyle = "#66866d";
    g.fillText("the art of technology", 256, 350);
    // pomme stylisée
    g.fillStyle = "#b82e35";
    g.beginPath();
    g.arc(236, 190, 34, 0, Math.PI * 2);
    g.arc(276, 190, 34, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#c6a36a";
    g.beginPath();
    g.moveTo(246, 172);
    g.lineTo(274, 190);
    g.lineTo(246, 208);
    g.closePath();
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function build() {
  const homeTex = screenTexture("home");
  return {
    aluminium: new THREE.MeshPhysicalMaterial({ color: "#e6e3dd", metalness: 0.55, roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.3 }),
    champagneMetal: new THREE.MeshPhysicalMaterial({ color: "#e3cfab", metalness: 0.6, roughness: 0.28, clearcoat: 0.5, clearcoatRoughness: 0.2 }),
    graphite: new THREE.MeshPhysicalMaterial({ color: "#4a4744", metalness: 0.5, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
    softTouch: new THREE.MeshStandardMaterial({ color: "#2f2e2c", metalness: 0.1, roughness: 0.7 }),
    ceramic: new THREE.MeshPhysicalMaterial({ color: "#f7f5f0", metalness: 0, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 }),
    sage: new THREE.MeshPhysicalMaterial({ color: "#a7b9a5", metalness: 0.05, roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color("#e6efe3") }),
    botanical: new THREE.MeshPhysicalMaterial({ color: "#66866d", metalness: 0.1, roughness: 0.5 }),
    gold: new THREE.MeshPhysicalMaterial({ color: "#d4b37a", metalness: 0.9, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.15, emissive: new THREE.Color("#5a4420"), emissiveIntensity: 0.35 }),
    glassDark: new THREE.MeshPhysicalMaterial({ color: "#111110", metalness: 0.2, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03 }),
    lens: new THREE.MeshPhysicalMaterial({ color: "#0b0b0b", metalness: 0.4, roughness: 0.05, clearcoat: 1, iridescence: 0.6, iridescenceIOR: 1.5 }),
    keycap: new THREE.MeshStandardMaterial({ color: "#2b2a28", metalness: 0.2, roughness: 0.6 }),
    board: new THREE.MeshStandardMaterial({ color: "#45604b", metalness: 0.4, roughness: 0.45 }),
    battery: new THREE.MeshPhysicalMaterial({ color: "#5c5a56", metalness: 0.6, roughness: 0.4 }),
    porcelainFloor: new THREE.MeshStandardMaterial({ color: "#f3eee5", roughness: 0.9 }),
    wood: new THREE.MeshStandardMaterial({ color: "#c9b59a", roughness: 0.7 }),
    paper: new THREE.MeshStandardMaterial({ color: "#fbfaf6", roughness: 0.95 }),
    redAccent: new THREE.MeshPhysicalMaterial({ color: "#b82e35", metalness: 0.1, roughness: 0.3, clearcoat: 0.8 }),
    screenHome: new THREE.MeshStandardMaterial({ map: homeTex, emissive: new THREE.Color("#ffffff"), emissiveMap: homeTex, emissiveIntensity: 0.55, roughness: 0.12 }),
    screenOff: new THREE.MeshStandardMaterial({ color: "#0e0e0d", roughness: 0.08, metalness: 0.3 }),
  };
}

/** Matériaux partagés (créés au premier appel, côté client). */
export function mats() {
  if (!cache) cache = build();
  return cache;
}

/** Écran allumable : un matériau propre à chaque instance dont on fait varier l'intensité. */
export function makeScreen() {
  const m = mats().screenHome.clone();
  m.emissiveIntensity = 0;
  m.color = new THREE.Color("#151514");
  return m;
}

export function setScreen(m: THREE.MeshStandardMaterial, on: number) {
  const k = THREE.MathUtils.clamp(on, 0, 1);
  m.emissiveIntensity = 0.6 * k;
  m.color.setRGB(0.08 + 0.92 * k, 0.08 + 0.92 * k, 0.078 + 0.92 * k);
}

/** Interpolation d'une valeur sur une plage de progression, avec lissage. */
export function seg(p: number, a: number, b: number) {
  const t = THREE.MathUtils.clamp((p - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
