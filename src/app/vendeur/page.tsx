import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { expireStaleRequests } from "@/lib/orders";
import { effectiveAvailability } from "@/lib/pricing";
import { fcfa, dateTimeFr } from "@/lib/format";
import { Container, Badge, Availability, EmptyState } from "@/components/ui";
import { ActionForm } from "@/components/ActionForm";
import { respondToRequest, upsertOffer, confirmAllStock } from "@/actions/vendor";
import { logout } from "@/actions/auth";

export const metadata: Metadata = { title: "Espace vendeur" };
export const dynamic = "force-dynamic";

export default async function Vendeur() {
  const s = await requireUser(["VENDOR"], "/vendeur");
  const vendor = await db.vendor.findUnique({ where: { userId: s.userId } });
  if (!vendor)
    return (
      <Container className="py-16">
        <EmptyState title="Aucun profil vendeur." text="Ce compte n'est pas rattaché à une boutique partenaire." />
      </Container>
    );

  await expireStaleRequests();
  const [pending, history, offers, products, stats] = await Promise.all([
    db.vendorRequest.findMany({ where: { vendorId: vendor.id, status: "PENDING" }, include: { orderItem: { include: { order: { select: { number: true, city: true, deliveryMode: true } } } }, offer: true }, orderBy: { createdAt: "asc" } }),
    db.vendorRequest.findMany({ where: { vendorId: vendor.id, status: { not: "PENDING" } }, include: { orderItem: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.offer.findMany({ where: { vendorId: vendor.id }, include: { product: { select: { name: true, brand: true } } }, orderBy: { updatedAt: "desc" } }),
    db.product.findMany({ where: { active: true }, select: { id: true, name: true, brand: true }, orderBy: [{ brand: "asc" }, { name: "asc" }] }),
    db.vendorRequest.groupBy({ by: ["status"], where: { vendorId: vendor.id }, _count: true }),
  ]);
  const count = (st: string) => stats.find((x) => x.status === st)?._count ?? 0;
  const accepted = count("ACCEPTED");
  const answered = accepted + count("REFUSED");
  const responded = history.filter((h) => h.respondedAt);
  const avgMin = responded.length ? Math.round(responded.reduce((n, h) => n + (h.respondedAt!.getTime() - h.createdAt.getTime()) / 60000, 0) / responded.length) : null;
  const revenue = history.filter((h) => h.status === "ACCEPTED").reduce((n, h) => n + (h.orderItem.purchasePrice ?? 0) * h.orderItem.quantity, 0);

  return (
    <Container className="py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-eden-gold-2">Espace vendeur</p>
          <h1 className="headline mt-2">{vendor.shopName}.</h1>
          <p className="mt-1 text-sm text-eden-mute">{vendor.city} · {vendor.phone}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={vendor.status === "APPROVED" ? "green" : vendor.status === "PENDING" ? "gold" : "red"}>{vendor.status === "APPROVED" ? "Vendeur vérifié" : vendor.status === "PENDING" ? "En cours de vérification" : "Suspendu"}</Badge>
          <form action={logout}><button className="rounded-full border border-eden-charcoal/15 px-4 py-2 text-sm">Se déconnecter</button></form>
        </div>
      </div>

      {vendor.status !== "APPROVED" && (
        <p className="mt-6 rounded-2xl bg-eden-gold/15 p-4 text-sm text-[#6b4f16]">Votre boutique est en cours de vérification par l&apos;équipe Eden. Vous pourrez publier des offres et recevoir des commandes dès sa validation.</p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {[
          ["Demandes en attente", String(pending.length)],
          ["Taux d'acceptation", answered ? `${Math.round((accepted / answered) * 100)} %` : "—"],
          ["Temps de réponse moyen", avgMin !== null ? `${avgMin} min` : "—"],
          ["Ventes confirmées (prix d'achat)", fcfa(revenue)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-soft)]">
            <p className="text-sm text-eden-mute">{l}</p>
            <p className="mt-1 font-display text-2xl font-bold text-eden-green">{v}</p>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Demandes de confirmation</h2>
        <p className="mt-1 text-sm text-eden-mute">Répondez vite : sans réponse sous {process.env.VENDOR_RESPONSE_MINUTES ?? 120} minutes, la demande passe à un autre vendeur.</p>
        {pending.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-white p-5 text-sm text-eden-mute shadow-[var(--shadow-soft)]">Aucune demande en attente.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {pending.map((r) => (
              <li key={r.id} className="grid gap-4 rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-soft)] lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="text-sm">
                  <p className="font-display text-base font-semibold">{r.orderItem.quantity} × {r.orderItem.productName}</p>
                  <p className="text-eden-mute">Commande {r.orderItem.order.number} · {r.orderItem.order.city} · reçue le {dateTimeFr(r.createdAt)}</p>
                  <p className="mt-1">Votre prix : <span className="font-semibold">{fcfa(r.offer.purchasePrice * r.orderItem.quantity)}</span></p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={respondToRequest}>
                    <input type="hidden" name="requestId" value={r.id} />
                    <input type="hidden" name="decision" value="accept" />
                    <button className="rounded-full bg-eden-green px-5 py-2.5 text-sm font-semibold text-eden-ivory">Confirmer la disponibilité</button>
                  </form>
                  <form action={respondToRequest} className="flex gap-2">
                    <input type="hidden" name="requestId" value={r.id} />
                    <input type="hidden" name="decision" value="refuse" />
                    <select name="reason" className="rounded-full border border-eden-charcoal/15 bg-white px-3 text-sm" aria-label="Motif du refus">
                      <option>Rupture de stock</option>
                      <option>Prix modifié</option>
                      <option>Produit réservé</option>
                      <option>Autre</option>
                    </select>
                    <button className="rounded-full border border-eden-red/30 px-4 py-2.5 text-sm font-semibold text-eden-red">Refuser</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold">Mes offres</h2>
            {vendor.status === "APPROVED" && offers.length > 0 && (
              <form action={confirmAllStock}><button className="rounded-full border border-eden-green px-4 py-2 text-sm font-semibold text-eden-green">Confirmer tout mon stock aujourd&apos;hui</button></form>
            )}
          </div>
          <div className="mt-4 overflow-x-auto rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-soft)]">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-eden-mute"><tr><th className="p-4 font-medium">Produit</th><th className="p-4 font-medium">Prix d&apos;achat</th><th className="p-4 font-medium">Prix Eden</th><th className="p-4 font-medium">Disponibilité</th></tr></thead>
              <tbody>
                {offers.map((o) => (
                  <tr key={o.id} className="border-t border-eden-charcoal/5">
                    <td className="p-4">{o.product.brand} {o.product.name}</td>
                    <td className="p-4">{fcfa(o.purchasePrice)}</td>
                    <td className="p-4 text-eden-mute">{fcfa(o.salePrice)}</td>
                    <td className="p-4"><Availability level={effectiveAvailability(o.availability, o.lastConfirmedAt)} confirmedAt={o.lastConfirmedAt} /></td>
                  </tr>
                ))}
                {offers.length === 0 && <tr><td colSpan={4} className="p-5 text-eden-mute">Aucune offre. Ajoutez votre premier produit.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <ActionForm action={upsertOffer} submitLabel="Enregistrer l'offre" className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-soft)]">
          <p className="font-display text-lg font-semibold">Ajouter ou mettre à jour une offre</p>
          <p className="mt-1 text-xs text-eden-mute">Le prix de vente Eden est calculé automatiquement à partir de votre prix d&apos;achat.</p>
          <label className="mt-4 block text-sm">
            <span className="mb-1.5 block font-medium">Produit du catalogue</span>
            <select name="productId" required className="w-full rounded-xl border border-eden-charcoal/15 bg-white px-3 py-2.5">
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.brand} {p.name}</option>
              ))}
            </select>
          </label>
          <label className="mt-3 block text-sm">
            <span className="mb-1.5 block font-medium">Votre prix (FCFA)</span>
            <input name="purchasePrice" inputMode="numeric" required className="w-full rounded-xl border border-eden-charcoal/15 px-3 py-2.5" />
          </label>
          <label className="mt-3 block text-sm">
            <span className="mb-1.5 block font-medium">Disponibilité</span>
            <select name="availability" className="w-full rounded-xl border border-eden-charcoal/15 bg-white px-3 py-2.5">
              <option value="CONFIRMED">En stock, je confirme aujourd&apos;hui</option>
              <option value="TO_CONFIRM">À confirmer à chaque commande</option>
              <option value="OUT_OF_STOCK">En rupture</option>
            </select>
          </label>
          <p className="mt-3 text-xs text-eden-mute">Produit absent du catalogue ? Écrivez à l&apos;équipe Eden pour le faire référencer.</p>
        </ActionForm>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Historique</h2>
        <ul className="mt-4 divide-y divide-eden-charcoal/5 rounded-[var(--radius-card)] bg-white px-5 text-sm shadow-[var(--shadow-soft)]">
          {history.map((h) => (
            <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <span>{h.orderItem.quantity} × {h.orderItem.productName}</span>
              <span className="text-eden-mute">{dateTimeFr(h.createdAt)} · {h.status === "ACCEPTED" ? "confirmée" : h.status === "REFUSED" ? `refusée${h.reason ? ` (${h.reason})` : ""}` : h.status === "EXPIRED" ? "expirée" : "annulée"}</span>
            </li>
          ))}
          {history.length === 0 && <li className="py-4 text-eden-mute">Aucun historique pour l&apos;instant.</li>}
        </ul>
      </section>
    </Container>
  );
}
