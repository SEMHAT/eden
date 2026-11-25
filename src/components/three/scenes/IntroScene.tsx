"use client";
// Introduction : la sculpture apparaît, la caméra révèle sa profondeur, les produits orbitent, la caméra s'approche.
import { useFrame } from "@react-three/fiber";
import { useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { Studio } from "../Studio";
import { Constellation } from "./Constellation";
import { seg } from "../materials";

function Rig({ t }: { t: MutableRefObject<number> }) {
  const sculpt = useRef(0);
  const reveal = useRef(0);
  const orbit = useRef(0);
  useFrame((st) => {
    const p = t.current; // 0 → 1 sur toute la séquence
    sculpt.current = seg(p, 0.18, 0.34);
    reveal.current = seg(p, 0.48, 0.7);
    orbit.current = seg(p, 0.55, 0.9) * 0.8;
    const cam = st.camera;
    // mouvement de caméra : léger arc autour de la sculpture, puis approche finale
    const arc = seg(p, 0.3, 0.55);
    const ang = -0.6 + arc * 0.6;
    const approach = seg(p, 0.84, 1);
    const radius = 8.4 - seg(p, 0.55, 0.8) * 0.4 - approach * 0.9;
    cam.position.set(Math.sin(ang) * radius, 0.6 - arc * 0.25 - approach * 0.2, Math.cos(ang) * radius);
    cam.lookAt(0, 0.05, 0);
    (cam as THREE.PerspectiveCamera).updateProjectionMatrix();
  });
  return <Constellation sculpt={sculpt} reveal={reveal} orbit={orbit} parallax={false} />;
}

export default function IntroScene({ t }: { t: MutableRefObject<number> }) {
  return (
    <Studio camera={{ position: [0, 0.6, 8.4], fov: 34 }} shadowY={-1.75}>
      <Rig t={t} />
    </Studio>
  );
}
