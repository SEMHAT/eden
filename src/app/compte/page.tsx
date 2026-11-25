import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { productCardSelect } from "@/lib/catalog";
import { fcfa, dateFr, ORDER_STATUS_LABEL } from "@/lib/format";
import { Container, Badge, EmptyState, ButtonLink, Input, Label } from "@/components/ui";
import { ProductCard } from "@/components/ProductCard";
import { ActionForm } from "@/components/ActionForm";
import { addAddress, deleteAddress } from "@/actions/shop";
import { logout } from "@/actions/auth";

export const metadata: Metadata = { title: "Mon espace" };
export const dynamic = "force-dynamic";

export default async function Compte() {
  const s = await requireUser(undefined, "/compte");
  const user = await db.user.findUniqueOrThrow({
    where: { id: s.userId },
    include: {
      addresses: { orderBy: { createdAt: "desc" } },
      orders: { orderBy: { createdAt: "desc" }, include: { items: true } },
      favorites: { include: { product: { select: productCardSelect } } },
      claims: { orderBy: { createdAt: "desc" }, include: { order: { select: { number: true } } } },
    },
  });

  return (
    <Container className="py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="headline">Bonjour {user.name.split(" ")[0]}. <span>Votre espace Eden.</span></h1>
          <p className="mt-2 text-sm text-eden-mute">{user.email}{user.phone ? ` · ${user.phone}` : ""}</p>
        </div>
        <form action={logout}>
          <button className="rounded-full border border-eden-charcoal/15 px-4 py-2 text-sm hover:border-eden-red hover:text-eden-red">Se déconnecter</button>
        </form>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2 text-sm" aria-label="Sections">
        {[["#commandes", "Commandes"], ["#favoris", "Favoris"], ["#bonus", "Bonus"], ["#adresses", "Adresses"], ["#reclamations", "Réclamations"]].map(([h, l]) => (
          <a key={h} href={h} className="rounded-full bg-white px-4 py-2 shadow-[var(--shadow-soft)] hover:text-eden-green">{l}</a>
        ))}
        {s.role === "PRO" && <Link href="/espace-pro" className="rounded-full bg-eden-green px-4 py-2 text-eden-charcoal">Espace professionnel</Link>}
      </nav>

      <section id="commandes" className="mt-10 scroll-mt-24">
        <h2 className="font-display text-2xl font-semibold">Mes commandes</h2>
        {user.orders.length === 0 ? (
          <div className="mt-4"><EmptyState title="Aucune commande pour l'instant." action={<ButtonLink href="/boutique">Découvrir la boutique</ButtonLink>} /></div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-soft)]">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-eden-mute">
                <tr><th className="p-4 font-medium">Commande</th><th className="p-4 font-medium">Date</th><th className="p-4 font-medium">Articles</th><th className="p-4 font-medium">Total</th><th className="p-4 font-medium">Statut</th><th className="p-4" /></tr>
              </thead>
              <tbody>
                {user.orders.map((o) => (
                  <tr key={o.id} className="border-t border-eden-charcoal/5">
                    <td className="p-4 font-semibold">{o.number}</td>
                    <td className="p-4">{dateFr(o.createdAt)}</td>
                    <td className="p-4">{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                    <td className="p-4">{fcfa(o.total)}</td>
                    <td className="p-4"><Badge tone={["CANCELLED", "REFUNDED"].includes(o.status) ? "red" : "green"}>{ORDER_STATUS_LABEL[o.status]}</Badge></td>
                    <td className="p-4 text-right">
                      <Link href={`/commande/${o.number}`} className="font-semibold text-eden-green underline">Suivre</Link>
                      {" · "}
                      <Link href={`/commande/${o.number}/facture`} className="text-eden-mute underline">Facture</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section id="favoris" className="mt-14 scroll-mt-24">
        <h2 className="font-display text-2xl font-semibold">Mes favoris</h2>
        {user.favorites.length === 0 ? (
          <p className="mt-3 text-sm text-eden-mute">Touchez le cœur d&apos;un produit pour le retrouver ici.</p>
        ) : (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {user.favorites.map((f) => (
              <ProductCard key={f.productId} p={f.product} favorite back="/compte#favoris" />
            ))}
          </div>
        )}
      </section>

      <section id="bonus" className="mt-14 scroll-mt-24">
        <div className="rounded-[2rem] bg-[#efe7da] p-6 text-eden-charcoal sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-eden-gold-2">Bonus Eden</p>
          <p className="mt-2 font-display text-5xl font-bold">{user.bonusPoints} <span className="text-xl font-medium text-eden-mute">points</span></p>
          <p className="mt-2 max-w-lg text-sm text-eden-mute">1 point par tranche de 1 000 FCFA, crédité à la clôture de chaque commande. Les points seront échangeables contre des bonus de personnalisation (coques, sacs, accessoires) selon le barème communiqué par Eden.</p>
        </div>
      </section>

      <section id="adresses" className="mt-14 grid scroll-mt-24 gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl font-semibold">Mes adresses</h2>
          <ul className="mt-4 space-y-3">
            {user.addresses.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-4 rounded-2xl bg-white p-4 text-sm shadow-[var(--shadow-soft)]">
                <span>
                  <span className="font-semibold">{a.label}</span>
                  <br />
                  {a.district}, {a.city}
                  {a.details ? ` · ${a.details}` : ""}
                  <br />
                  <span className="text-eden-mute">{a.phone}</span>
                </span>
                <form action={deleteAddress}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="text-xs text-eden-mute hover:text-eden-red">Supprimer</button>
                </form>
              </li>
            ))}
            {user.addresses.length === 0 && <li className="text-sm text-eden-mute">Aucune adresse enregistrée.</li>}
          </ul>
        </div>
        <ActionForm action={addAddress} submitLabel="Ajouter l'adresse" resetOnSuccess className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-soft)]">
          <p className="font-display font-semibold">Nouvelle adresse</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label><Label>Libellé</Label><Input name="label" required placeholder="Maison, bureau…" /></label>
            <label><Label>Téléphone</Label><Input name="phone" required defaultValue={user.phone ?? ""} /></label>
            <label><Label>Ville</Label><Input name="city" required defaultValue="Lomé" /></label>
            <label><Label>Quartier</Label><Input name="district" required /></label>
            <label className="sm:col-span-2"><Label hint="(optionnel)">Indications</Label><Input name="details" /></label>
          </div>
        </ActionForm>
      </section>

      <section id="reclamations" className="mt-14 scroll-mt-24">
        <h2 className="font-display text-2xl font-semibold">Mes réclamations</h2>
        {user.claims.length === 0 ? (
          <p className="mt-3 text-sm text-eden-mute">Aucune réclamation. En cas de souci, ouvrez une réclamation depuis le suivi de la commande concernée.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {user.claims.map((c) => (
              <li key={c.id} className="rounded-2xl bg-white p-4 text-sm shadow-[var(--shadow-soft)]">
                <p className="font-semibold">{c.subject} <span className="font-normal text-eden-mute">· commande {c.order.number} · {dateFr(c.createdAt)}</span></p>
                <p className="mt-1 text-eden-mute">{c.message}</p>
                {c.response && <p className="mt-2 rounded-xl bg-eden-green/5 p-3 text-eden-green">Eden : {c.response}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
