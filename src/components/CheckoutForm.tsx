"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import clsx from "clsx";
import { placeOrder } from "@/actions/shop";
import { computeTotals } from "@/lib/pricing";
import { fcfa, DELIVERY_LABEL, PAYMENT_LABEL } from "@/lib/format";
import { Input, Label, Textarea } from "./ui";

type Method = { method: "CASH_ON_DELIVERY" | "MOBILE_MONEY" | "CARD"; enabled: boolean; note?: string };
type Addr = { id: string; label: string; city: string; district: string; details: string; phone: string };

function Submit({ total }: { total: number }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-full bg-eden-green py-4 text-sm font-semibold text-eden-ivory transition hover:bg-eden-green-2 disabled:opacity-60">
      {pending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-eden-ivory/40 border-t-eden-ivory" />}
      Confirmer la commande · {fcfa(total)}
    </button>
  );
}

export function CheckoutForm(props: {
  token: string;
  signedIn: boolean;
  defaults: { name: string; phone: string; email: string; city: string; district: string; note: string };
  addresses: Addr[];
  lines: { name: string; quantity: number; price: number }[];
  subtotal: number;
  customFees: number;
  promoPercent: number;
  giftWrap: boolean;
  fees: { PICKUP: number; STANDARD: number; EXPRESS: number };
  methods: Method[];
}) {
  const [state, action] = useActionState(placeOrder, null);
  const [mode, setMode] = useState<"PICKUP" | "STANDARD" | "EXPRESS">("STANDARD");
  const [addr, setAddr] = useState(props.defaults);
  const t = computeTotals({ subtotal: props.subtotal, deliveryFee: props.fees[mode], promoPercent: props.promoPercent, giftWrap: props.giftWrap, customFees: props.customFees });
  const firstEnabled = props.methods.find((m) => m.enabled)?.method ?? "CASH_ON_DELIVERY";

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <input type="hidden" name="checkoutToken" value={props.token} />
      <div className="space-y-6">
        {!props.signedIn && (
          <p className="rounded-2xl bg-white p-4 text-sm shadow-[var(--shadow-soft)]">
            Vous avez un compte ? <Link href="/connexion?suite=/commande" className="font-semibold text-eden-green underline">Connectez-vous</Link> pour retrouver vos adresses et suivre vos commandes. Sinon, continuez sans compte.
          </p>
        )}

        <fieldset className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-soft)]">
          <legend className="sr-only">Vos coordonnées</legend>
          <p className="font-display text-lg font-semibold">1. Vos coordonnées</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label>
              <Label>Nom complet</Label>
              <Input name="customerName" required defaultValue={props.defaults.name} autoComplete="name" />
            </label>
            <label>
              <Label>Téléphone</Label>
              <Input name="customerPhone" type="tel" required value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} placeholder="+228 90 00 00 00" autoComplete="tel" />
            </label>
            <label className="sm:col-span-2">
              <Label hint="(optionnel, pour recevoir le suivi)">E-mail</Label>
              <Input name="customerEmail" type="email" defaultValue={props.defaults.email} autoComplete="email" />
            </label>
          </div>
        </fieldset>

        <fieldset className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-soft)]">
          <legend className="sr-only">Livraison</legend>
          <p className="font-display text-lg font-semibold">2. Livraison</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(["STANDARD", "EXPRESS", "PICKUP"] as const).map((m) => (
              <label key={m} className={clsx("cursor-pointer rounded-2xl border p-4 text-sm transition", mode === m ? "border-eden-green bg-eden-green/5" : "border-eden-charcoal/15 hover:border-eden-green/50")}>
                <input type="radio" name="deliveryMode" value={m} checked={mode === m} onChange={() => setMode(m)} className="sr-only" />
                <span className="block font-semibold">{DELIVERY_LABEL[m]}</span>
                <span className="mt-1 block text-eden-mute">{props.fees[m] === 0 ? "Gratuit" : fcfa(props.fees[m])}</span>
              </label>
            ))}
          </div>
          {props.addresses.length > 0 && mode !== "PICKUP" && (
            <div className="mt-4 flex flex-wrap gap-2">
              {props.addresses.map((a) => (
                <button key={a.id} type="button" onClick={() => setAddr({ ...addr, city: a.city, district: a.district, note: a.details, phone: a.phone })} className="rounded-full border border-eden-charcoal/15 px-3 py-1.5 text-xs hover:border-eden-green">
                  {a.label} · {a.district}
                </button>
              ))}
            </div>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label>
              <Label>Ville</Label>
              <Input name="city" required value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} autoComplete="address-level2" />
            </label>
            {mode !== "PICKUP" && (
              <label>
                <Label>Quartier</Label>
                <Input name="district" required value={addr.district} onChange={(e) => setAddr({ ...addr, district: e.target.value })} placeholder="Tokoin, Bè, Adidogomé…" />
              </label>
            )}
            {mode !== "PICKUP" && (
              <label className="sm:col-span-2">
                <Label hint="(optionnel)">Indications pour le livreur</Label>
                <Textarea name="addressNote" className="min-h-20" value={addr.note} onChange={(e) => setAddr({ ...addr, note: e.target.value })} placeholder="Repère, portail, étage…" />
              </label>
            )}
          </div>
        </fieldset>

        <fieldset className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-soft)]">
          <legend className="sr-only">Paiement</legend>
          <p className="font-display text-lg font-semibold">3. Paiement</p>
          <div className="mt-4 space-y-3">
            {props.methods.map((m) => (
              <label key={m.method} className={clsx("flex items-start gap-3 rounded-2xl border p-4 text-sm", m.enabled ? "cursor-pointer border-eden-charcoal/15 has-[:checked]:border-eden-green has-[:checked]:bg-eden-green/5" : "cursor-not-allowed border-dashed border-eden-charcoal/15 opacity-60")}>
                <input type="radio" name="paymentMethod" value={m.method} defaultChecked={m.method === firstEnabled} disabled={!m.enabled} className="mt-0.5 h-4 w-4 accent-eden-green" />
                <span>
                  <span className="block font-semibold">{PAYMENT_LABEL[m.method]}</span>
                  {m.note && <span className="block text-eden-mute">{m.note}</span>}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-soft)]">
          <p className="font-display text-lg font-semibold">Votre commande</p>
          <ul className="mt-4 space-y-2 text-sm">
            {props.lines.map((l) => (
              <li key={l.name} className="flex justify-between gap-3">
                <span>
                  {l.quantity} × {l.name}
                </span>
                <span className="shrink-0">{fcfa(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-eden-charcoal/10 pt-4 text-sm">
            <div className="flex justify-between"><dt>Sous-total</dt><dd>{fcfa(props.subtotal)}</dd></div>
            {t.customFees > 0 && <div className="flex justify-between"><dt>Personnalisation</dt><dd>{fcfa(t.customFees)}</dd></div>}
            {t.discount > 0 && <div className="flex justify-between text-eden-green"><dt>Remise</dt><dd>− {fcfa(t.discount)}</dd></div>}
            {t.giftWrapFee > 0 && <div className="flex justify-between"><dt>Emballage cadeau</dt><dd>{fcfa(t.giftWrapFee)}</dd></div>}
            <div className="flex justify-between"><dt>Livraison</dt><dd>{props.fees[mode] === 0 ? "Gratuit" : fcfa(props.fees[mode])}</dd></div>
            <div className="flex justify-between pt-2 text-base font-semibold"><dt>Total</dt><dd className="font-display text-eden-green">{fcfa(t.total)}</dd></div>
          </dl>
          {state?.error && <p role="alert" className="mt-4 rounded-xl bg-eden-red/5 px-4 py-3 text-sm text-eden-red">{state.error}</p>}
          <div className="mt-5">
            <Submit total={t.total} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-eden-mute">En confirmant, vous demandez à Eden de vérifier la disponibilité auprès du vendeur. Vous serez informé à chaque étape. Vous pouvez annuler en ligne tant que le contrôle du produit n&apos;a pas commencé.</p>
        </div>
      </aside>
    </form>
  );
}
