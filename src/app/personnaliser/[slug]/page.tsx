import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { cardAvailability, productCardSelect } from "@/lib/catalog";
import { customKindFor, defaultCustomization, sanitize } from "@/lib/custom";
import { getCartId } from "@/lib/cart";
import { Studio } from "@/components/studio/StudioConfigurator";

export const metadata: Metadata = { title: "Eden Studio · Personnaliser" };
export const dynamic = "force-dynamic";

export default async function Personnaliser({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await db.product.findUnique({ where: { slug }, select: { ...productCardSelect, description: true } });
  if (!p) notFound();
  const kind = customKindFor(p.illustration);
  if (!kind) notFound();
  const a = cardAvailability(p);

  // reprise d'une personnalisation déjà enregistrée dans le panier
  const cartId = await getCartId(false);
  const existing = cartId ? await db.cartItem.findUnique({ where: { cartId_productId: { cartId, productId: p.id } } }) : null;
  const initial = (existing?.custom && sanitize(existing.custom, kind)) || defaultCustomization(kind);

  return (
    <div className="bg-eden-ivory">
      <div className="mx-auto max-w-7xl px-5 pt-6 sm:px-8">
        <nav className="text-xs text-eden-mute" aria-label="Fil d'Ariane">
          <Link href="/boutique" className="hover:underline">Boutique</Link> / <Link href={`/produit/${p.slug}`} className="hover:underline">{p.brand} {p.name}</Link> / Eden Studio
        </nav>
      </div>
      <Studio
        product={{ id: p.id, slug: p.slug, name: `${p.brand} ${p.name}`, price: a.price, available: a.price !== null && a.availability !== "OUT_OF_STOCK" }}
        initial={initial}
        inCart={Boolean(existing)}
      />
    </div>
  );
}
