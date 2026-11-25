import Link from "next/link";
import { DeviceArt } from "./DeviceArt";
import { Availability, Badge, Price } from "./ui";
import { AddToCart, CompareToggle } from "./ProductActions";
import { cardAvailability, type ProductCardData } from "@/lib/catalog";
import { CONDITION_LABEL } from "@/lib/format";
import { toggleFavorite } from "@/actions/shop";

export function ProductCard({ p, favorite, back = "/boutique" }: { p: ProductCardData; favorite?: boolean; back?: string }) {
  const a = cardAvailability(p);
  return (
    <article className="group relative flex h-full flex-col rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {p.isNew && <Badge tone="gold">Nouveau</Badge>}
          {p.condition !== "NEUF" && <Badge tone="green">{CONDITION_LABEL[p.condition]}</Badge>}
        </div>
        <form action={toggleFavorite}>
          <input type="hidden" name="productId" value={p.id} />
          <input type="hidden" name="back" value={back} />
          <button className="relative z-10 grid h-9 w-9 place-items-center rounded-full text-eden-mute transition hover:bg-eden-red/5 hover:text-eden-red" aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"} aria-pressed={favorite}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={favorite ? "#A80F1C" : "none"} stroke={favorite ? "#A80F1C" : "currentColor"} strokeWidth="2"><path d="M12 21s-7.5-4.6-9.5-9.3C1.2 8.4 3.3 5 6.8 5c2 0 3.4 1 4.2 2.3h2C13.8 6 15.2 5 17.2 5c3.5 0 5.6 3.4 4.3 6.7C19.5 16.4 12 21 12 21Z" /></svg>
          </button>
        </form>
      </div>
      <Link href={`/produit/${p.slug}`} className="mt-1 block focus:outline-none" aria-label={`${p.brand} ${p.name}`}>
        <span className="absolute inset-0 rounded-[var(--radius-card)]" aria-hidden />
        <div className="mx-auto aspect-square w-40 transition duration-500 group-hover:scale-105 group-hover:-rotate-2">
          <DeviceArt kind={p.illustration} color={p.color} className="h-full w-full" title={p.name} />
        </div>
      </Link>
      <div className="mt-3 flex flex-1 flex-col">
        <p className="text-xs font-medium uppercase tracking-wider text-eden-mute">{p.brand}</p>
        <h3 className="mt-0.5 font-display text-[15px] font-semibold leading-snug">{p.name}</h3>
        <div className="mt-2">
          <Availability level={a.availability} compact />
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            <Price value={a.price} prefix="à partir de" className="text-lg" />
          </div>
          {a.price !== null && a.availability !== "OUT_OF_STOCK" && (
            <div className="relative z-10">
              <AddToCart productId={p.id} compact label={`Ajouter ${p.name} au panier`} />
            </div>
          )}
        </div>
        <CompareToggle productId={p.id} className="relative z-10 mt-3 self-start" />
      </div>
    </article>
  );
}
