"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { DeviceArt } from "../DeviceArt";

const Product3D = dynamic(() => import("./Product3D"), { ssr: false, loading: () => <div className="grid h-full place-items-center text-sm text-eden-mute">Chargement de la vue 3D…</div> });

const KINDS_3D = ["phone", "tablet", "laptop", "headphones", "watch", "controller", "earbuds", "speaker", "monitor", "printer"];

type View = { type: "art" } | { type: "image"; src: string } | { type: "video"; src: string } | { type: "3d" };

export function Gallery({ name, kind, color, images, videoUrl }: { name: string; kind: string; color: string; images: string[]; videoUrl: string | null }) {
  const views: View[] = [
    ...(images.length ? images.map((src) => ({ type: "image" as const, src })) : [{ type: "art" as const }]),
    ...(videoUrl ? [{ type: "video" as const, src: videoUrl }] : []),
    ...(KINDS_3D.includes(kind) ? [{ type: "3d" as const }] : []),
  ];
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const v = views[i];

  const visual = (big = false) =>
    v.type === "image" ? (
      <Image src={v.src} alt={name} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-contain" />
    ) : (
      <DeviceArt kind={kind} color={color} className={clsx("h-full w-full", big && "p-6")} title={name} />
    );

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-eden-ivory to-eden-ivory-2 shadow-[var(--shadow-soft)]">
        {v.type === "3d" ? (
          <div className="absolute inset-0">
            <Product3D kind={kind} />
            <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-xs text-eden-mute">Faites glisser pour tourner. Représentation 3D générique.</p>
          </div>
        ) : v.type === "video" ? (
          <video src={v.src} controls playsInline className="h-full w-full object-contain" />
        ) : (
          <button
            type="button"
            className="group relative block h-full w-full cursor-zoom-in p-10"
            onClick={() => setZoom(true)}
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
            }}
            aria-label="Agrandir l'image"
          >
            <div className="relative h-full w-full transition-transform duration-300 group-hover:scale-[1.6]" style={{ transformOrigin: origin }}>
              {visual()}
            </div>
          </button>
        )}
        {images.length === 0 && v.type === "art" && (
          <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-[11px] text-eden-mute">Illustration non contractuelle.</p>
        )}
      </div>
      {views.length > 1 && (
        <div className="mt-4 flex gap-3">
          {views.map((w, k) => (
            <button
              key={k}
              onClick={() => setI(k)}
              aria-label={w.type === "3d" ? "Vue 3D" : w.type === "video" ? "Vidéo" : `Vue ${k + 1}`}
              aria-pressed={i === k}
              className={clsx("grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-white text-xs font-semibold shadow-[var(--shadow-soft)] ring-2 transition", i === k ? "ring-eden-green" : "ring-transparent hover:ring-eden-gold")}
            >
              {w.type === "3d" ? <span className="text-eden-green">3D</span> : w.type === "video" ? "▶" : w.type === "image" ? <Image src={w.src} alt="" width={64} height={64} className="object-contain" /> : <DeviceArt kind={kind} color={color} className="h-12 w-12" />}
            </button>
          ))}
        </div>
      )}
      <AnimatePresence>
        {zoom && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] grid place-items-center bg-eden-charcoal/80 p-4 backdrop-blur" onClick={() => setZoom(false)} role="dialog" aria-label={`${name}, image agrandie`}>
            <div className="relative aspect-square w-full max-w-3xl rounded-[2rem] bg-eden-ivory">{visual(true)}</div>
            <button className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white text-xl" aria-label="Fermer">×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
