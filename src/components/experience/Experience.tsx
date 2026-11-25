"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, type ComponentType, type MutableRefObject, type ReactNode } from "react";
import clsx from "clsx";
import { useScrollProgress, useDeviceTier } from "../three/useScrollProgress";
import { DeviceArt } from "../DeviceArt";

type SceneProps = { progress: MutableRefObject<number>; active: boolean; low: boolean };
const loading = () => null;
const SCENES: Record<string, ComponentType<SceneProps>> = {
  laptop: dynamic(() => import("../three/scenes/LaptopScene"), { ssr: false, loading }),
  phone: dynamic(() => import("../three/scenes/PhoneScene"), { ssr: false, loading }),
  audio: dynamic(() => import("../three/scenes/AudioScene"), { ssr: false, loading }),
  gaming: dynamic(() => import("../three/scenes/GamingScene"), { ssr: false, loading }),
  office: dynamic(() => import("../three/scenes/OfficeScene"), { ssr: false, loading }),
};

const FALLBACK_ART: Record<string, { kind: string; color: string }[]> = {
  laptop: [{ kind: "laptop", color: "#c9c6c0" }],
  phone: [{ kind: "phone", color: "#d8c4a0" }],
  audio: [{ kind: "earbuds", color: "#f7f5f0" }, { kind: "headphones", color: "#a7b9a5" }, { kind: "watch", color: "#d8c4a0" }],
  gaming: [{ kind: "controller", color: "#f7f5f0" }],
  office: [{ kind: "monitor", color: "#c9c6c0" }, { kind: "printer", color: "#f7f5f0" }],
};

export type Step = { title: string; text: string };

export function Experience({
  id,
  index,
  eyebrow,
  title,
  accent,
  steps,
  scene,
  tone = "ivory",
  children,
  next,
}: {
  id: string;
  index: string;
  eyebrow: string;
  title: string;
  accent: string;
  steps: Step[];
  scene: keyof typeof SCENES;
  tone?: "ivory" | "porcelain" | "sage";
  children: ReactNode; // sélection de produits réels
  next?: { href: string; label: string };
}) {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const { progress, step, near, visible } = useScrollProgress(track, steps.length);
  const tier = useDeviceTier();
  const Scene = SCENES[scene];

  // variable CSS --p mise à jour à chaque image (barres, voile de transition) sans rendu React
  useEffect(() => {
    if (!visible) return;
    let raf = 0;
    const loop = () => {
      stage.current?.style.setProperty("--p", progress.current.toFixed(4));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [visible, progress]);

  const bg = tone === "sage" ? "bg-[#eef1ea]" : tone === "porcelain" ? "bg-eden-porcelain" : "bg-eden-ivory";
  const static2D = tier === "none";

  return (
    <section id={id} className={clsx("relative", bg)} aria-labelledby={`${id}-title`}>
      <div ref={track} className={clsx("relative", static2D ? "" : "h-[260vh] md:h-[340vh]")}>
        <div ref={stage} className={clsx("relative overflow-hidden", static2D ? "py-20" : "sticky top-0 h-[100svh]")} style={{ ["--p" as string]: 0 }}>
          {/* scène 3D */}
          {!static2D && (
            <div className="absolute inset-0">{near && <Scene progress={progress} active={visible} low={tier === "low"} />}</div>
          )}
          {static2D && (
            <div className="mx-auto flex max-w-3xl justify-center gap-6 px-6">
              {FALLBACK_ART[scene].map((a) => (
                <DeviceArt key={a.kind} kind={a.kind} color={a.color} className="h-48 w-48" />
              ))}
            </div>
          )}

          {/* texte éditorial */}
          <div className={clsx("pointer-events-none relative z-10 mx-auto flex h-full max-w-7xl flex-col px-5 sm:px-8", static2D ? "mt-10" : "justify-end pb-10 md:justify-center md:pb-0")}>
            <div className="max-w-md rounded-[1.5rem] bg-eden-porcelain/70 p-5 backdrop-blur-md md:bg-transparent md:p-0 md:backdrop-blur-none">
              <p className="eyebrow">
                <span className="mr-3 text-eden-charcoal/40">{index}</span>
                {eyebrow}
              </p>
              <h2 id={`${id}-title`} className="mt-3 font-display text-[clamp(1.9rem,1.2rem+2.6vw,3.6rem)] font-medium leading-[1.02] tracking-[-0.03em] text-eden-charcoal">
                {title} <span className="serif-accent">{accent}</span>
              </h2>
              <div className="relative mt-6 min-h-[7.5rem]">
                {steps.map((s, i) => (
                  <div
                    key={s.title}
                    className={clsx(
                      "transition-all duration-700",
                      static2D ? "mb-4" : "absolute inset-x-0 top-0",
                      !static2D && (i === step ? "translate-y-0 opacity-100" : i < step ? "-translate-y-3 opacity-0" : "translate-y-3 opacity-0"),
                    )}
                  >
                    <p className="font-display text-lg font-medium text-eden-charcoal">{s.title}</p>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-eden-mute">{s.text}</p>
                  </div>
                ))}
              </div>
              {!static2D && (
                <div className="mt-6 flex items-center gap-3" aria-hidden>
                  <div className="h-px w-40 bg-eden-charcoal/10">
                    <div className="h-px bg-eden-charcoal" style={{ width: "calc(var(--p) * 100%)" }} />
                  </div>
                  <span className="text-xs tabular-nums text-eden-mute">
                    {String(step + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {!static2D && (
            <a href={`#${id}-selection`} className="absolute bottom-6 right-5 z-20 rounded-full border border-eden-charcoal/15 bg-eden-porcelain/80 px-4 py-2 text-xs font-medium text-eden-charcoal backdrop-blur transition hover:bg-white sm:right-8">
              Passer à la sélection ↓
            </a>
          )}
          {/* voile lumineux de transition vers la suite */}
          {!static2D && <div className="pointer-events-none absolute inset-0 z-[5] bg-eden-porcelain" style={{ opacity: "clamp(0, calc((var(--p) - 0.93) * 14), 1)" }} />}
        </div>
      </div>

      <div id={`${id}-selection`} className="relative scroll-mt-16 bg-eden-porcelain pb-20 pt-14">
        {children}
        {next && (
          <div className="mx-auto mt-4 max-w-7xl px-5 sm:px-8">
            <Link href={next.href} className="inline-flex items-center gap-2 text-sm font-medium text-eden-charcoal underline-offset-4 hover:underline">
              {next.label} <span aria-hidden>→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
