"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { DeviceArt } from "../DeviceArt";
import { useDeviceTier } from "../three/useScrollProgress";

const HeroScene = dynamic(() => import("../three/scenes/HeroScene"), { ssr: false });

export function Hero() {
  const tier = useDeviceTier();
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(true);
  const section = useRef<HTMLElement>(null);
  const scroll = useRef(0);

  // la 3D se charge après le premier affichage, sans bloquer la navigation
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const go = () => setReady(true);
    if (w.requestIdleCallback) w.requestIdleCallback(go, { timeout: 900 });
    else setTimeout(go, 250);
  }, []);

  useEffect(() => {
    if (!section.current) return;
    let kill: (() => void) | undefined;
    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      const st = ScrollTrigger.create({ trigger: section.current, start: "top top", end: "bottom top", scrub: true, onUpdate: (s) => (scroll.current = s.progress) });
      const fade = gsap.to("[data-hero-copy]", { y: -50, opacity: 0, ease: "none", scrollTrigger: { trigger: section.current, start: "30% top", end: "bottom top", scrub: true } });
      kill = () => {
        st.kill();
        fade.scrollTrigger?.kill();
        fade.kill();
      };
    })();
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0 });
    io.observe(section.current);
    return () => {
      kill?.();
      io.disconnect();
    };
  }, []);

  const use3D = ready && tier !== "none";

  return (
    <section ref={section} className="relative isolate overflow-hidden bg-eden-ivory">
      {/* lumière de studio */}
      <div className="pointer-events-none absolute inset-0 -z-10">
              </div>
      <div className="pointer-events-none absolute bottom-0 left-0 z-10 h-24 w-full bg-gradient-to-b from-transparent to-eden-porcelain" />

      <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl grid-rows-[1fr_auto] items-center px-5 pb-16 pt-4 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-6 lg:grid-rows-1 lg:pb-20">
        <div data-hero-copy className="relative z-10 order-2 lg:order-1">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.8 }} className="eyebrow">
            Technology, beautifully discovered.
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1, ease: [0.2, 0.7, 0.2, 1] }}
            className="mt-5 font-display text-[clamp(2.5rem,1.4rem+3.4vw,4.4rem)] font-medium leading-[1] tracking-[-0.04em] text-eden-charcoal"
          >
            La technologie mérite <span className="serif-accent">une autre expérience.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }} className="mt-6 max-w-md text-[17px] leading-relaxed text-eden-mute">
            Découvrez les produits qui correspondent à vos envies et à votre budget.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="mt-9 flex flex-wrap gap-3">
            <a href="#experiences" className="inline-flex items-center gap-3 rounded-full bg-eden-charcoal px-7 py-4 text-sm font-medium text-eden-porcelain shadow-[0_14px_34px_rgb(51_49_46/0.18)] transition hover:bg-eden-green-2">
              Explorer EDEN <span aria-hidden>↓</span>
            </a>
            <Link href="/trouver" className="inline-flex items-center gap-2 rounded-full border border-eden-charcoal/15 bg-white/60 px-7 py-4 text-sm font-medium text-eden-charcoal backdrop-blur transition hover:border-eden-charcoal">
              Trouver mon produit
            </Link>
          </motion.div>
          <div className="mt-10 hidden items-center gap-6 text-xs text-eden-mute lg:flex">
            <span>Vendeurs vérifiés</span>
            <span className="h-3 w-px bg-eden-charcoal/15" />
            <span>Disponibilité confirmée</span>
            <span className="h-3 w-px bg-eden-charcoal/15" />
            <span>Livraison suivie à Lomé</span>
          </div>
        </div>

        <div className="relative order-1 h-[52svh] min-h-[320px] lg:order-2 lg:h-[82svh]">
          {use3D ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }} className="absolute inset-0 lg:-right-[max(2rem,calc((100vw-80rem)/2+2rem))]">
              <HeroScene scroll={scroll} active={active} />
            </motion.div>
          ) : (
            <Hero2D />
          )}
          {use3D && <p className="pointer-events-none absolute bottom-2 right-0 hidden text-[11px] tracking-wide text-eden-mute lg:block">Touchez un produit pour ouvrir sa catégorie</p>}
        </div>
      </div>
    </section>
  );
}

function Hero2D() {
  const items = [
    { k: "laptop", c: "#c9c6c0", cls: "right-[2%] top-[38%] w-[30%]", href: "/boutique?categorie=ordinateurs" },
    { k: "phone", c: "#d8c4a0", cls: "left-[6%] top-[10%] w-[18%] -rotate-12", href: "/boutique?categorie=smartphones" },
    { k: "headphones", c: "#a7b9a5", cls: "right-[10%] top-[4%] w-[22%] rotate-6", href: "/boutique?categorie=casques" },
    { k: "watch", c: "#d8c4a0", cls: "right-[22%] bottom-[4%] w-[15%]", href: "/boutique?categorie=montres" },
    { k: "earbuds", c: "#f7f5f0", cls: "left-[10%] bottom-[8%] w-[17%]", href: "/boutique?categorie=ecouteurs" },
  ];
  return (
    <div className="absolute inset-0">
      <div className="absolute left-1/2 top-1/2 w-[34%] max-w-[240px] -translate-x-1/2 -translate-y-1/2">
        <Image src="/brand/eden-logo.webp" alt="La pomme EDEN" width={394} height={512} priority className="h-auto w-full drop-shadow-[0_30px_30px_rgba(74,63,48,0.18)]" />
      </div>
      {items.map((it) => (
        <Link key={it.k} href={it.href} className={`absolute ${it.cls} transition duration-500 hover:-translate-y-1 hover:scale-105`} aria-label={it.k}>
          <DeviceArt kind={it.k} color={it.c} className="h-auto w-full drop-shadow-[0_18px_18px_rgba(74,63,48,0.15)]" />
        </Link>
      ))}
    </div>
  );
}
