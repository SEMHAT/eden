import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import clsx from "clsx";
import { db } from "@/lib/db";
import { canSeeOrder } from "@/lib/access";
import { getSession } from "@/lib/auth";
import { TRACKING_STEPS, trackingIndex, CUSTOMER_CANCELLABLE } from "@/lib/order-flow";
import { fcfa, dateTimeFr, ORDER_STATUS_LABEL, PAYMENT_LABEL, DELIVERY_LABEL } from "@/lib/format";
import { Container, Badge, ButtonLink, Input, Label, Textarea } from "@/components/ui";
import { ActionForm } from "@/components/ActionForm";
import { cancelOrder, confirmReception, createClaim } from "@/actions/shop";

export const metadata: Metadata = { title: "Suivi de commande", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrderPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ nouvelle?: string }> }) {
  const { number } = await params;
  const fresh = (await searchParams).nouvelle === "1";
  const order = await db.order.findUnique({
    where: { number },
    include: { items: true, events: { where: { OR: [{ note: null }, { NOT: { note: { startsWith: "checkout:" } } }] }, orderBy: { createdAt: "asc" } }, claims: true },
  });
  if (!order) notFound();
  const allowed = await canSeeOrder(order);
  const s = await getSession();
  const idx = trackingIndex(order.status);
  const ended = ["CANCELLED", "REFUNDED"].includes(order.status);

  return (
    <Container className="py-10">
      {fresh && (
        <div className="mb-8 rounded-[2rem] bg-[#efe7da] p-6 text-eden-charcoal sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-eden-gold-2">Merci !</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Commande {order.number} reçue.</h1>
          <p className="mt-2 max-w-xl text-eden-mute">Nous demandons maintenant la confirmation de disponibilité au vendeur. Rien n&apos;est encaissé avant cette confirmation. Gardez ce lien pour suivre votre commande.</p>
        </div>
      )}
      {!fresh && <h1 className="headline">Commande {order.number}.</h1>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Badge tone={ended ? "red" : order.status === "ACTION_REQUIRED" ? "gold" : "green"}>{ORDER_STATUS_LABEL[order.status]}</Badge>
        <span className="text-sm text-eden-mute">Passée le {dateTimeFr(order.createdAt)}</span>
      </div>

      {!ended && (
        <ol className="mt-8 grid gap-3 sm:grid-cols-5" aria-label="Étapes de la commande">
          {TRACKING_STEPS.map((st, i) => (
            <li key={st.key} className={clsx("rounded-2xl p-4 text-sm", i < idx ? "bg-eden-sage/25 text-[#3f5a45]" : i === idx ? "bg-eden-charcoal text-eden-porcelain" : "bg-white text-eden-mute")}>
              <span className="font-display font-bold">{i + 1}</span>
              <p className="mt-1 font-medium">{st.label}</p>
            </li>
          ))}
        </ol>
      )}

      {!allowed ? (
        <p className="mt-8 rounded-2xl bg-white p-5 text-sm shadow-[var(--shadow-soft)]">
          Le détail de cette commande est réservé à son client. <Link href={`/connexion?suite=/commande/${order.number}`} className="font-semibold text-eden-green underline">Connectez-vous</Link> pour le consulter.
        </p>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-soft)]">
              <h2 className="font-display text-lg font-semibold">Historique</h2>
              <ol className="mt-4 space-y-4 border-l border-eden-charcoal/10 pl-5">
                {order.events.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-eden-gold" />
                    <p className="text-sm font-semibold">{ORDER_STATUS_LABEL[e.status]}</p>
                    {e.note && <p className="text-sm text-eden-mute">{e.note}</p>}
                    <p className="text-xs text-eden-mute">{dateTimeFr(e.createdAt)}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-soft)]">
              <h2 className="font-display text-lg font-semibold">Articles</h2>
              <ul className="mt-4 divide-y divide-eden-charcoal/5 text-sm">
                {order.items.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-4 py-3">
                    <span>
                      {i.quantity} × {i.productName}
                      <span className={clsx("ml-2 text-xs", i.status === "CONFIRMED" ? "text-eden-green" : i.status === "UNAVAILABLE" ? "text-eden-red" : "text-eden-mute")}>
                        {i.status === "CONFIRMED" ? "confirmé" : i.status === "UNAVAILABLE" ? "indisponible" : i.status === "CANCELLED" ? "annulé" : "en attente du vendeur"}
                      </span>
                    </span>
                    <span>{fcfa(i.unitPrice * i.quantity)}</span>
                  </li>
                ))}
              </ul>
            </section>

            {s && order.userId === s.userId && (
              <section id="reclamation" className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-soft)]">
                <h2 className="font-display text-lg font-semibold">Un problème ?</h2>
                {order.claims.map((c) => (
                  <div key={c.id} className="mt-3 rounded-xl bg-eden-ivory p-3 text-sm">
                    <p className="font-semibold">{c.subject} · <span className="font-normal text-eden-mute">{c.status === "OPEN" ? "ouverte" : c.status === "IN_PROGRESS" ? "en cours" : c.status === "RESOLVED" ? "résolue" : "refusée"}</span></p>
                    {c.response && <p className="mt-1 text-eden-mute">Réponse Eden : {c.response}</p>}
                  </div>
                ))}
                <ActionForm action={createClaim} submitLabel="Envoyer la réclamation" resetOnSuccess className="mt-4">
                  <input type="hidden" name="number" value={order.number} />
                  <label className="block">
                    <Label>Objet</Label>
                    <Input name="subject" required placeholder="Produit endommagé, retard, erreur…" />
                  </label>
                  <label className="mt-3 block">
                    <Label>Message</Label>
                    <Textarea name="message" required />
                  </label>
                </ActionForm>
              </section>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-[var(--radius-card)] bg-white p-6 text-sm shadow-[var(--shadow-soft)]">
              <dl className="space-y-1.5">
                <div className="flex justify-between"><dt>Sous-total</dt><dd>{fcfa(order.subtotal)}</dd></div>
                {order.discount > 0 && <div className="flex justify-between text-eden-green"><dt>Remise</dt><dd>− {fcfa(order.discount)}</dd></div>}
                {order.giftWrapFee > 0 && <div className="flex justify-between"><dt>Emballage cadeau</dt><dd>{fcfa(order.giftWrapFee)}</dd></div>}
                <div className="flex justify-between"><dt>Livraison</dt><dd>{fcfa(order.deliveryFee)}</dd></div>
                <div className="flex justify-between pt-2 text-base font-semibold"><dt>Total</dt><dd className="text-eden-green">{fcfa(order.total)}</dd></div>
              </dl>
              <div className="mt-4 space-y-1 border-t border-eden-charcoal/10 pt-4 text-eden-mute">
                <p>{DELIVERY_LABEL[order.deliveryMode]}{order.district ? `, ${order.district}` : ""}, {order.city}</p>
                <p>{PAYMENT_LABEL[order.paymentMethod]} · {order.paymentStatus === "SUCCEEDED" ? "payée" : order.paymentStatus === "REFUNDED" ? "remboursée" : "non payée"}</p>
                {order.giftWrap && <p>Emballage cadeau{order.giftNote ? ` · « ${order.giftNote} »` : ""}</p>}
              </div>
            </div>
            {CUSTOMER_CANCELLABLE.includes(order.status) && (
              <form action={cancelOrder}>
                <input type="hidden" name="number" value={order.number} />
                <button className="w-full rounded-full border border-eden-red/30 py-3 text-sm font-semibold text-eden-red hover:bg-eden-red/5">Annuler la commande</button>
              </form>
            )}
            {order.status === "DELIVERED" && (
              <form action={confirmReception}>
                <input type="hidden" name="number" value={order.number} />
                <button className="w-full rounded-full bg-eden-green py-3 text-sm font-semibold text-eden-charcoal">Confirmer la réception</button>
              </form>
            )}
            <ButtonLink href="/boutique" variant="outline" className="w-full">Continuer mes achats</ButtonLink>
          </aside>
        </div>
      )}
    </Container>
  );
}
