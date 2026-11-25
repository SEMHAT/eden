"use client";
// Introduction cinématique EDEN : facultative, mémorisée, jamais bloquante.
import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createAmbience, type Ambience } from "./ambience";

const IntroScene = dynamic(() => import("../three/scenes/IntroScene"), { ssr: false });

export const INTRO_KEY = "eden_intro_vue";
const DURATION = 10.5; // secondes

type Mode = "off" | "full" | "static";

function shouldShow() {
  const q = new URLSearchParams(window.location.search);
  if (q.get("intro") === "1") return true;
  if (q.get("intro") === "0") return false;
  try {
    return !localStorage.getItem(INTRO_KEY);
  } catch {
    return false;
  }
}

function supports3D() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const q = new URLSearchParams(window.location.search).get("rendu");
  if (q === "2d") return false;
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function IntroOverlay() {
  const [mode, setMode] = useState<Mode>("off");
  const [phase, setPhase] = useState(0); // 0 logo, 1 sculpture, 2 produits, 3 fin
  const [sound, setSound] = useState(false);
  const t = useRef(0);
  const audio = useRef<Ambience | null>(null);
  const tween = useRef<{ kill: () => void } | null>(null);
  const bar = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    try {
      localStorage.setItem(INTRO_KEY, "1");
    } catch {}
    tween.current?.kill();
    audio.current?.stop();
    setMode("off");
    document.documentElement.removeAttribute("data-intro");
    document.body.style.overflow = "";
    if (new URLSearchParams(window.location.search).has("intro")) window.history.replaceState(null, "", "/");
  }, []);

  useEffect(() => {
    if (!shouldShow()) {
      document.documentElement.removeAttribute("data-intro");
      return;
    }
    const full = supports3D();
    setMode(full ? "full" : "static");
    document.body.style.overflow = "hidden";
    document.documentElement.setAttribute("data-intro", "on");
    if (!full) {
      setPhase(3);
      return;
    }
    // séquence calée sur l'horloge réelle : même durée sur tous les appareils
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const v = Math.min(1, (now - start) / 1000 / DURATION);
      t.current = v;
      if (bar.current) bar.current.style.width = `${v * 100}%`;
      const ph = v < 0.2 ? 0 : v < 0.48 ? 1 : v < 0.86 ? 2 : 3;
      setPhase((p) => (p === ph ? p : ph));
      if (ph >= 1) audio.current?.chime(v);
      if (v < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    tween.current = { kill: () => cancelAnimationFrame(raf) };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      tween.current?.kill();
    };
  }, [close]);

  const toggleSound = () => {
    if (!sound) {
      audio.current = audio.current ?? createAmbience();
      audio.current.start();
    } else audio.current?.stop();
    setSound(!sound);
  };

  return (
    <AnimatePresence>
      {mode !== "off" && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[90] overflow-hidden bg-eden-ivory text-eden-charcoal"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: "blur(6px)" }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
          role="dialog"
          aria-label="Introduction EDEN"
        >
          {/* halo lumineux */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[90vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.95),rgba(245,240,231,0)_65%)]" />

          {mode === "full" && (
            <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: phase >= 1 ? 1 : 0 }} transition={{ duration: 1.4 }}>
              <IntroScene t={t} />
            </motion.div>
          )}

          {/* le logo d'origine, traversé par une lumière, avant de devenir sculpture */}
          <AnimatePresence>
            {(phase === 0 || mode === "static") && (
              <motion.div
                key="logo"
                className="absolute left-1/2 top-1/2 w-[min(34vw,220px)] -translate-x-1/2 -translate-y-[58%]"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.12, filter: "blur(4px)" }}
                transition={{ duration: 1.2, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <Image src="/brand/eden-logo.webp" alt="Logo EDEN" width={394} height={512} priority className="h-auto w-full" />
                {mode === "full" && (
                  <div
                    className="pointer-events-none absolute inset-0 animate-[sweep_2.2s_ease-in-out_0.4s_1_both]"
                    style={{
                      background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.85) 50%, transparent 65%)",
                      backgroundSize: "250% 100%",
                      WebkitMaskImage: "url(/brand/eden-logo.webp)",
                      maskImage: "url(/brand/eden-logo.webp)",
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                    }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* titres */}
          <div className="pointer-events-none absolute inset-x-0 top-[9vh] text-center">
            <motion.p initial={{ opacity: 0, letterSpacing: "0.6em" }} animate={{ opacity: phase >= 1 || mode === "static" ? 1 : 0, letterSpacing: "0.42em" }} transition={{ duration: 1.6 }} className="font-display text-sm font-semibold text-eden-charcoal">
              EDEN
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: phase >= 2 || mode === "static" ? 1 : 0 }} transition={{ duration: 1.2 }} className="mt-2 font-serif text-lg italic text-eden-botanical">
              The art of technology
            </motion.p>
          </div>

          <div className="absolute inset-x-0 bottom-[8vh] flex flex-col items-center px-6 text-center">
            <AnimatePresence>
              {phase >= 3 && (
                <motion.div key="end" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="flex flex-col items-center">
                  <p className="font-display text-[clamp(1.6rem,1rem+2.4vw,2.8rem)] font-medium leading-tight tracking-tight">
                    La technologie mérite <span className="serif-accent">une autre expérience.</span>
                  </p>
                  <button onClick={close} autoFocus className="mt-7 rounded-full bg-eden-charcoal px-9 py-4 text-sm font-medium tracking-wide text-eden-porcelain shadow-[0_18px_40px_rgb(51_49_46/0.2)] transition hover:bg-eden-green-2">
                    Entrer dans EDEN
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* contrôles toujours accessibles */}
          <div className="absolute right-5 top-5 flex items-center gap-2 sm:right-8 sm:top-7">
            {mode === "full" && (
              <button onClick={toggleSound} className="rounded-full border border-eden-charcoal/15 bg-white/60 px-4 py-2 text-xs backdrop-blur hover:bg-white" aria-pressed={sound}>
                {sound ? "Couper le son" : "Activer le son"}
              </button>
            )}
            <button onClick={close} className="rounded-full border border-eden-charcoal/15 bg-white/60 px-4 py-2 text-xs font-medium backdrop-blur hover:bg-white">
              Passer l&apos;introduction
            </button>
          </div>
          {mode === "full" && phase < 3 && (
            <div className="absolute bottom-0 left-0 h-[2px] w-full bg-eden-charcoal/5">
              <div ref={bar} className="h-full w-0 bg-eden-gold" />
            </div>
          )}
          <style>{`@keyframes sweep{0%{background-position:150% 0}100%{background-position:-50% 0}}`}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
