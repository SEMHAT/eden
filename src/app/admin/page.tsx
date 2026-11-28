import Link from "next/link";
import type { Metadata } from "next";
import clsx from "clsx";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { describeCustom } from "@/lib/custom-server";
import { expireStaleRequests } from "@/lib/orders";
import { TRANSITIONS } from "@/lib/order-flow";
import { effectiveAvailability } from "@/lib/pricing";
import { SERVICES, getEnabledServices, getDefaultMargin } from "@/lib/settings";
import { fcfa, dateTimeFr, dateFr, ORDER_STATUS_LABEL, PAYMENT_LABEL, DELIVERY_LABEL, PAYMENT_STATUS_LABEL, ITEM_STATUS_LABEL, REQUEST_STATUS_LABEL } from "@/lib/format";
import { Badge, Availability, Input, Label, Textarea } from "@/components/ui";
import { ActionForm } from "@/components/ActionForm";
import { AutoSubmit } from "@/components/AutoSubmit";
import * as A from "@/actions/admin";
import { logout } from "@/actions/auth";
import { updateImport } from "@/actions/imports";
import { IMPORT_LABEL } from "@/lib/imports";

export const metadata: Metadata = { title: "Administration", robots: { index: false } };
export const dynamic = "force-dynamic";

const TABS = [
  ["tableau", "Tableau de bord"],
  ["commandes", "Commandes"],
  ["vendeurs", "Vendeurs"],
  ["produits", "Produits et prix"],
  ["paiements", "Paiements"],
  ["devis", "Devis"],
  ["imports", "Imports"],
  ["reclamations", "Réclamations"],
  ["utilisateurs", "Utilisateurs"],
  ["contenus", "Contenus et réglages"],
  ["journal", "Journal"],
] as const;

type SP = { onglet?: string; statut?: string; q?: string };

export default async function Admin({ searchParams }: { searchParams: Promise<SP> }) {
  await requireUser(["ADMIN"], "/admin");
  const sp = await searchParams;
  const tab = TABS.some(([k]) => k === sp.onglet) ? sp.onglet! : "tableau";
  await expireStaleRequests();

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="headline">Administration Eden.</h1>
        <form action={logout}><button className="rounded-full border border-eden-charcoal/15 px-4 py-2 text-sm">Se déconnecter</button></form>
      </div>
      <nav className="mt-6 flex gap-1.5 overflow-x-auto pb-2 text-sm [scrollbar-width:none]" aria-label="Sections">
        {TABS.map(([k, l]) => (
          <Link key={k} href={`/admin?onglet=${k}`} aria-current={tab === k ? "page" : undefined} className={clsx("shrink-0 rounded-full px-4 py-2", tab === k ? "bg-eden-green text-eden-ivory" : "bg-white hover:bg-eden-ivory-2")}>
            {l}
          </Link>
        ))}
      </nav>
      <div className="mt-6">
        {tab === "tableau" && <Dashboard />}
        {tab === "commandes" && <Orders status={sp.statut} q={sp.q} />}
        {tab === "vendeurs" && <Vendors />}
        {tab === "produits" && <Products q={sp.q} />}
        {tab === "paiements" && <Payments />}
        {tab === "devis" && <Quotes />}
        {tab === "imports" && <Imports />}
        {tab === "reclamations" && <Claims />}
        {tab === "utilisateurs" && <Users q={sp.q} />}
        {tab === "contenus" && <Contents />}
        {tab === "journal" && <Journal />}
      </div>
    </div>
  );
}

const box = "rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-soft)]";

async function Dashboard() {
  const since = new Date(Date.now() - 30 * 864e5);
  const [orders30, byStatus, pendingReq, vendorsPending, quotesNew, claimsOpen, importsNew, users, products, items] = await Promise.all([
    db.order.findMany({ where: { createdAt: { gte: since } }, select: { total: true, status: true, createdAt: true, subtotal: true, discount: true } }),
    db.order.groupBy({ by: ["status"], _count: true }),
    db.vendorRequest.count({ where: { status: "PENDING" } }),
    db.vendor.count({ where: { status: "PENDING" } }),
    db.quote.count({ where: { status: "NEW" } }),
    db.claim.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    db.importRequest.count({ where: { status: { in: ["NEW", "SOURCING", "ACCEPTED"] } } }),
    db.user.count(),
    db.product.count({ where: { active: true } }),
    db.orderItem.findMany({ where: { order: { createdAt: { gte: since }, status: { notIn: ["CANCELLED", "REFUNDED"] } }, status: { not: "CANCELLED" } }, select: { unitPrice: true, purchasePrice: true, quantity: true, productName: true } }),
  ]);
  const live = orders30.filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status));
  const revenue = live.reduce((n, o) => n + o.total, 0);
  const margin = items.reduce((n, i) => n + (i.purchasePrice !== null ? (i.unitPrice - i.purchasePrice) * i.quantity : 0), 0);
  const top = Object.entries(items.reduce<Record<string, number>>((m, i) => ((m[i.productName] = (m[i.productName] ?? 0) + i.quantity), m), {}))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // commandes par jour sur 14 jours
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 864e5);
    const key = d.toISOString().slice(0, 10);
    return { key, label: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }), n: live.filter((o) => o.createdAt.toISOString().slice(0, 10) === key).length };
  });
  const maxN = Math.max(1, ...days.map((d) => d.n));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Chiffre d'affaires (30 j)", fcfa(revenue)],
          ["Marge brute estimée (30 j)", fcfa(margin)],
          ["Commandes (30 j)", String(live.length)],
          ["Panier moyen", live.length ? fcfa(Math.round(revenue / live.length)) : "—"],
        ].map(([l, v]) => (
          <div key={l} className={box}><p className="text-sm text-eden-mute">{l}</p><p className="mt-1 font-display text-2xl font-bold text-eden-green">{v}</p></div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
        {[
          ["Confirmations vendeur en attente", pendingReq, "commandes"],
          ["Vendeurs à valider", vendorsPending, "vendeurs"],
          ["Devis à traiter", quotesNew, "devis"],
          ["Imports à traiter", importsNew, "imports"],
          ["Réclamations ouvertes", claimsOpen, "reclamations"],
          ["Utilisateurs", users, "utilisateurs"],
          ["Produits actifs", products, "produits"],
        ].map(([l, v, t]) => (
          <Link key={l as string} href={`/admin?onglet=${t}`} className={clsx(box, "transition hover:ring-2 hover:ring-eden-gold")}>
            <p className="text-xs text-eden-mute">{l}</p>
            <p className="mt-1 font-display text-xl font-bold">{v}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className={box}>
          <p className="font-semibold">Commandes par jour (14 derniers jours)</p>
          <div className="mt-6 flex h-40 items-end gap-1.5" role="img" aria-label="Histogramme des commandes par jour">
            {days.map((d) => (
              <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-eden-mute">{d.n || ""}</span>
                <div className="w-full rounded-t-md bg-eden-botanical" style={{ height: `${(d.n / maxN) * 120}px`, minHeight: d.n ? 4 : 1, opacity: d.n ? 1 : 0.15 }} />
                <span className="hidden text-[10px] text-eden-mute sm:block">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={box}>
          <p className="font-semibold">Commandes par statut</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {byStatus.map((s) => (
              <li key={s.status} className="flex justify-between"><Link href={`/admin?onglet=commandes&statut=${s.status}`} className="hover:underline">{ORDER_STATUS_LABEL[s.status]}</Link><span className="font-semibold">{s._count}</span></li>
            ))}
            {byStatus.length === 0 && <li className="text-eden-mute">Aucune commande.</li>}
          </ul>
          <p className="mt-5 font-semibold">Produits les plus commandés (30 j)</p>
          <ol className="mt-2 space-y-1 text-sm">
            {top.map(([n, q]) => <li key={n} className="flex justify-between gap-3"><span className="truncate">{n}</span><span>{q}</span></li>)}
            {top.length === 0 && <li className="text-eden-mute">—</li>}
          </ol>
        </div>
      </div>
    </div>
  );
}

async function Orders({ status, q }: { status?: string; q?: string }) {
  const orders = await db.order.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(q ? { OR: [{ number: { contains: q, mode: "insensitive" } }, { customerName: { contains: q, mode: "insensitive" } }, { customerPhone: { contains: q } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { items: { include: { requests: { include: { vendor: { select: { shopName: true } } }, orderBy: { createdAt: "asc" } } } }, events: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return (
    <div className="space-y-4">
      <form className="flex flex-wrap gap-2" action="/admin">
        <input type="hidden" name="onglet" value="commandes" />
        <input name="q" defaultValue={q} placeholder="N°, nom ou téléphone" className="rounded-full border border-eden-charcoal/15 bg-white px-4 py-2 text-sm" />
        <select name="statut" defaultValue={status ?? ""} className="rounded-full border border-eden-charcoal/15 bg-white px-4 py-2 text-sm">
          <option value="">Tous les statuts</option>
          {Object.entries(ORDER_STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <button className="rounded-full bg-eden-green px-4 py-2 text-sm text-eden-ivory">Filtrer</button>
      </form>
      {orders.length === 0 && <p className={box}>Aucune commande.</p>}
      {orders.map((o) => (
        <details key={o.id} className={box}>
          <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold">{o.number}</span>
            <Badge tone={["CANCELLED", "REFUNDED"].includes(o.status) ? "red" : o.status === "ACTION_REQUIRED" ? "gold" : "green"}>{ORDER_STATUS_LABEL[o.status]}</Badge>
            <span>{o.customerName} · {o.customerPhone}</span>
            <span className="text-eden-mute">{dateTimeFr(o.createdAt)}</span>
            <span className="ml-auto font-semibold">{fcfa(o.total)}</span>
          </summary>
          <div className="mt-4 grid gap-6 border-t border-eden-charcoal/5 pt-4 text-sm lg:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="text-eden-mute">{DELIVERY_LABEL[o.deliveryMode]} · {o.district ? `${o.district}, ` : ""}{o.city}{o.addressNote ? ` · ${o.addressNote}` : ""}</p>
              <p className="text-eden-mute">{PAYMENT_LABEL[o.paymentMethod]} · {PAYMENT_STATUS_LABEL[o.paymentStatus]}{o.giftWrap ? " · emballage cadeau" : ""}{o.giftNote ? ` · « ${o.giftNote} »` : ""}</p>
              <ul className="mt-3 space-y-3">
                {o.items.map((i) => (
                  <li key={i.id} className="rounded-xl bg-eden-ivory p-3">
                    <p className="font-semibold">{i.quantity} × {i.productName} · {fcfa(i.unitPrice)} <span className="font-normal text-eden-mute">(achat {i.purchasePrice ? fcfa(i.purchasePrice) : "—"})</span></p>
                    <p className="text-xs text-eden-mute">Statut : {ITEM_STATUS_LABEL[i.status]}</p>
                    {i.custom ? <p className="mt-1 rounded-lg bg-eden-gold/15 px-2 py-1 text-xs text-[#6b4f16]">À personnaliser : {describeCustom(i.custom).join(" · ")} (+ {fcfa(i.customFee)}/u)</p> : null}
                    <ul className="mt-1 text-xs text-eden-mute">
                      {i.requests.map((r) => <li key={r.id}>→ {r.vendor.shopName} : {REQUEST_STATUS_LABEL[r.status]}{r.reason ? ` (${r.reason})` : ""} · {dateTimeFr(r.createdAt)}</li>)}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              {TRANSITIONS[o.status].length > 0 && (
                <form action={A.setOrderStatus} className="space-y-2 rounded-xl border border-eden-charcoal/10 p-3">
                  <input type="hidden" name="orderId" value={o.id} />
                  <label className="block"><Label>Passer au statut</Label>
                    <select name="status" className="w-full rounded-lg border border-eden-charcoal/15 bg-white px-3 py-2">
                      {TRANSITIONS[o.status].map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
                    </select>
                  </label>
                  <input name="note" placeholder="Note visible par le client (facultatif)" className="w-full rounded-lg border border-eden-charcoal/15 px-3 py-2" />
                  <button className="rounded-full bg-eden-green px-4 py-2 text-eden-ivory">Mettre à jour</button>
                </form>
              )}
              {o.status === "ACTION_REQUIRED" && (
                <div className="flex flex-wrap gap-2">
                  <form action={A.continueWithoutUnavailable}><input type="hidden" name="orderId" value={o.id} /><button className="rounded-full border border-eden-green px-3 py-2 text-xs font-semibold text-eden-green">Continuer sans les articles indisponibles</button></form>
                  <form action={A.retryVendors}><input type="hidden" name="orderId" value={o.id} /><button className="rounded-full border border-eden-charcoal/20 px-3 py-2 text-xs font-semibold">Relancer la recherche de vendeur</button></form>
                </div>
              )}
              <Link href={`/commande/${o.number}`} className="inline-block text-eden-green underline">Voir la page client</Link>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

async function Vendors() {
  const vendors = await db.vendor.findMany({ include: { user: { select: { email: true } }, _count: { select: { offers: true, requests: true } } }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] });
  const stats = await db.vendorRequest.groupBy({ by: ["vendorId", "status"], _count: true });
  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-soft)]">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="text-left text-eden-mute"><tr><th className="p-4 font-medium">Boutique</th><th className="p-4 font-medium">Contact</th><th className="p-4 font-medium">Offres</th><th className="p-4 font-medium">Acceptées / refusées / expirées</th><th className="p-4 font-medium">Statut</th><th className="p-4 font-medium">Action</th></tr></thead>
        <tbody>
          {vendors.map((v) => {
            const c = (s: string) => stats.find((x) => x.vendorId === v.id && x.status === s)?._count ?? 0;
            return (
              <tr key={v.id} className="border-t border-eden-charcoal/5">
                <td className="p-4 font-semibold">{v.shopName}<br /><span className="font-normal text-eden-mute">{v.city}</span></td>
                <td className="p-4">{v.user.email}<br /><span className="text-eden-mute">{v.phone}</span></td>
                <td className="p-4">{v._count.offers}</td>
                <td className="p-4">{c("ACCEPTED")} / {c("REFUSED")} / {c("EXPIRED")}</td>
                <td className="p-4"><Badge tone={v.status === "APPROVED" ? "green" : v.status === "PENDING" ? "gold" : "red"}>{v.status === "APPROVED" ? "Validé" : v.status === "PENDING" ? "À valider" : "Suspendu"}</Badge></td>
                <td className="p-4">
                  <form action={A.setVendorStatus} className="flex gap-2">
                    <input type="hidden" name="vendorId" value={v.id} />
                    {v.status !== "APPROVED" && <button name="status" value="APPROVED" className="rounded-full bg-eden-green px-3 py-1.5 text-xs text-eden-ivory">Valider</button>}
                    {v.status !== "SUSPENDED" && <button name="status" value="SUSPENDED" className="rounded-full border border-eden-red/30 px-3 py-1.5 text-xs text-eden-red">Suspendre</button>}
                  </form>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

async function Products({ q }: { q?: string }) {
  const [products, categories, margin] = await Promise.all([
    db.product.findMany({
      where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { brand: { contains: q, mode: "insensitive" } }] } : {},
      include: { category: true, offers: { include: { vendor: { select: { shopName: true } } } } },
      orderBy: [{ category: { order: "asc" } }, { brand: "asc" }],
    }),
    db.category.findMany({ orderBy: [{ parentId: "asc" }, { order: "asc" }] }),
    getDefaultMargin(),
  ]);
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-3">
        <form className="flex gap-2" action="/admin">
          <input type="hidden" name="onglet" value="produits" />
          <input name="q" defaultValue={q} placeholder="Rechercher un produit" className="flex-1 rounded-full border border-eden-charcoal/15 bg-white px-4 py-2 text-sm" />
          <button className="rounded-full bg-eden-green px-4 py-2 text-sm text-eden-ivory">Chercher</button>
        </form>
        {products.map((p) => (
          <details key={p.id} className={box}>
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 text-sm">
              <span className="font-semibold">{p.brand} {p.name}</span>
              <span className="text-eden-mute">{p.category.name} · {p.reference}</span>
              {!p.active && <Badge tone="red">Masqué</Badge>}
              {p.isFeatured && <Badge tone="gold">Vedette</Badge>}
              <span className="ml-auto">{p.fromPrice ? fcfa(p.fromPrice) : "sans offre"}</span>
            </summary>
            <div className="mt-4 space-y-3 border-t border-eden-charcoal/5 pt-4 text-sm">
              <div className="flex flex-wrap gap-2">
                {(["active", "isFeatured", "isNew"] as const).map((f) => (
                  <form key={f} action={A.toggleProduct}>
                    <input type="hidden" name="productId" value={p.id} /><input type="hidden" name="field" value={f} />
                    <button className="rounded-full border border-eden-charcoal/15 px-3 py-1.5 text-xs">{f === "active" ? (p.active ? "Masquer" : "Afficher") : f === "isFeatured" ? (p.isFeatured ? "Retirer de la vedette" : "Mettre en vedette") : p.isNew ? "Retirer « nouveau »" : "Marquer « nouveau »"}</button>
                  </form>
                ))}
                <Link href={`/produit/${p.slug}`} className="rounded-full px-3 py-1.5 text-xs text-eden-green underline">Voir la fiche</Link>
              </div>
              <table className="w-full">
                <thead className="text-left text-xs text-eden-mute"><tr><th className="py-1 font-medium">Vendeur</th><th className="py-1 font-medium">Achat</th><th className="py-1 font-medium">Vente</th><th className="py-1 font-medium">Dispo</th><th className="py-1 font-medium">Marge %</th></tr></thead>
                <tbody>
                  {p.offers.map((o) => (
                    <tr key={o.id} className="border-t border-eden-charcoal/5">
                      <td className="py-2">{o.vendor.shopName}</td>
                      <td className="py-2">{fcfa(o.purchasePrice)}</td>
                      <td className="py-2 font-semibold">{fcfa(o.salePrice)}</td>
                      <td className="py-2"><Availability level={effectiveAvailability(o.availability, o.lastConfirmedAt)} compact /></td>
                      <td className="py-2">
                        <form action={A.setOfferMargin} className="flex items-center gap-1">
                          <input type="hidden" name="offerId" value={o.id} />
                          <input name="marginPct" defaultValue={o.marginPct ?? margin} className="w-16 rounded-lg border border-eden-charcoal/15 px-2 py-1" aria-label="Marge en pourcentage" />
                          <button className="text-xs text-eden-green underline">OK</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {p.offers.length === 0 && <tr><td colSpan={5} className="py-2 text-eden-mute">Aucune offre vendeur.</td></tr>}
                </tbody>
              </table>
            </div>
          </details>
        ))}
      </div>
      <div className="space-y-6">
        <form action={A.setDefaultMargin} className={box}>
          <p className="font-semibold">Marge par défaut</p>
          <div className="mt-3 flex items-center gap-2">
            <input name="marginPct" defaultValue={margin} className="w-20 rounded-lg border border-eden-charcoal/15 px-3 py-2 text-sm" aria-label="Marge par défaut" /> %
          </div>
          <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" name="apply" className="accent-eden-green" /> Recalculer les offres sans marge spécifique</label>
          <button className="mt-3 rounded-full bg-eden-green px-4 py-2 text-sm text-eden-ivory">Enregistrer</button>
        </form>
        <ActionForm action={A.createProduct} submitLabel="Créer le produit" resetOnSuccess className={box}>
          <p className="font-semibold">Nouveau produit</p>
          <div className="mt-3 space-y-3 text-sm">
            <label className="block"><Label>Nom</Label><Input name="name" required /></label>
            <label className="block"><Label>Marque</Label><Input name="brand" required /></label>
            <label className="block"><Label>Catégorie</Label>
              <select name="categoryId" className="w-full rounded-xl border border-eden-charcoal/15 bg-white px-3 py-2.5">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.parentId ? "— " : ""}{c.name}</option>)}
              </select>
            </label>
            <label className="block"><Label>Illustration</Label>
              <select name="illustration" className="w-full rounded-xl border border-eden-charcoal/15 bg-white px-3 py-2.5">
                {["phone", "tablet", "laptop", "monitor", "headphones", "earbuds", "watch", "speaker", "controller", "console", "powerbank", "charger", "ups", "printer", "keyboard", "mouse"].map((k) => <option key={k}>{k}</option>)}
              </select>
            </label>
            <label className="block"><Label>État</Label>
              <select name="condition" className="w-full rounded-xl border border-eden-charcoal/15 bg-white px-3 py-2.5"><option value="NEUF">Neuf</option><option value="RECONDITIONNE">Reconditionné</option><option value="OCCASION">Occasion</option></select>
            </label>
            <label className="block"><Label>Garantie (mois)</Label><Input name="warrantyMonths" defaultValue="12" /></label>
            <label className="block"><Label>Description</Label><Textarea name="description" required /></label>
            <label className="block"><Label hint="séparés par des virgules">Usages</Label><Input name="usageTags" placeholder="etudiant, photo" /></label>
            <label className="block"><Label hint="séparés par des virgules">Cadeau</Label><Input name="giftTags" placeholder="elle, anniversaire" /></label>
            <label className="block"><Label hint="JSON">Caractéristiques</Label><Textarea name="specs" placeholder='{"ram": 8, "storage": 256}' /></label>
          </div>
        </ActionForm>
      </div>
    </div>
  );
}

async function Payments() {
  const payments = await db.payment.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { order: { select: { number: true } } } });
  return (
    <div className="space-y-4">
      <p className={clsx(box, "text-sm")}>Paiements enregistrés. Le paiement à la livraison est enregistré automatiquement au passage en « Livrée ». Mobile Money et carte : en attente du choix du prestataire (voir docs/PAIEMENTS.md).</p>
      <div className="overflow-x-auto rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-soft)]">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="text-left text-eden-mute"><tr><th className="p-4 font-medium">Date</th><th className="p-4 font-medium">Commande</th><th className="p-4 font-medium">Moyen</th><th className="p-4 font-medium">Montant</th><th className="p-4 font-medium">Statut</th><th className="p-4 font-medium">Référence</th></tr></thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-eden-charcoal/5">
                <td className="p-4">{dateTimeFr(p.createdAt)}</td><td className="p-4">{p.order.number}</td><td className="p-4">{PAYMENT_LABEL[p.method]}</td><td className="p-4">{fcfa(p.amount)}</td><td className="p-4">{PAYMENT_STATUS_LABEL[p.status]}</td><td className="p-4 text-eden-mute">{p.reference ?? p.idempotencyKey}</td>
              </tr>
            ))}
            {payments.length === 0 && <tr><td colSpan={6} className="p-5 text-eden-mute">Aucun paiement enregistré.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function Quotes() {
  const quotes = await db.quote.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-3">
      {quotes.length === 0 && <p className={box}>Aucune demande de devis.</p>}
      {quotes.map((q) => (
        <div key={q.id} className={clsx(box, "grid gap-4 text-sm lg:grid-cols-[1fr_360px]")}>
          <div>
            <p className="font-semibold">{q.orgName} · {q.contactName}</p>
            <p className="text-eden-mute">{q.email} · {q.phone} · {dateFr(q.createdAt)}{q.quantity ? ` · ${q.quantity} unités` : ""}{q.budget ? ` · budget ${fcfa(q.budget)}` : ""}</p>
            <p className="mt-2 whitespace-pre-line">{q.needs}</p>
          </div>
          <form action={A.respondQuote} className="space-y-2">
            <input type="hidden" name="quoteId" value={q.id} />
            <select name="status" defaultValue={q.status} className="w-full rounded-lg border border-eden-charcoal/15 bg-white px-3 py-2">
              <option value="NEW">Reçue</option><option value="IN_REVIEW">En étude</option><option value="SENT">Devis envoyé</option><option value="ACCEPTED">Acceptée</option><option value="DECLINED">Déclinée</option>
            </select>
            <input name="amount" defaultValue={q.amount ?? ""} placeholder="Montant proposé (FCFA)" className="w-full rounded-lg border border-eden-charcoal/15 px-3 py-2" />
            <textarea name="response" defaultValue={q.response ?? ""} placeholder="Réponse au client" className="w-full rounded-lg border border-eden-charcoal/15 px-3 py-2" rows={2} />
            <button className="rounded-full bg-eden-green px-4 py-2 text-eden-ivory">Enregistrer</button>
          </form>
        </div>
      ))}
    </div>
  );
}

async function Imports() {
  const list = await db.importRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div className="space-y-3">
      {list.length === 0 && <p className={box}>Aucune demande d&apos;import.</p>}
      {list.map((r) => (
        <div key={r.id} className={clsx(box, "grid gap-4 text-sm lg:grid-cols-[1fr_380px]")}>
          <div>
            <p className="font-semibold">{r.number} · {r.product}</p>
            <p className="text-eden-mute">{r.name} · {r.phone}{r.email ? ` · ${r.email}` : ""} · {dateFr(r.createdAt)}</p>
            <p className="mt-1 text-eden-mute">Quantité {r.quantity}{r.budget ? ` · budget ${fcfa(r.budget)}` : ""}{r.origin ? ` · ${r.origin}` : ""}{r.deadline ? ` · ${r.deadline}` : ""}</p>
            {r.link && <a href={r.link} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 block break-all text-xs underline">{r.link}</a>}
            {r.details && <p className="mt-2 whitespace-pre-line">{r.details}</p>}
            <Link href={`/import/${r.number}`} className="mt-2 inline-block text-xs underline">Page de suivi client</Link>
          </div>
          <form action={updateImport} className="space-y-2">
            <input type="hidden" name="id" value={r.id} />
            <select name="status" defaultValue={r.status} className="w-full rounded-lg border border-eden-charcoal/15 bg-white px-3 py-2">
              {Object.entries(IMPORT_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <div className="flex gap-2">
              <input name="quotedPrice" defaultValue={r.quotedPrice ?? ""} placeholder="Prix tout compris (FCFA)" className="w-full rounded-lg border border-eden-charcoal/15 px-3 py-2" />
              <input name="etaDays" defaultValue={r.etaDays ?? ""} placeholder="Délai (jours)" className="w-32 rounded-lg border border-eden-charcoal/15 px-3 py-2" />
            </div>
            <textarea name="response" defaultValue={r.response ?? ""} placeholder="Message au client" rows={2} className="w-full rounded-lg border border-eden-charcoal/15 px-3 py-2" />
            <button className="rounded-full bg-eden-charcoal px-4 py-2 text-eden-porcelain">Enregistrer</button>
          </form>
        </div>
      ))}
    </div>
  );
}

async function Claims() {
  const claims = await db.claim.findMany({ orderBy: { createdAt: "desc" }, include: { order: { select: { number: true } }, user: { select: { name: true, email: true } } } });
  return (
    <div className="space-y-3">
      {claims.length === 0 && <p className={box}>Aucune réclamation.</p>}
      {claims.map((c) => (
        <div key={c.id} className={clsx(box, "grid gap-4 text-sm lg:grid-cols-[1fr_360px]")}>
          <div>
            <p className="font-semibold">{c.subject} · commande {c.order.number}</p>
            <p className="text-eden-mute">{c.user.name} · {c.user.email} · {dateTimeFr(c.createdAt)}</p>
            <p className="mt-2">{c.message}</p>
          </div>
          <form action={A.updateClaim} className="space-y-2">
            <input type="hidden" name="claimId" value={c.id} />
            <select name="status" defaultValue={c.status} className="w-full rounded-lg border border-eden-charcoal/15 bg-white px-3 py-2">
              <option value="OPEN">Ouverte</option><option value="IN_PROGRESS">En cours</option><option value="RESOLVED">Résolue</option><option value="REJECTED">Refusée</option>
            </select>
            <textarea name="response" defaultValue={c.response ?? ""} placeholder="Réponse visible par le client" className="w-full rounded-lg border border-eden-charcoal/15 px-3 py-2" rows={2} />
            <button className="rounded-full bg-eden-green px-4 py-2 text-eden-ivory">Enregistrer</button>
          </form>
        </div>
      ))}
    </div>
  );
}

async function Users({ q }: { q?: string }) {
  const users = await db.user.findMany({
    where: q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { organization: { select: { name: true } }, _count: { select: { orders: true } } },
  });
  return (
    <div className="space-y-3">
      <form className="flex gap-2" action="/admin">
        <input type="hidden" name="onglet" value="utilisateurs" />
        <input name="q" defaultValue={q} placeholder="Nom ou e-mail" className="flex-1 rounded-full border border-eden-charcoal/15 bg-white px-4 py-2 text-sm" />
        <button className="rounded-full bg-eden-green px-4 py-2 text-sm text-eden-ivory">Chercher</button>
      </form>
      <div className="overflow-x-auto rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-soft)]">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="text-left text-eden-mute"><tr><th className="p-4 font-medium">Nom</th><th className="p-4 font-medium">E-mail</th><th className="p-4 font-medium">Organisation</th><th className="p-4 font-medium">Commandes</th><th className="p-4 font-medium">Bonus</th><th className="p-4 font-medium">Rôle</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-eden-charcoal/5">
                <td className="p-4">{u.name}</td><td className="p-4">{u.email}</td><td className="p-4">{u.organization?.name ?? "—"}</td><td className="p-4">{u._count.orders}</td><td className="p-4">{u.bonusPoints}</td>
                <td className="p-4">
                  <AutoSubmit>
                    <form action={A.setUserRole}>
                      <input type="hidden" name="userId" value={u.id} />
                      <select name="role" defaultValue={u.role} className="rounded-lg border border-eden-charcoal/15 bg-white px-2 py-1" aria-label={`Rôle de ${u.name}`}>
                        <option value="CUSTOMER">Client</option><option value="PRO">Professionnel</option><option value="VENDOR">Vendeur</option><option value="ADMIN">Admin</option>
                      </select>
                    </form>
                  </AutoSubmit>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function Contents() {
  const [enabled, promos] = await Promise.all([getEnabledServices(), db.promoCode.findMany({ orderBy: { code: "asc" } })]);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={A.setServices} className={box}>
        <p className="font-semibold">Section « Seulement chez Eden. »</p>
        <p className="mt-1 text-sm text-eden-mute">N&apos;activez que les services réellement disponibles.</p>
        <div className="mt-4 space-y-2 text-sm">
          {SERVICES.map((s) => (
            <label key={s.key} className="flex items-start gap-3 rounded-xl bg-eden-ivory p-3">
              <input type="checkbox" name={s.key} defaultChecked={enabled.includes(s.key)} className="mt-0.5 h-4 w-4 accent-eden-green" />
              <span><span className="font-semibold">{s.title}</span><br /><span className="text-eden-mute">{s.text}</span></span>
            </label>
          ))}
        </div>
        <button className="mt-4 rounded-full bg-eden-green px-4 py-2 text-sm text-eden-ivory">Enregistrer</button>
      </form>
      <div className="space-y-6">
        <ActionForm action={A.createPromo} submitLabel="Enregistrer le code" resetOnSuccess className={box}>
          <p className="font-semibold">Codes promotionnels</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
            <label><Label>Code</Label><Input name="code" required /></label>
            <label><Label>Remise %</Label><Input name="percent" required inputMode="numeric" /></label>
            <label><Label hint="(option)">Utilisations max</Label><Input name="maxUses" inputMode="numeric" /></label>
          </div>
        </ActionForm>
        <ul className={clsx(box, "space-y-2 text-sm")}>
          {promos.map((p) => (
            <li key={p.code} className="flex items-center justify-between gap-3">
              <span><span className="font-semibold">{p.code}</span> · −{p.percent} % · {p.uses}{p.maxUses ? `/${p.maxUses}` : ""} utilisations</span>
              <form action={A.togglePromo}><input type="hidden" name="code" value={p.code} /><button className={clsx("rounded-full px-3 py-1 text-xs", p.active ? "bg-eden-green/10 text-eden-green" : "bg-eden-red/10 text-eden-red")}>{p.active ? "Actif" : "Inactif"}</button></form>
            </li>
          ))}
          {promos.length === 0 && <li className="text-eden-mute">Aucun code.</li>}
        </ul>
      </div>
    </div>
  );
}

async function Journal() {
  const logs = await db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 150 });
  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-soft)]">
      <table className="w-full min-w-[700px] text-sm">
        <thead className="text-left text-eden-mute"><tr><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Rôle</th><th className="p-3 font-medium">Action</th><th className="p-3 font-medium">Objet</th><th className="p-3 font-medium">Détails</th></tr></thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-t border-eden-charcoal/5">
              <td className="p-3">{dateTimeFr(l.createdAt)}</td><td className="p-3">{l.actorRole}</td><td className="p-3 font-medium">{l.action}</td><td className="p-3">{l.entity} {l.entityId?.slice(-6)}</td><td className="p-3 text-xs text-eden-mute">{l.data ? JSON.stringify(l.data).slice(0, 80) : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
