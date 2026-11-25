import type { Metadata } from "next";
import { allForReco, toReco } from "@/lib/catalog";
import { pickGifts, RECIPIENTS, OCCASIONS } from "@/lib/gift";
import { GIFT_WRAP_FEE } from "@/lib/pricing";
import { fcfa } from "@/lib/format";
import { Container, Availability, Price, EmptyState, ButtonLink } from "@/components/ui";
import { DeviceArt } from "@/components/DeviceArt";
import { AddToCart } from "@/components/ProductActions";
import { GiftWizard } from "@/components/GiftWizard";
import { setGiftOptions } from "@/actions/cart";
import Link from "next/link";

export const metadata: Metadata = { title: "Eden Gift" };
export const dynamic = "force-dynamic";

type SP = { pour?: string; occasion?: string; budget?: string; gouts?: string };

export default async function EdenGift({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const budget = sp.budget && /^\d+$/.test(sp.budget) ? parseInt(sp.budget, 10) : undefined;
  const ready = Boolean(sp.pour && sp.occasion && budget);
  const prefs = (sp.gouts ?? "").split(",").filter(Boolean);
  const picks = ready ? pickGifts((await allForReco()).map(toReco), { recipient: sp.pour!, occasion: sp.occasion!, budget: budget!, preferences: prefs }) : [];
  const recipientLabel = RECIPIENTS.find((r) => r.id === sp.pour)?.label.toLowerCase();
  const occasionLabel = OCCASIONS.find((o) => o.id === sp.occasion)?.label.toLowerCase();

  return (
    <>
      <section className="relative overflow-hidden bg-eden-ivory text-eden-charcoal">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9),transparent_65%)]" />
        
        <Container className="relative grid gap-10 py-14 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-eden-gold-2">Eden Gift</p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-6xl">
              Offrir juste. <span className="gold-text">Sans chercher.</span>
            </h1>
            <p className="mt-5 max-w-md text-eden-mute">Quatre questions, une sélection pensée pour la personne. Puis vous choisissez l&apos;emballage et le message : Eden prépare et livre.</p>
            <ul className="mt-6 space-y-2 text-sm text-eden-mute">
              <li>1. Le destinataire, 2. l&apos;occasion, 3. le budget, 4. ses goûts</li>
              <li>5. La sélection d&apos;Eden, 6. la présentation du cadeau</li>
            </ul>
          </div>
          <GiftWizard initial={{ recipient: sp.pour, occasion: sp.occasion, budget, prefs }} />
        </Container>
      </section>

      {ready && (
        <Container className="mt-12" id="selection">
          <h2 className="headline">
            La sélection. <span>{recipientLabel ? `${recipientLabel.charAt(0).toUpperCase()}${recipientLabel.slice(1)}` : ""}{occasionLabel ? `, ${occasionLabel}` : ""}, jusqu&apos;à {fcfa(budget!)}.</span>
          </h2>
          {picks.length === 0 ? (
            <div className="mt-8">
              <EmptyState title="Pas encore d'idée dans ce budget." text="Augmentez un peu le budget ou retirez un goût : Eden élargira la sélection." action={<ButtonLink href="/eden-gift">Recommencer</ButtonLink>} />
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {picks.map(({ product: p, why }) => (
                <article key={p.id} className="flex flex-col rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-soft)]">
                  <Link href={`/produit/${p.slug}`} className="mx-auto block h-36 w-36">
                    <DeviceArt kind={p.illustration ?? "phone"} color={p.color} className="h-full w-full" title={p.name} />
                  </Link>
                  <p className="mt-3 text-xs uppercase tracking-wider text-eden-mute">{p.brand}</p>
                  <Link href={`/produit/${p.slug}`} className="font-display font-semibold hover:underline">{p.name}</Link>
                  <div className="mt-1"><Availability level={p.availability ?? "TO_CONFIRM"} compact /></div>
                  <ul className="mt-3 flex-1 space-y-1 text-sm text-eden-mute">
                    {why.slice(0, 2).map((w) => (
                      <li key={w}>· {w}</li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center justify-between">
                    <Price value={p.price} className="text-lg text-eden-green" />
                    <AddToCart productId={p.id} label="Choisir" />
                  </div>
                </article>
              ))}
            </div>
          )}

          <section className="mt-12 grid gap-8 rounded-[2rem] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-10 lg:grid-cols-2" aria-labelledby="presentation">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-eden-gold-2">Étape 6</p>
              <h3 id="presentation" className="mt-2 font-display text-2xl font-semibold">La présentation du cadeau.</h3>
              <p className="mt-2 text-sm text-eden-mute">Ajoutez l&apos;emballage Eden et un message : il sera joint au cadeau.</p>
            </div>
            <form action={setGiftOptions} className="space-y-4">
              <input type="hidden" name="then" value="panier" />
              <label className="flex items-center gap-3 rounded-2xl bg-eden-ivory p-4 text-sm">
                <input type="checkbox" name="giftWrap" defaultChecked className="h-5 w-5 accent-eden-green" />
                <span>
                  <span className="font-semibold">Emballage cadeau Eden</span> <span className="text-eden-mute">(+ {fcfa(GIFT_WRAP_FEE)})</span>
                </span>
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Votre message (280 caractères max.)</span>
                <textarea name="giftNote" maxLength={280} rows={3} placeholder="Joyeux anniversaire ! Avec toute mon affection." className="w-full rounded-xl border border-eden-charcoal/15 px-4 py-3 outline-none focus:border-eden-green" />
              </label>
              <button className="rounded-full bg-eden-green px-6 py-3 text-sm font-semibold text-eden-charcoal">Enregistrer et voir mon panier</button>
            </form>
          </section>
        </Container>
      )}
    </>
  );
}
