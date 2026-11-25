"use client";
import { useRef, type ReactNode } from "react";

/** Étagère horizontale : glissement au doigt, flèches discrètes sur ordinateur. */
export function Shelf({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * (ref.current.clientWidth * 0.8), behavior: "smooth" });
  return (
    <div className="relative">
      <div ref={ref} className="shelf mx-auto max-w-7xl sm:px-8" role="region" aria-label={label} tabIndex={0}>
        {children}
      </div>
      <div className="pointer-events-none absolute -top-14 right-5 hidden gap-2 sm:right-8 md:flex">
        {([-1, 1] as const).map((d) => (
          <button
            key={d}
            onClick={() => move(d)}
            className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-white text-eden-green shadow-[var(--shadow-soft)] transition hover:bg-eden-green hover:text-eden-ivory"
            aria-label={d === 1 ? "Suivant" : "Précédent"}
          >
            {d === 1 ? "→" : "←"}
          </button>
        ))}
      </div>
    </div>
  );
}
