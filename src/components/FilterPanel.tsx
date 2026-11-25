"use client";
import { useEffect, useRef, type ReactNode } from "react";

/** Filtres repliés sur mobile, ouverts sur ordinateur. */
export function FilterPanel({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (ref.current && window.matchMedia("(min-width: 1024px)").matches) ref.current.open = true;
  }, []);
  return (
    <details ref={ref} className="group rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-soft)] lg:self-start">
      <summary className="flex cursor-pointer list-none items-center justify-between font-display font-semibold">
        {summary}
        <span className="text-eden-mute transition group-open:rotate-180">⌄</span>
      </summary>
      {children}
    </details>
  );
}
