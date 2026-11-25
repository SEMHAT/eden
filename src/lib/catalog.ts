import "server-only";
import { db } from "./db";
import { bestOffer, effectiveAvailability, CONFIRMATION_TTL_HOURS } from "./pricing";
import type { Prisma } from "@prisma/client";
import type { RecoProduct, Specs } from "./reco";

export const PAGE_SIZE = 12;

export type ProductFilters = {
  categorie?: string;
  q?: string;
  marque?: string[];
  etat?: string;
  usage?: string;
  min?: number;
  max?: number;
  dispo?: boolean;
  tri?: "prix-asc" | "prix-desc" | "populaires" | "nouveautes";
  page?: number;
};

const offerSelect = {
  id: true,
  vendorId: true,
  salePrice: true,
  purchasePrice: true,
  availability: true,
  lastConfirmedAt: true,
  active: true,
} satisfies Prisma.OfferSelect;

export const productCardSelect = {
  id: true,
  slug: true,
  name: true,
  brand: true,
  illustration: true,
  color: true,
  condition: true,
  isNew: true,
  popularity: true,
  fromPrice: true,
  specs: true,
  usageTags: true,
  giftTags: true,
  category: { select: { slug: true, name: true, parent: { select: { slug: true } } } },
  offers: { where: { active: true }, select: offerSelect },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

export function cardAvailability(p: ProductCardData) {
  const o = bestOffer(p.offers);
  if (!o) return { price: null as number | null, availability: "OUT_OF_STOCK" as const, confirmedAt: null as Date | null };
  return {
    price: o.salePrice,
    availability: effectiveAvailability(o.availability, o.lastConfirmedAt),
    confirmedAt: o.lastConfirmedAt,
  };
}

export async function getRootCategories() {
  return db.category.findMany({
    where: { parentId: null },
    orderBy: { order: "asc" },
    include: { children: { orderBy: { order: "asc" } } },
  });
}

async function categoryIds(slug: string) {
  const cat = await db.category.findUnique({ where: { slug }, include: { children: true } });
  if (!cat) return [];
  return [cat.id, ...cat.children.map((c) => c.id)];
}

export async function listProducts(f: ProductFilters) {
  const where: Prisma.ProductWhereInput = { active: true };
  const and: Prisma.ProductWhereInput[] = [];
  if (f.categorie) and.push({ categoryId: { in: await categoryIds(f.categorie) } });
  if (f.q) {
    const words = f.q.trim().split(/\s+/).filter(Boolean).slice(0, 6);
    for (const w of words)
      and.push({
        OR: [
          { name: { contains: w, mode: "insensitive" } },
          { brand: { contains: w, mode: "insensitive" } },
          { description: { contains: w, mode: "insensitive" } },
          { usageTags: { has: w.toLowerCase() } },
        ],
      });
  }
  if (f.marque?.length) and.push({ brand: { in: f.marque } });
  if (f.etat && ["NEUF", "RECONDITIONNE", "OCCASION"].includes(f.etat)) and.push({ condition: f.etat as never });
  if (f.usage) and.push({ usageTags: { has: f.usage } });
  if (f.min !== undefined || f.max !== undefined)
    and.push({ fromPrice: { gte: f.min ?? 0, ...(f.max !== undefined ? { lte: f.max } : {}) } });
  else and.push({ fromPrice: { not: null } });
  if (f.dispo) {
    const cutoff = new Date(Date.now() - CONFIRMATION_TTL_HOURS * 36e5);
    and.push({ offers: { some: { active: true, availability: "CONFIRMED", lastConfirmedAt: { gte: cutoff } } } });
  }
  where.AND = and;

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    f.tri === "prix-asc"
      ? [{ fromPrice: "asc" }]
      : f.tri === "prix-desc"
        ? [{ fromPrice: "desc" }]
        : f.tri === "nouveautes"
          ? [{ isNew: "desc" }, { createdAt: "desc" }]
          : [{ popularity: "desc" }];

  const page = Math.max(1, f.page ?? 1);
  const [total, items] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({ where, orderBy, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, select: productCardSelect }),
  ]);
  return { total, items, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getBrands(categorie?: string) {
  const where: Prisma.ProductWhereInput = { active: true };
  if (categorie) where.categoryId = { in: await categoryIds(categorie) };
  const rows = await db.product.groupBy({ by: ["brand"], where, _count: true, orderBy: { brand: "asc" } });
  return rows.map((r) => ({ brand: r.brand, count: r._count }));
}

export async function shelf(kind: "nouveautes" | "populaires" | "offres" | "vedette", take = 10) {
  const where: Prisma.ProductWhereInput = { active: true, fromPrice: { not: null } };
  if (kind === "nouveautes") where.isNew = true;
  if (kind === "vedette") where.isFeatured = true;
  const items = await db.product.findMany({
    where,
    orderBy: kind === "offres" ? [{ fromPrice: "asc" }] : [{ popularity: "desc" }],
    take,
    select: productCardSelect,
  });
  return items;
}

export function toReco(p: ProductCardData): RecoProduct & { giftTags: string[] } {
  const a = cardAvailability(p);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    categorySlug: p.category.parent?.slug ?? p.category.slug,
    subCategorySlug: p.category.parent ? p.category.slug : null,
    specs: p.specs as Specs,
    usageTags: p.usageTags,
    giftTags: p.giftTags,
    popularity: p.popularity,
    price: a.price,
    availability: p.offers.length ? a.availability : null,
    illustration: p.illustration,
    color: p.color,
  };
}

export async function allForReco() {
  const items = await db.product.findMany({ where: { active: true }, select: productCardSelect });
  return items;
}

/** Met à jour le prix « à partir de » d'un produit après une modification d'offre. */
export async function refreshProductPrice(productId: string) {
  const offers = await db.offer.findMany({ where: { productId, active: true }, select: offerSelect });
  const o = bestOffer(offers);
  await db.product.update({ where: { id: productId }, data: { fromPrice: o?.salePrice ?? null } });
}
