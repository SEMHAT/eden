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
    <article className="group relative flex h-full flex-col rounded-[1.25rem] bg-white p-2.5 sm:rounded-[var(--radius-card)] sm:p-4 shadow-[0_1px_2px_rgb(51_49_46/0.04)] ring-1 ring-eden-charcoal/[0.05] transition duration-500 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      <div className="absolute left-4 right-4 top-4 z-10 flex items-start justify-between gap-2 sm:left-6 sm:right-6 sm:top-6">
        <div className="flex flex-wrap gap-1.5">
          {p.isNew && <Badge tone="gold" className="hidden sm:inline-flex">Nouveau</Badge>}
          {p.condition !== "NEUF" && <Badge tone="green">{CONDITION_LABEL[p.condition]}</Badge>}
        </div>
        <form action={toggleFavorite}>
          <input type="hidden" name="productId" value={p.id} />
          <input type="hidden" name="back" value={back} />
          <button className="relative z-10 grid h-8 w-8 place-items-center rounded-full bg-white/70 text-eden-mute backdrop-blur transition hover:bg-eden-red/5 hover:text-eden-red" aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"} aria-pressed={favorite}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={favorite ? "#A80F1C" : "none"} stroke={favorite ? "#A80F1C" : "currentColor"} strokeWidth="2"><path d="M12 21s-7.5-4.6-9.5-9.3C1.2 8.4 3.3 5 6.8 5c2 0 3.4 1 4.2 2.3h2C13.8 6 15.2 5 17.2 5c3.5 0 5.6 3.4 4.3 6.7C19.5 16.4 12 21 12 21Z" /></svg>
          </button>
        </form>
      </div>
      <Link href={`/produit/${p.slug}`} className="mt-1 block focus:outline-none" aria-label={`${p.brand} ${p.name}`}>
        <span className="absolute inset-0 rounded-[var(--radius-card)]" aria-hidden />
        <div className="mx-auto grid aspect-square w-full place-items-center rounded-[1rem] bg-eden-ivory transition duration-700 sm:aspect-[5/4] sm:rounded-[1.25rem]"><div className="aspect-square w-[62%] transition duration-700 group-hover:scale-[1.06] group-hover:-rotate-2">
          <DeviceArt kind={p.illustration} color={p.color} className="h-full w-full" title={p.name} />
        </div></div>
      </Link>
      <div className="mt-3 flex flex-1 flex-col px-1 sm:mt-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-eden-mute sm:text-xs">{p.brand}</p>
        <h3 className="mt-0.5 line-clamp-2 font-display text-[13px] font-medium leading-snug tracking-tight sm:text-[15px]">{p.name}</h3>
        <div className="mt-2">
          <Availability level={a.availability} compact />
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3 sm:pt-4">
          <div>
            <Price value={a.price} className="whitespace-nowrap text-[13.5px] sm:text-lg" />
          </div>
          {a.price !== null && a.availability !== "OUT_OF_STOCK" && (
            <div className="relative z-10">
              <AddToCart productId={p.id} compact label={`Ajouter ${p.name} au panier`} />
            </div>
          )}
        </div>
        <div className="relative z-10 mt-2.5 hidden self-start sm:block"><CompareToggle productId={p.id} /></div>
      </div>
    </article>
  );
}
