import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { productCardSelect } from "@/lib/catalog";
import { bestOffer, effectiveAvailability, DELIVERY_FEES } from "@/lib/pricing";
import { favoriteIds } from "@/lib/favorites";
import { specRows } from "@/lib/specs";
import { CONDITION_LABEL, fcfa } from "@/lib/format";
import { Container, Availability, Badge, Price } from "@/components/ui";
import { Gallery } from "@/components/product/Gallery";
import { AddToCart, CompareToggle } from "@/components/ProductActions";
import { ProductCard } from "@/components/ProductCard";
import { Shelf } from "@/components/Shelf";
import { toggleFavorite } from "@/actions/shop";
import { buyNow } from "@/actions/cart";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      category: { include: { parent: true } },
      offers: { where: { active: true, vendor: { status: "APPROVED" } }, include: { vendor: { select: { city: true, verifiedAt: true } } } },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await load((await params).slug);
  return p ? { title: `${p.brand} ${p.name}`, description: p.description } : { title: "Produit introuvable" };
}

// produits complémentaires selon la catégorie
const COMPLEMENTS: Record<string, string[]> = {
  smartphones: ["ecouteurs", "energie", "montres"],
  ordinateurs: ["peripheriques", "energie", "casques"],
  "ordinateurs-portables": ["peripheriques", "energie", "casques"],
  tablettes: ["ecouteurs", "energie"],
  gaming: ["casques", "gaming"],
  casques: ["energie", "smartphones"],
  ecouteurs: ["energie", "smartphones"],
  montres: ["smartphones", "ecouteurs"],
  enceintes: ["energie", "smartphones"],
  energie: ["smartphones", "ecouteurs"],
  bureau: ["peripheriques", "ecrans"],
  imprimantes: ["peripheriques", "ecrans"],
};

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await load((await params).slug);
  if (!p || !p.active) notFound();
  const favs = await favoriteIds();
  const best = bestOffer(p.offers);
  const level = best ? effectiveAvailability(best.availability, best.lastConfirmedAt) : "OUT_OF_STOCK";
  const vendorsCount = p.offers.filter((o) => effectiveAvailability(o.availability, o.lastConfirmedAt) !== "OUT_OF_STOCK").length;
  const rows = specRows(p.specs as Record<string, unknown>);

  const compSlugs = COMPLEMENTS[p.category.slug] ?? COMPLEMENTS[p.category.parent?.slug ?? ""] ?? [];
  const compCats = await db.category.findMany({ where: { slug: { in: compSlugs } }, include: { children: true } });
  const compIds = compCats.flatMap((c) => [c.id, ...c.children.map((x) => x.id)]);
  const complements = await db.product.findMany({
    where: { active: true, fromPrice: { not: null }, categoryId: { in: compIds }, id: { not: p.id } },
    orderBy: { popularity: "desc" },
    take: 8,
    select: productCardSelect,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${p.brand} ${p.name}`,
    brand: { "@type": "Brand", name: p.brand },
    sku: p.reference,
    description: p.description,
    itemCondition: p.condition === "NEUF" ? "https://schema.org/NewCondition" : "https://schema.org/RefurbishedCondition",
    ...(best ? { offers: { "@type": "Offer", priceCurrency: "XOF", price: best.salePrice, availability: level === "CONFIRMED" ? "https://schema.org/InStock" : "https://schema.org/LimitedAvailability" } } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container className="pt-6">
        <nav className="text-xs text-eden-mute" aria-label="Fil d'Ariane">
          <Link href="/boutique" className="hover:underline">Boutique</Link>
          {p.category.parent && (
            <>
              {" "}/ <Link href={`/boutique?categorie=${p.category.parent.slug}`} className="hover:underline">{p.category.parent.name}</Link>
            </>
          )}{" "}
          / <Link href={`/boutique?categorie=${p.category.slug}`} className="hover:underline">{p.category.name}</Link>
        </nav>
      </Container>

      <Container className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <Gallery name={`${p.brand} ${p.name}`} kind={p.illustration} color={p.color} images={p.images} videoUrl={p.videoUrl} />

        <div>
          <div className="flex flex-wrap gap-2">
            {p.isNew && <Badge tone="gold">Nouveau</Badge>}
            <Badge tone={p.condition === "NEUF" ? "neutral" : "green"}>{CONDITION_LABEL[p.condition]}</Badge>
          </div>
          <p className="mt-4 text-sm font-medium uppercase tracking-widest text-eden-mute">{p.brand}</p>
          <h1 className="mt-1 font-display text-3xl font-bold leading-tight sm:text-4xl">{p.name}</h1>
          <p className="mt-1 text-xs text-eden-mute">Référence {p.reference}</p>

          <div className="mt-6 rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-soft)]">
            <Price value={best?.salePrice ?? null} className="text-3xl text-eden-green" />
            <p className="mt-1 text-xs text-eden-mute">Prix final, hors livraison</p>
            <div className="mt-4">
              <Availability level={level} confirmedAt={best?.lastConfirmedAt} />
            </div>
            {vendorsCount > 0 && (
              <p className="mt-1 text-xs text-eden-mute">
                Proposé par {vendorsCount} vendeur{vendorsCount > 1 ? "s" : ""} partenaire{vendorsCount > 1 ? "s" : ""} vérifié{vendorsCount > 1 ? "s" : ""}. Le vendeur confirme la disponibilité avant tout paiement.
              </p>
            )}
            {best && level !== "OUT_OF_STOCK" ? (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <AddToCart productId={p.id} quantity />
                <form action={buyNow}>
                  <input type="hidden" name="productId" value={p.id} />
                  <button className="w-full rounded-full border border-eden-green px-5 py-2.5 text-sm font-semibold text-eden-green transition hover:bg-eden-green hover:text-eden-ivory sm:w-auto">Acheter</button>
                </form>
              </div>
            ) : (
              <p className="mt-6 rounded-xl bg-eden-ivory p-4 text-sm">
                Ce produit n&apos;est pas disponible pour le moment. <Link href="/trouver" className="font-semibold text-eden-green underline">Trouver une alternative</Link>
              </p>
            )}
            <div className="mt-5 flex items-center gap-5 border-t border-eden-charcoal/5 pt-4">
              <form action={toggleFavorite}>
                <input type="hidden" name="productId" value={p.id} />
                <input type="hidden" name="back" value={`/produit/${p.slug}`} />
                <button className="inline-flex items-center gap-1.5 text-xs font-medium text-eden-mute hover:text-eden-red" aria-pressed={favs.has(p.id)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={favs.has(p.id) ? "#A80F1C" : "none"} stroke={favs.has(p.id) ? "#A80F1C" : "currentColor"} strokeWidth="2"><path d="M12 21s-7.5-4.6-9.5-9.3C1.2 8.4 3.3 5 6.8 5c2 0 3.4 1 4.2 2.3h2C13.8 6 15.2 5 17.2 5c3.5 0 5.6 3.4 4.3 6.7C19.5 16.4 12 21 12 21Z" /></svg>
                  {favs.has(p.id) ? "Dans vos favoris" : "Ajouter aux favoris"}
                </button>
              </form>
              <CompareToggle productId={p.id} />
            </div>
          </div>

          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-2xl bg-white/70 p-4">
              <dt className="font-semibold">Livraison</dt>
              <dd className="mt-1 text-eden-mute">Lomé : {fcfa(DELIVERY_FEES.STANDARD)}, express {fcfa(DELIVERY_FEES.EXPRESS)}. Retrait gratuit.</dd>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <dt className="font-semibold">Garantie</dt>
              <dd className="mt-1 text-eden-mute">{p.warrantyMonths > 0 ? `${p.warrantyMonths} mois, selon les conditions du vendeur et d'Eden.` : "Sans garantie."}</dd>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <dt className="font-semibold">Contrôle</dt>
              <dd className="mt-1 text-eden-mute">Vérifié par Eden avant la remise.</dd>
            </div>
          </dl>
        </div>
      </Container>

      <Container className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <section>
          <h2 className="font-display text-2xl font-semibold">Description</h2>
          <p className="mt-4 leading-relaxed text-eden-charcoal/80">{p.description}</p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-semibold">Caractéristiques techniques</h2>
          <table className="mt-4 w-full overflow-hidden rounded-[var(--radius-card)] bg-white text-sm shadow-[var(--shadow-soft)]">
            <tbody>
              {[["Marque", p.brand], ["Référence", p.reference], ["État", CONDITION_LABEL[p.condition]], ...rows].map(([k, v]) => (
                <tr key={k} className="border-b border-eden-charcoal/5 last:border-0">
                  <th scope="row" className="w-1/2 px-5 py-3 text-left font-medium text-eden-mute">{k}</th>
                  <td className="px-5 py-3">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </Container>

      {complements.length > 0 && (
        <section className="mt-20" aria-label="Produits complémentaires">
          <Container>
            <h2 className="headline">Pour aller avec. <span>Les compléments utiles.</span></h2>
          </Container>
          <div className="mt-6">
            <Shelf label="Produits complémentaires">
              {complements.map((c) => (
                <ProductCard key={c.id} p={c} favorite={favs.has(c.id)} back={`/produit/${p.slug}`} />
              ))}
            </Shelf>
          </div>
        </section>
      )}
    </>
  );
}

