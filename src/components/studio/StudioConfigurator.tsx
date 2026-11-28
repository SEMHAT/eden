"use client";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import clsx from "clsx";
import { saveCustomization } from "@/actions/cart";
import { fcfa } from "@/lib/format";
import {
  ACCESSORIES,
  CASE_STYLES,
  COLORS,
  MAX_TEXT,
  PATTERNS,
  SKIN_FINISHES,
  SLEEVES,
  TEXT_PRICE,
  customFee,
  describe,
  type Customization,
} from "@/lib/custom";

const CustomPreview = dynamic(() => import("../three/CustomPreview"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-eden-mute">Préparation de l&apos;aperçu 3D…</div>,
});

type Product = { id: string; slug: string; name: string; price: number | null; available: boolean };

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-eden-charcoal/[0.08] py-6 first:border-0 first:pt-0">
      <h2 className="flex items-baseline gap-3 font-display text-base font-medium">
        <span className="font-serif text-lg italic text-eden-gold-2">{n}</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Choice({ active, onClick, label, price, note }: { active: boolean; onClick: () => void; label: string; price?: number; note?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "flex w-full flex-col items-start rounded-2xl border px-4 py-3 text-left text-sm transition",
        active ? "border-eden-charcoal bg-white shadow-[var(--shadow-soft)]" : "border-eden-charcoal/10 bg-white/50 hover:border-eden-charcoal/30",
      )}
    >
      <span className="font-medium">{label}</span>
      <span className={clsx("mt-0.5 text-xs", price ? "text-eden-mute" : "text-[#4d6b54]")}>{note ?? (price ? `+ ${fcfa(price)}` : "Inclus")}</span>
    </button>
  );
}

function Swatches({ value, onChange, label }: { value: string; onChange: (id: string) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2.5">
      {COLORS.map((c) => (
        <button
          key={c.id}
          type="button"
          role="radio"
          aria-checked={value === c.id}
          aria-label={c.label}
          title={c.label}
          onClick={() => onChange(c.id)}
          className={clsx("h-10 w-10 rounded-full ring-offset-2 ring-offset-eden-ivory transition", value === c.id ? "ring-2 ring-eden-charcoal" : "ring-1 ring-eden-charcoal/15 hover:ring-eden-charcoal/40")}
          style={{ background: c.hex }}
        />
      ))}
    </div>
  );
}

export function Studio({ product, initial, inCart }: { product: Product; initial: Customization; inCart: boolean }) {
  const [c, setC] = useState<Customization>(initial);
  const [view, setView] = useState<"front" | "back">("back");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const set = (patch: Partial<Customization>) => setC((x) => ({ ...x, ...patch }));
  const phone = c.kind === "phone";
  const fee = customFee(c);
  const total = (product.price ?? 0) + fee;

  const save = () =>
    start(async () => {
      setError(null);
      const r = await saveCustomization(product.id, c);
      if (r?.error) setError(r.error);
      else router.push("/panier");
    });

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-5 pb-16 pt-4 sm:px-8 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
      {/* aperçu : collé en haut de l'écran sur mobile pour voir chaque changement */}
      <div className="contents lg:sticky lg:top-20 lg:block lg:self-start">
        <div>
          <p className="eyebrow">Eden Studio</p>
          <h1 className="mt-2 font-display text-[clamp(1.8rem,1.2rem+2vw,3rem)] font-medium leading-tight tracking-[-0.03em]">
            Rendez-le <span className="serif-accent">unique.</span>
          </h1>
          <p className="mt-1 text-sm text-eden-mute">{product.name}</p>
        </div>
        <div className="sticky top-16 z-20 -mx-5 bg-eden-ivory px-5 pb-2 pt-2 lg:static lg:mx-0 lg:mt-5 lg:p-0">
        <div className="relative h-[34svh] overflow-hidden rounded-[2rem] bg-eden-ivory ring-1 ring-eden-charcoal/[0.06] lg:aspect-[4/3.4] lg:h-auto">
          <CustomPreview c={c} view={view} />
          <div className="absolute left-4 top-4 flex rounded-full bg-white/80 p-1 text-xs backdrop-blur">
            {(["back", "front"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={clsx("rounded-full px-3 py-1.5", view === v ? "bg-eden-charcoal text-eden-porcelain" : "text-eden-charcoal")}>
                {v === "back" ? (phone ? "Dos" : "Capot") : "Face"}
              </button>
            ))}
          </div>
          <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-[11px] text-eden-mute">Faites glisser pour tourner · aperçu indicatif</p>
        </div>
        </div>
      </div>

      {/* options */}
      <div className="rounded-[2rem] bg-eden-porcelain p-5 shadow-[var(--shadow-soft)] sm:p-8">
        <Section n={1} title={phone ? "La coque" : "Le capot"}>
          <div className="grid grid-cols-2 gap-2.5">
            {(phone ? CASE_STYLES : SKIN_FINISHES).map((o) => (
              <Choice key={o.id} active={c.style === o.id} onClick={() => set({ style: o.id })} label={o.label} price={o.price} note={o.note} />
            ))}
          </div>
        </Section>
        <Section n={2} title="La couleur">
          <Swatches value={c.color} onChange={(color) => set({ color })} label="Couleur" />
        </Section>
        <Section n={3} title="Le motif">
          <div className="flex flex-wrap gap-2">
            {PATTERNS.map((p) => (
              <button key={p.id} type="button" onClick={() => set({ pattern: p.id })} aria-pressed={c.pattern === p.id} className={clsx("rounded-full border px-4 py-2 text-sm transition", c.pattern === p.id ? "border-eden-charcoal bg-eden-charcoal text-eden-porcelain" : "border-eden-charcoal/15 bg-white hover:border-eden-charcoal/40")}>
                {p.label}
              </button>
            ))}
          </div>
        </Section>
        <Section n={4} title="Votre inscription">
          <label className="block">
            <span className="sr-only">Inscription</span>
            <input
              value={c.text}
              maxLength={MAX_TEXT}
              onChange={(e) => set({ text: e.target.value })}
              placeholder="Initiales, prénom…"
              className="w-full rounded-xl border border-eden-charcoal/15 bg-white px-4 py-3 font-serif text-lg italic outline-none focus:border-eden-botanical"
            />
          </label>
          <p className="mt-1.5 text-xs text-eden-mute">{MAX_TEXT} caractères maximum · + {fcfa(TEXT_PRICE)}</p>
        </Section>
        {!phone && (
          <Section n={5} title="La pochette">
            <div className="grid grid-cols-3 gap-2.5">
              {SLEEVES.map((o) => (
                <Choice key={o.id} active={c.sleeve === o.id} onClick={() => set({ sleeve: o.id })} label={o.label} price={o.price} note={o.note} />
              ))}
            </div>
            {c.sleeve !== "aucune" && (
              <div className="mt-4">
                <Swatches value={c.sleeveColor ?? "graphite"} onChange={(sleeveColor) => set({ sleeveColor })} label="Couleur de la pochette" />
              </div>
            )}
          </Section>
        )}
        <Section n={phone ? 5 : 6} title="Les accessoires assortis">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {ACCESSORIES[c.kind].map((o) => {
              const on = c.accessories.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set({ accessories: on ? c.accessories.filter((x) => x !== o.id) : [...c.accessories, o.id] })}
                  className={clsx("flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition", on ? "border-eden-charcoal bg-white" : "border-eden-charcoal/10 bg-white/50 hover:border-eden-charcoal/30")}
                >
                  <span>
                    <span className="block font-medium">{o.label}</span>
                    <span className="text-xs text-eden-mute">+ {fcfa(o.price)}</span>
                  </span>
                  <span className={clsx("grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs", on ? "border-eden-charcoal bg-eden-charcoal text-eden-porcelain" : "border-eden-charcoal/25")}>{on ? "✓" : "+"}</span>
                </button>
              );
            })}
          </div>
        </Section>

        <div className="mt-2 rounded-2xl bg-eden-ivory p-5">
          <ul className="space-y-1 text-sm text-eden-mute">
            {describe(c).map((l) => (
              <li key={l}>· {l}</li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-eden-charcoal/10 pt-4 text-sm">
            <div className="flex justify-between"><dt>{product.name}</dt><dd>{product.price !== null ? fcfa(product.price) : "—"}</dd></div>
            <div className="flex justify-between"><dt>Personnalisation</dt><dd>{fee ? `+ ${fcfa(fee)}` : "Offerte"}</dd></div>
            <div className="flex justify-between pt-2 text-base font-semibold"><dt>Total</dt><dd>{fcfa(total)}</dd></div>
          </dl>
          {error && <p role="alert" className="mt-3 text-sm text-eden-red">{error}</p>}
          <button onClick={save} disabled={pending || !product.available} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-eden-charcoal py-4 text-sm font-medium text-eden-porcelain transition hover:bg-eden-green-2 disabled:opacity-50">
            {pending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-eden-porcelain/40 border-t-eden-porcelain" />}
            {!product.available ? "Produit indisponible" : inCart ? "Mettre à jour mon panier" : "Ajouter au panier personnalisé"}
          </button>
          <p className="mt-3 text-center text-xs text-eden-mute">La personnalisation est réalisée par Eden avant la livraison.</p>
        </div>
      </div>
    </div>
  );
}
