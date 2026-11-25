"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { fcfa } from "@/lib/format";

const CATS = [
  { slug: "", label: "Tout" },
  { slug: "smartphones", label: "Smartphones" },
  { slug: "ordinateurs", label: "Ordinateurs" },
  { slug: "audio-accessoires", label: "Audio" },
  { slug: "gaming", label: "Gaming" },
  { slug: "energie", label: "Énergie" },
  { slug: "bureau", label: "Bureau" },
];

const MIN = 10000;
const MAX = 1000000;
// échelle non linéaire : plus de précision sur les petits budgets
const toBudget = (t: number) => Math.round((MIN * Math.pow(MAX / MIN, t / 1000)) / 5000) * 5000;
const toSlider = (b: number) => Math.round((1000 * Math.log(Math.max(MIN, Math.min(MAX, b)) / MIN)) / Math.log(MAX / MIN));

export function BudgetBar({ variant = "home" }: { variant?: "home" | "page" }) {
  const router = useRouter();
  const [budget, setBudget] = useState(250000);
  const [cat, setCat] = useState("");
  const [need, setNeed] = useState("");
  const pct = `${toSlider(budget) / 10}%`;

  const submit = () => {
    const p = new URLSearchParams({ budget: String(budget) });
    if (cat) p.set("categorie", cat);
    if (need.trim()) p.set("besoin", need.trim());
    router.push(`/trouver?${p.toString()}`);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={clsx("rounded-[2rem] bg-white p-5 shadow-[var(--shadow-lift)] sm:p-7", variant === "home" && "ring-1 ring-eden-gold/20")}
      aria-label="Recherche par budget"
    >
      <div className="grid items-center gap-6 lg:grid-cols-[auto_1fr_auto]">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-eden-green text-eden-gold">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M8 18h2M12 18h4" /></svg>
          </span>
          <h2 className="font-display text-lg font-semibold">Quel est votre budget ?</h2>
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label className="sr-only" htmlFor="budget-amount">Montant en FCFA</label>
            <div className="flex items-baseline gap-2">
              <input
                id="budget-amount"
                inputMode="numeric"
                value={budget.toLocaleString("fr-FR").replace(/ | /g, " ")}
                onChange={(e) => {
                  const n = parseInt(e.target.value.replace(/\D/g, "") || "0", 10);
                  setBudget(Math.min(5_000_000, n));
                }}
                className="w-40 bg-transparent font-display text-3xl font-bold tabular-nums text-eden-green outline-none sm:w-48"
              />
              <span className="font-display text-lg font-semibold text-eden-green">FCFA</span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={1000}
            value={toSlider(budget)}
            onChange={(e) => setBudget(toBudget(Number(e.target.value)))}
            className="eden-range mt-3 w-full"
            style={{ ["--pct" as string]: pct }}
            aria-label="Curseur de budget"
          />
          <div className="mt-1 flex justify-between text-xs text-eden-mute">
            <span>{fcfa(MIN)}</span>
            <span>{fcfa(MAX)} et plus</span>
          </div>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-full bg-eden-green px-7 py-4 text-sm font-semibold text-eden-ivory transition hover:bg-eden-green-2">
          Voir les produits →
        </button>
      </div>
      <div className="mt-5 flex flex-col gap-4 border-t border-eden-charcoal/5 pt-5 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Catégorie">
          {CATS.map((c) => (
            <button
              type="button"
              key={c.slug}
              onClick={() => setCat(c.slug)}
              aria-pressed={cat === c.slug}
              className={clsx("rounded-full border px-3.5 py-1.5 text-sm transition", cat === c.slug ? "border-eden-green bg-eden-green text-eden-ivory" : "border-eden-charcoal/15 hover:border-eden-green")}
            >
              {c.label}
            </button>
          ))}
        </div>
        <label className="flex-1">
          <span className="sr-only">Votre besoin</span>
          <input
            value={need}
            onChange={(e) => setNeed(e.target.value)}
            placeholder="Votre besoin, par exemple : programmer et faire du montage vidéo"
            className="w-full rounded-full border border-eden-charcoal/15 bg-eden-ivory/50 px-4 py-2.5 text-sm outline-none focus:border-eden-green"
          />
        </label>
      </div>
    </form>
  );
}
