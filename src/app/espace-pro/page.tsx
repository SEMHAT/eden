import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { fcfa, dateFr, ORDER_STATUS_LABEL } from "@/lib/format";
import { Container, Badge, ButtonLink, EmptyState } from "@/components/ui";
import { logout } from "@/actions/auth";

export const metadata: Metadata = { title: "Espace professionnel" };
export const dynamic = "force-dynamic";

const QUOTE_LABEL: Record<string, string> = { NEW: "Reçue", IN_REVIEW: "En étude", SENT: "Devis envoyé", ACCEPTED: "Acceptée", DECLINED: "Déclinée" };

export default async function EspacePro() {
  const s = await requireUser(["PRO"], "/espace-pro");
  const user = await db.user.findUniqueOrThrow({ where: { id: s.userId }, include: { organization: true } });
  const orgFilter = user.organizationId ? { OR: [{ userId: s.userId }, { organizationId: user.organizationId }] } : { userId: s.userId };
  const [quotes, orders] = await Promise.all([
    db.quote.findMany({ where: orgFilter, orderBy: { createdAt: "desc" } }),
    db.order.findMany({ where: { userId: s.userId }, orderBy: { createdAt: "desc" }, include: { items: true } }),
  ]);
  const spent = orders.filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status)).reduce((n, o) => n + o.total, 0);

  return (
    <Container className="py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-eden-gold-2">Espace professionnel</p>
          <h1 className="headline mt-2">{user.organization?.name ?? "Votre organisation"}.</h1>
          <p className="mt-1 text-sm text-eden-mute">Contact : {user.name} · {user.email}</p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/professionnels#devis">Nouvelle demande de devis</ButtonLink>
          <form action={logout}><button className="rounded-full border border-eden-charcoal/15 px-4 py-2.5 text-sm">Se déconnecter</button></form>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[["Demandes de devis", String(quotes.length)], ["Commandes", String(orders.length)], ["Montant commandé", fcfa(spent)]].map(([l, v]) => (
          <div key={l} className="rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-soft)]">
            <p className="text-sm text-eden-mute">{l}</p>
            <p className="mt-1 font-display text-2xl font-bold text-eden-green">{v}</p>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Suivi des demandes</h2>
        {quotes.length === 0 ? (
          <div className="mt-4"><EmptyState title="Aucune demande de devis." action={<ButtonLink href="/professionnels#devis">Faire une demande</ButtonLink>} /></div>
        ) : (
          <ul className="mt-4 space-y-3">
            {quotes.map((q) => (
              <li key={q.id} className="rounded-[var(--radius-card)] bg-white p-5 text-sm shadow-[var(--shadow-soft)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold">Demande du {dateFr(q.createdAt)}{q.quantity ? ` · ${q.quantity} unité(s)` : ""}</p>
                  <Badge tone={q.status === "SENT" || q.status === "ACCEPTED" ? "green" : q.status === "DECLINED" ? "red" : "gold"}>{QUOTE_LABEL[q.status]}</Badge>
                </div>
                <p className="mt-2 text-eden-mute">{q.needs}</p>
                {(q.amount || q.response) && (
                  <div className="mt-3 rounded-xl bg-eden-green/5 p-3">
                    {q.amount && <p className="font-semibold text-eden-green">Proposition Eden : {fcfa(q.amount)}</p>}
                    {q.response && <p className="mt-1">{q.response}</p>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Commandes et documents commerciaux</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-eden-mute">Vos commandes et factures apparaîtront ici.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-soft)]">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="text-left text-eden-mute"><tr><th className="p-4 font-medium">Commande</th><th className="p-4 font-medium">Date</th><th className="p-4 font-medium">Total</th><th className="p-4 font-medium">Statut</th><th className="p-4" /></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-eden-charcoal/5">
                    <td className="p-4 font-semibold">{o.number}</td>
                    <td className="p-4">{dateFr(o.createdAt)}</td>
                    <td className="p-4">{fcfa(o.total)}</td>
                    <td className="p-4">{ORDER_STATUS_LABEL[o.status]}</td>
                    <td className="p-4 text-right"><Link href={`/commande/${o.number}`} className="text-eden-green underline">Suivi</Link> · <Link href={`/commande/${o.number}/facture`} className="underline">Facture</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-sm text-eden-mute">Pour une commande groupée (plusieurs dizaines d&apos;unités, livraison sur plusieurs sites), passez par une demande de devis : Eden consolide les offres de plusieurs vendeurs.</p>
      </section>
    </Container>
  );
}
