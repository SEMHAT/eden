"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { RECIPIENTS, OCCASIONS, PREFERENCES } from "@/lib/gift";
import { fcfa } from "@/lib/format";

const BUDGETS = [15000, 30000, 50000, 100000, 200000, 400000];

export function GiftWizard({ initial }: { initial?: { recipient?: string; occasion?: string; budget?: number; prefs?: string[] } }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [recipient, setRecipient] = useState(initial?.recipient ?? "");
  const [occasion, setOccasion] = useState(initial?.occasion ?? "");
  const [budget, setBudget] = useState(initial?.budget ?? 50000);
  const [prefs, setPrefs] = useState<string[]>(initial?.prefs ?? []);

  const steps = ["Destinataire", "Occasion", "Budget", "Goûts"];
  const canNext = [Boolean(recipient), Boolean(occasion), budget >= 5000, true][step];

  const finish = () => {
    const q = new URLSearchParams({ pour: recipient, occasion, budget: String(budget) });
    if (prefs.length) q.set("gouts", prefs.join(","));
    router.push(`/eden-gift?${q}#selection`);
  };

  const option = (active: boolean) =>
    clsx("rounded-2xl border px-4 py-4 text-left text-sm font-medium transition", active ? "border-eden-gold bg-eden-gold/15 text-eden-ivory" : "border-white/15 bg-white/5 text-eden-ivory/85 hover:border-eden-gold/60");

  return (
    <div className="rounded-[2rem] bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur sm:p-8">
      <ol className="flex gap-2" aria-label="Étapes">
        {steps.map((s, i) => (
          <li key={s} className="flex-1">
            <div className={clsx("h-1 rounded-full", i <= step ? "bg-eden-gold" : "bg-white/15")} />
            <p className={clsx("mt-2 hidden text-xs sm:block", i === step ? "text-eden-gold" : "text-eden-ivory/50")}>{i + 1}. {s}</p>
          </li>
        ))}
      </ol>

      <div className="mt-6 min-h-64">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            {step === 0 && (
              <fieldset>
                <legend className="font-display text-2xl font-semibold">À qui offrez-vous ce cadeau ?</legend>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {RECIPIENTS.map((r) => (
                    <button key={r.id} type="button" className={option(recipient === r.id)} aria-pressed={recipient === r.id} onClick={() => setRecipient(r.id)}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
            {step === 1 && (
              <fieldset>
                <legend className="font-display text-2xl font-semibold">Pour quelle occasion ?</legend>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {OCCASIONS.map((o) => (
                    <button key={o.id} type="button" className={option(occasion === o.id)} aria-pressed={occasion === o.id} onClick={() => setOccasion(o.id)}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
            {step === 2 && (
              <fieldset>
                <legend className="font-display text-2xl font-semibold">Quel budget ?</legend>
                <p className="mt-4 font-display text-4xl font-bold text-eden-gold">{fcfa(budget)}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {BUDGETS.map((b) => (
                    <button key={b} type="button" className={clsx("rounded-full border px-4 py-2 text-sm", budget === b ? "border-eden-gold bg-eden-gold text-eden-green" : "border-white/20 hover:border-eden-gold")} onClick={() => setBudget(b)}>
                      {fcfa(b)}
                    </button>
                  ))}
                </div>
                <label className="mt-4 block max-w-xs text-sm text-eden-ivory/70">
                  Ou un montant précis
                  <input inputMode="numeric" value={budget} onChange={(e) => setBudget(parseInt(e.target.value.replace(/\D/g, "") || "0", 10))} className="mt-1 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-eden-ivory outline-none focus:border-eden-gold" />
                </label>
              </fieldset>
            )}
            {step === 3 && (
              <fieldset>
                <legend className="font-display text-2xl font-semibold">Qu&apos;est-ce qui lui plaît ?</legend>
                <p className="mt-1 text-sm text-eden-ivory/60">Plusieurs choix possibles, ou aucun.</p>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {PREFERENCES.map((p) => {
                    const on = prefs.includes(p.id);
                    return (
                      <button key={p.id} type="button" className={option(on)} aria-pressed={on} onClick={() => setPrefs((x) => (on ? x.filter((y) => y !== p.id) : [...x, p.id]))}>
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} className={clsx("text-sm text-eden-ivory/70 hover:text-eden-ivory", step === 0 && "invisible")}>
          ← Retour
        </button>
        {step < 3 ? (
          <button type="button" disabled={!canNext} onClick={() => setStep((s) => s + 1)} className="rounded-full bg-eden-gold px-6 py-3 text-sm font-semibold text-eden-green disabled:opacity-40">
            Continuer
          </button>
        ) : (
          <button type="button" onClick={finish} className="rounded-full bg-eden-gold px-6 py-3 text-sm font-semibold text-eden-green">
            Voir la sélection →
          </button>
        )}
      </div>
    </div>
  );
}
