"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { DeviceArt } from "../DeviceArt";

const Scene3D = dynamic(() => import("./Scene3D"), { ssr: false });

type Mode = "pending" | "3d" | "2d";

function canRender3D() {
  if (typeof window === "undefined") return false;
  const q = new URLSearchParams(window.location.search);
  if (q.get("rendu") === "3d") return true;
  if (q.get("rendu") === "2d") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return false;
  if ((nav.deviceMemory ?? 8) <= 2 || (nav.hardwareConcurrency ?? 8) <= 2) return false;
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function Hero() {
  const [mode, setMode] = useState<Mode>("pending");
  const [active, setActive] = useState(true);
  const section = useRef<HTMLElement>(null);
  const scroll = useRef(0);

  // la 3D se charge après le premier affichage, sans bloquer la navigation
  useEffect(() => {
    const decide = () => setMode(canRender3D() ? "3d" : "2d");
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(decide, { timeout: 1200 });
    else setTimeout(decide, 300);
  }, []);

  // synchronisation avec le défilement (GSAP ScrollTrigger) et pause hors écran
  useEffect(() => {
    if (!section.current) return;
    let kill: (() => void) | undefined;
    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      const st = ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => (scroll.current = self.progress),
      });
      const fade = gsap.to("[data-hero-copy]", { y: -60, opacity: 0.2, ease: "none", scrollTrigger: { trigger: section.current, start: "top top", end: "bottom top", scrub: true } });
      kill = () => {
        st.kill();
        fade.scrollTrigger?.kill();
        fade.kill();
      };
    })();
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0.02 });
    io.observe(section.current);
    return () => {
      kill?.();
      io.disconnect();
    };
  }, []);

  return (
    <section ref={section} className="relative isolate overflow-hidden bg-eden-green text-eden-ivory">
      {/* décor : lueur dorée et collines */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10%] top-[-20%] h-[80vh] w-[80vh] rounded-full bg-[radial-gradient(circle,rgba(217,179,106,0.35),transparent_60%)] blur-2xl" />
        <div className="absolute left-[-20%] top-[30%] h-[60vh] w-[60vh] rounded-full bg-[radial-gradient(circle,rgba(20,92,61,0.9),transparent_65%)]" />
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden>
          <path d="M0 120 C 240 60, 480 150, 720 100 S 1200 40, 1440 110 L1440 160 L0 160Z" fill="#0b4d31" />
          <path d="M0 140 C 300 100, 600 170, 900 130 S 1300 110, 1440 140 L1440 160 L0 160Z" fill="#F8F3E9" />
        </svg>
      </div>

      <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl grid-rows-[auto_1fr] items-center gap-4 px-5 pb-28 pt-6 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:grid-rows-1 lg:pb-32">
        <div data-hero-copy className="relative z-10 order-2 lg:order-1">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-4 inline-flex items-center gap-2 rounded-full border border-eden-gold/30 bg-white/5 px-3 py-1 text-xs tracking-wide text-eden-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-eden-gold" /> Dis-nous ton budget. On s&apos;occupe du reste.
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }} className="font-display text-[clamp(2.5rem,1.2rem+4.3vw,4.6rem)] font-bold leading-[0.98] tracking-[-0.035em]">
            La tech qui
            <br />
            <span className="gold-text">vous ressemble.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.7 }} className="mt-3 font-display text-xl font-medium text-eden-ivory/90 sm:text-2xl">
            Au prix qui vous convient.
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-5 max-w-md text-base text-eden-ivory/75 sm:text-lg">
            Dites-nous votre budget. Eden trouve le bon produit pour vous.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-8 flex flex-wrap gap-3">
            <Link href="/trouver" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[#ecd197] to-eden-gold px-6 py-3.5 text-sm font-semibold text-eden-green shadow-[0_8px_30px_rgb(217_179_106/0.35)] transition hover:brightness-105">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              Trouver mon produit →
            </Link>
            <Link href="/boutique" className="inline-flex items-center gap-2 rounded-full border border-eden-gold/60 px-6 py-3.5 text-sm font-semibold transition hover:bg-eden-gold/10">
              Explorer la boutique
            </Link>
          </motion.div>
        </div>

        <div className="relative order-1 h-[46svh] min-h-[300px] w-full lg:order-2 lg:h-[78svh]">
          {mode === "3d" ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="absolute inset-0 lg:-right-24 lg:-left-10">
              <Scene3D scroll={scroll} active={active} />
            </motion.div>
          ) : (
            <Hero2D loading={mode === "pending"} />
          )}
          {mode === "3d" && (
            <p className="pointer-events-none absolute bottom-0 right-0 hidden text-xs text-eden-ivory/50 lg:block">Touchez un appareil pour explorer sa catégorie</p>
          )}
        </div>
      </div>
    </section>
  );
}

/** Rendu de secours sans 3D : léger, animé en CSS seulement si le mouvement est autorisé. */
function Hero2D({ loading }: { loading: boolean }) {
  const items = [
    { k: "phone", c: "#2a2a2a", cls: "left-[4%] top-[6%] w-[22%] -rotate-12", href: "/boutique?categorie=smartphones" },
    { k: "headphones", c: "#1e1e1e", cls: "right-[6%] top-[2%] w-[22%] rotate-6", href: "/boutique?categorie=casques" },
    { k: "laptop", c: "#a9adb1", cls: "right-[0%] top-[36%] w-[30%]", href: "/boutique?categorie=ordinateurs" },
    { k: "controller", c: "#151716", cls: "left-[2%] bottom-[14%] w-[24%] rotate-12", href: "/boutique?categorie=gaming" },
    { k: "watch", c: "#1d1f1e", cls: "right-[10%] bottom-[8%] w-[16%] -rotate-6", href: "/boutique?categorie=montres" },
    { k: "earbuds", c: "#f4f2ee", cls: "left-[18%] top-[2%] w-[14%]", href: "/boutique?categorie=ecouteurs" },
  ];
  return (
    <div className="absolute inset-0">
      <div className="absolute left-1/2 top-1/2 aspect-square w-[78%] max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-eden-gold/40 motion-safe:animate-[spin_40s_linear_infinite]" />
      <div className="absolute left-1/2 top-1/2 aspect-square w-[62%] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rotate-[70deg] rounded-full border border-eden-gold/25" />
      <div className="absolute left-1/2 top-1/2 w-[38%] max-w-[260px] -translate-x-1/2 -translate-y-[56%]">
        <Image src="/brand/eden-logo.webp" alt="La pomme Eden" width={380} height={512} priority className="h-auto w-full drop-shadow-[0_30px_40px_rgba(0,0,0,0.45)]" />
      </div>
      {!loading &&
        items.map((it, i) => (
          <Link key={it.k} href={it.href} className={`absolute ${it.cls} transition hover:scale-110 motion-safe:animate-[float_6s_ease-in-out_infinite]`} style={{ animationDelay: `${i * 0.7}s` }} aria-label={it.k}>
            <DeviceArt kind={it.k} color={it.c} className="h-auto w-full drop-shadow-[0_16px_20px_rgba(0,0,0,0.35)]" />
          </Link>
        ))}
      <style>{`@keyframes float{0%,100%{translate:0 0}50%{translate:0 -10px}}`}</style>
    </div>
  );
}
