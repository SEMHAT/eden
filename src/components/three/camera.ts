"use client";
import * as THREE from "three";

export type Key = { p: number; pos: [number, number, number]; look: [number, number, number] };

const a = new THREE.Vector3();
const b = new THREE.Vector3();
const la = new THREE.Vector3();
const lb = new THREE.Vector3();

/** Trajectoire de caméra par images clés, lissée entre deux clés. */
export function cameraPath(camera: THREE.Camera, keys: Key[], p: number, compact = false) {
  let i = 0;
  while (i < keys.length - 2 && p > keys[i + 1].p) i++;
  const k0 = keys[i];
  const k1 = keys[Math.min(i + 1, keys.length - 1)];
  const span = Math.max(1e-6, k1.p - k0.p);
  let t = THREE.MathUtils.clamp((p - k0.p) / span, 0, 1);
  t = t * t * (3 - 2 * t);
  a.set(...k0.pos);
  b.set(...k1.pos);
  la.set(...k0.look);
  lb.set(...k1.look);
  a.lerp(b, t);
  la.lerp(lb, t);
  // sur mobile, on recule un peu pour garder le produit entier dans le cadre
  if (compact) a.sub(la).multiplyScalar(1.35).add(la);
  camera.position.lerp(a, 0.18);
  camera.lookAt(la);
  // sur grand écran, le sujet est décalé vers la droite pour laisser respirer le texte (décalage optique, sans changer la visée)
  const cam = camera as THREE.PerspectiveCamera;
  const off = compact ? 0 : -7;
  if (cam.filmOffset !== off) {
    cam.filmOffset = off;
    cam.updateProjectionMatrix();
  }
}
