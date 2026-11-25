"use client";
import { useRef, type ReactNode } from "react";

/** Applique automatiquement les cases et listes des filtres (le bouton reste là sans JavaScript). */
export function AutoSubmit({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onChange={(e) => {
        const t = e.target as HTMLInputElement;
        if (t.type === "checkbox" || t.tagName === "SELECT") t.form?.requestSubmit();
      }}
    >
      {children}
    </div>
  );
}
