import Link from "next/link";
import type { Metadata } from "next";
import { getCart, cartTotals } from "@/lib/cart";
import { GIFT_WRAP_FEE, bonusFor } from "@/lib/pricing";
import { fcfa } from "@/lib/format";
import { Container, PageHeader, EmptyState, ButtonLink, Availability, Price } from "@/components/ui";
import { DeviceArt } from "@/components/DeviceArt";
import { ActionForm } from "@/components/ActionForm";
import { AutoSubmit } from "@/components/AutoSubmit";
import { updateQuantity, applyPromo, setGiftOptions } from "@/actions/cart";

export const metadata: Metadata = { title: "Panier" };
export const dynamic = "force-dynamic";

export default async function Panier() {
  const cart = await getCart();
  if (!cart || cart.lines.length === 0)
    return (
      <>
        <PageHeader title="Votre panier." />
        <Container className="mt-10">
          <EmptyState title="Votre panier est vide." text="Explorez la boutique ou laissez Eden trouver le bon produit pour votre budget." action={<div className="flex justify-center gap-3"><ButtonLink href="/trouver">Trouver mon produit</ButtonLink><ButtonLink href="/boutique" variant="outline">Boutique</ButtonLink></div>} />
        </Container>
      </>
    );
  const t = cartTotals(cart, "STANDARD");
  const blocked = cart.lines.filter((l) => l.price === null || l.availability === "OUT_OF_STOCK");

  return (
    <>
      <PageHeader title="Votre panier." tagline={`${cart.lines.reduce((s, l) => s + l.quantity, 0)} article(s).`} />
      <Container className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {cart.lines.map((l) => (
            <div key={l.itemId} className="flex gap-4 rounded-[var(--radius-card)] bg-white p-4 shadow-[var(--shadow-soft)] sm:p-5">
              <Link href={`/produit/${l.product.slug}`} className="h-24 w-24 shrink-0">
                <DeviceArt kind={l.product.illustration} color={l.product.color} className="h-full w-full" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-xs uppercase tracking-wider text-eden-mute">{l.product.brand}</p>
                <Link href={`/produit/${l.product.slug}`} className="font-display font-semibold hover:underline">{l.product.name}</Link>
                <div className="mt-1"><Availability level={l.availability} compact /></div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                  <AutoSubmit>
                  <form action={updateQuantity} className="flex items-center gap-2">
                    <input type="hidden" name="itemId" value={l.itemId} />
                    <label className="sr-only" htmlFor={`q-${l.itemId}`}>Quantité</label>
                    <select id={`q-${l.itemId}`} name="quantity" defaultValue={l.quantity} className="rounded-full border border-eden-charcoal/15 bg-white px-3 py-1.5 text-sm">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <noscript><button className="text-xs font-semibold text-eden-green underline">Mettre à jour</button></noscript>
                  </form>
                  </AutoSubmit>
                  <div className="flex items-center gap-4">
                    <Price value={l.price !== null ? l.price * l.quantity : null} className="text-lg" />
                    <form action={updateQuantity}>
                      <input type="hidden" name="itemId" value={l.itemId} />
                      <input type="hidden" name="quantity" value="0" />
                      <button className="text-xs text-eden-mute hover:text-eden-red" aria-label={`Retirer ${l.product.name}`}>Retirer</button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {blocked.length > 0 && <p className="rounded-xl bg-eden-red/5 p-4 text-sm text-eden-red">{blocked.length} article(s) ne sont plus disponibles et ne seront pas commandés.</p>}

          <div className="rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-soft)]">
            <p className="font-display font-semibold">C&apos;est un cadeau ?</p>
            <form action={setGiftOptions} className="mt-3 space-y-3 text-sm">
              <label className="flex items-center gap-3">
                <input type="checkbox" name="giftWrap" defaultChecked={cart.giftWrap} className="h-5 w-5 accent-eden-green" />
                Emballage cadeau Eden <span className="text-eden-mute">(+ {fcfa(GIFT_WRAP_FEE)})</span>
              </label>
              <textarea name="giftNote" defaultValue={cart.giftNote ?? ""} maxLength={280} rows={2} placeholder="Message joint au cadeau (facultatif)" className="w-full rounded-xl border border-eden-charcoal/15 px-4 py-2.5 outline-none focus:border-eden-green" />
              <button className="text-sm font-semibold text-eden-green underline">Enregistrer</button>
            </form>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-soft)]">
            <p className="font-display text-lg font-semibold">Récapitulatif</p>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Sous-total" value={fcfa(t.subtotal)} />
              {t.discount > 0 && <Row label={`Code ${cart.promoCode} (−${cart.promoPercent} %)`} value={`− ${fcfa(t.discount)}`} accent />}
              {t.giftWrapFee > 0 && <Row label="Emballage cadeau" value={fcfa(t.giftWrapFee)} />}
              <Row label="Livraison standard (Lomé)" value={fcfa(t.deliveryFee)} muted />
              <div className="flex justify-between border-t border-eden-charcoal/10 pt-3 text-base font-semibold">
                <dt>Total estimé</dt>
                <dd className="font-display text-eden-green">{fcfa(t.total)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-eden-mute">Le mode de livraison se choisit à l&apos;étape suivante (retrait gratuit possible).</p>
            <p className="mt-3 rounded-xl bg-eden-gold/15 px-3 py-2 text-xs text-[#6b4f16]">Bonus Eden : environ {bonusFor(t.total)} points à la clôture de la commande.</p>
            <ButtonLink href="/commande" className="mt-5 w-full py-3.5">Passer la commande</ButtonLink>
            <p className="mt-3 text-center text-xs text-eden-mute">Rien n&apos;est payé avant la confirmation du vendeur.</p>
          </div>
          <div className="mt-4 rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-soft)]">
            <ActionForm action={applyPromo} submitLabel="Appliquer" submitClassName="px-4 py-2">
              <label className="text-sm font-semibold" htmlFor="promo">Code promotionnel</label>
              <input id="promo" name="code" defaultValue={cart.promoCode ?? ""} placeholder="Votre code" className="mt-2 w-full rounded-full border border-eden-charcoal/15 px-4 py-2 text-sm uppercase outline-none focus:border-eden-green" />
            </ActionForm>
          </div>
        </aside>
      </Container>
    </>
  );
}

function Row({ label, value, accent, muted }: { label: string; value: string; accent?: boolean; muted?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={muted ? "text-eden-mute" : ""}>{label}</dt>
      <dd className={accent ? "text-eden-green" : muted ? "text-eden-mute" : ""}>{value}</dd>
    </div>
  );
}
