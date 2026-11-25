"use client";
import { useEffect, useRef, useState, type RefObject } from "react";

/** Progression 0→1 du défilement à travers un élément (GSAP ScrollTrigger), et visibilité proche. */
export function useScrollProgress(target: RefObject<HTMLElement | null>, steps = 1) {
  const progress = useRef(0);
  const [step, setStep] = useState(0);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    let kill: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        onUpdate: (self) => {
          progress.current = self.progress;
          const s = Math.min(steps - 1, Math.floor(self.progress * steps));
          setStep((prev) => (prev === s ? prev : s));
        },
      });
      kill = () => st.kill();
    })();
    // montage de la scène 3D seulement à l'approche, rendu seulement si visible
    const ioNear = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "100% 0px 100% 0px" });
    const ioVis = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 });
    ioNear.observe(el);
    ioVis.observe(el);
    return () => {
      cancelled = true;
      kill?.();
      ioNear.disconnect();
      ioVis.disconnect();
    };
  }, [target, steps]);

  return { progress, step, near, visible };
}

export function useDeviceTier() {
  const [tier, setTier] = useState<"high" | "low" | "none">("high");
  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let gl = false;
    try {
      const c = document.createElement("canvas");
      gl = Boolean(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {}
    const q = new URLSearchParams(window.location.search).get("rendu");
    if (q === "3d") return setTier("high");
    if (q === "2d" || !gl || reduce || nav.connection?.saveData) return setTier("none");
    const weak = (nav.deviceMemory ?? 8) <= 3 || (nav.hardwareConcurrency ?? 8) <= 4;
    const small = window.innerWidth < 768;
    setTier(weak || small ? "low" : "high");
  }, []);
  return tier;
}
