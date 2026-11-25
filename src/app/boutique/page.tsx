import Link from "next/link";
import type { Metadata } from "next";
import { listProducts, getRootCategories, getBrands, type ProductFilters } from "@/lib/catalog";
import { favoriteIds } from "@/lib/favorites";
import { ProductCard } from "@/components/ProductCard";
import { Container, EmptyState, Headline, ButtonLink } from "@/components/ui";
import { AutoSubmit } from "@/components/AutoSubmit";
import { FilterPanel } from "@/components/FilterPanel";
import clsx from "clsx";

export const metadata: Metadata = { title: "Boutique" };
export const dynamic = "force-dynamic";

const USAGES = [
  ["etudiant", "Études"],
  ["bureautique", "Bureautique"],
  ["programmation", "Programmation"],
  ["montage", "Montage vidéo"],
  ["graphisme", "Graphisme"],
  ["gaming", "Jeux vidéo"],
  ["photo", "Photo"],
  ["musique", "Musique"],
  ["sport", "Sport"],
  ["autonomie", "Grande autonomie"],
  ["voyage", "Voyage, mobilité"],
] as const;

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const many = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);
const intOr = (v?: string) => (v && /^\d+$/.test(v) ? parseInt(v, 10) : undefined);

export default async function Boutique({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const filters: ProductFilters = {
    categorie: one(sp.categorie) || undefined,
    q: one(sp.q)?.slice(0, 80) || undefined,
    marque: many(sp.marque).slice(0, 20),
    etat: one(sp.etat) || undefined,
    usage: one(sp.usage) || undefined,
    min: intOr(one(sp.min)),
    max: intOr(one(sp.max)),
    dispo: one(sp.dispo) === "1",
    tri: (one(sp.tri) as ProductFilters["tri"]) || "populaires",
    page: intOr(one(sp.page)) ?? 1,
  };
  const [result, cats, brands, favs] = await Promise.all([listProducts(filters), getRootCategories(), getBrands(filters.categorie), favoriteIds()]);
  const currentRoot = cats.find((c) => c.slug === filters.categorie || c.children.some((ch) => ch.slug === filters.categorie));
  const current = currentRoot?.slug === filters.categorie ? currentRoot : currentRoot?.children.find((c) => c.slug === filters.categorie);

  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) for (const x of many(v)) p.append(k, x);
    for (const [k, v] of Object.entries(patch)) {
      p.delete(k);
      if (v) p.set(k, v);
    }
    return `/boutique?${p.toString()}`;
  };

  const activeCount = [filters.marque?.length, filters.etat, filters.usage, filters.min, filters.max, filters.dispo].filter(Boolean).length;

  return (
    <>
      <div className="bg-gradient-to-b from-eden-ivory-2/70 to-eden-ivory">
        <Container className="pb-6 pt-10">
          <nav className="text-xs text-eden-mute" aria-label="Fil d'Ariane">
            <Link href="/" className="hover:underline">Accueil</Link> / <Link href="/boutique" className="hover:underline">Boutique</Link>
            {currentRoot && currentRoot !== current && (
              <>
                {" "}/ <Link href={`/boutique?categorie=${currentRoot.slug}`} className="hover:underline">{currentRoot.name}</Link>
              </>
            )}
          </nav>
          <Headline as="h1" className="mt-3" title={current ? `${current.name}.` : filters.q ? `« ${filters.q} ».` : "La boutique."} tagline={current?.description ?? "Toute la tech, vérifiée par Eden."} />
          {/* catégories */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
            <Link href="/boutique" className={clsx("shrink-0 rounded-full border px-4 py-2 text-sm", !filters.categorie ? "border-eden-green bg-eden-green text-eden-ivory" : "border-eden-charcoal/15 bg-white hover:border-eden-green")}>Tout</Link>
            {cats.map((c) => (
              <Link key={c.id} href={`/boutique?categorie=${c.slug}`} className={clsx("shrink-0 rounded-full border px-4 py-2 text-sm", currentRoot?.id === c.id ? "border-eden-green bg-eden-green text-eden-ivory" : "border-eden-charcoal/15 bg-white hover:border-eden-green")}>
                {c.name}
              </Link>
            ))}
          </div>
          {currentRoot && currentRoot.children.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {currentRoot.children.map((ch) => (
                <Link key={ch.id} href={`/boutique?categorie=${ch.slug}`} className={clsx("rounded-full px-3 py-1 text-xs", filters.categorie === ch.slug ? "bg-eden-gold/30 font-semibold text-eden-green" : "bg-white text-eden-mute hover:text-eden-green")}>
                  {ch.name}
                </Link>
              ))}
            </div>
          )}
        </Container>
      </div>

      <Container className="grid gap-8 pt-6 lg:grid-cols-[260px_1fr]">
        {/* filtres : formulaire GET, fonctionne même sans JavaScript */}
        <FilterPanel summary={<span>Filtres {activeCount > 0 && <span className="ml-1 rounded-full bg-eden-green px-2 text-xs text-eden-ivory">{activeCount}</span>}</span>}>
          <AutoSubmit>
            <form action="/boutique" className="mt-4 space-y-6 text-sm">
              {filters.categorie && <input type="hidden" name="categorie" value={filters.categorie} />}
              {filters.q && <input type="hidden" name="q" value={filters.q} />}
              <input type="hidden" name="tri" value={filters.tri} />
              <fieldset>
                <legend className="mb-2 font-semibold">Prix (FCFA)</legend>
                <div className="flex items-center gap-2">
                  <input name="min" inputMode="numeric" defaultValue={filters.min ?? ""} placeholder="Min" className="w-full rounded-lg border border-eden-charcoal/15 px-3 py-2" aria-label="Prix minimum" />
                  <span>–</span>
                  <input name="max" inputMode="numeric" defaultValue={filters.max ?? ""} placeholder="Max" className="w-full rounded-lg border border-eden-charcoal/15 px-3 py-2" aria-label="Prix maximum" />
                </div>
              </fieldset>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="dispo" value="1" defaultChecked={filters.dispo} className="h-4 w-4 accent-eden-green" />
                Disponibilité confirmée uniquement
              </label>
              <fieldset>
                <legend className="mb-2 font-semibold">Marque</legend>
                <div className="max-h-56 space-y-1.5 overflow-auto pr-1">
                  {brands.map((b) => (
                    <label key={b.brand} className="flex items-center gap-2">
                      <input type="checkbox" name="marque" value={b.brand} defaultChecked={filters.marque?.includes(b.brand)} className="h-4 w-4 accent-eden-green" />
                      {b.brand} <span className="text-eden-mute">({b.count})</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 font-semibold">État</legend>
                <select name="etat" defaultValue={filters.etat ?? ""} className="w-full rounded-lg border border-eden-charcoal/15 bg-white px-3 py-2">
                  <option value="">Tous</option>
                  <option value="NEUF">Neuf</option>
                  <option value="RECONDITIONNE">Reconditionné</option>
                  <option value="OCCASION">Occasion</option>
                </select>
              </fieldset>
              <fieldset>
                <legend className="mb-2 font-semibold">Usage</legend>
                <select name="usage" defaultValue={filters.usage ?? ""} className="w-full rounded-lg border border-eden-charcoal/15 bg-white px-3 py-2">
                  <option value="">Tous les usages</option>
                  {USAGES.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </fieldset>
              <div className="flex gap-2">
                <button className="flex-1 rounded-full bg-eden-green px-4 py-2.5 font-semibold text-eden-ivory">Appliquer</button>
                <Link href={filters.categorie ? `/boutique?categorie=${filters.categorie}` : "/boutique"} className="rounded-full border border-eden-charcoal/15 px-4 py-2.5">Effacer</Link>
              </div>
            </form>
          </AutoSubmit>
        </FilterPanel>

        <section aria-label="Résultats">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-eden-mute" role="status">
              {result.total} produit{result.total > 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-1.5 text-sm" role="group" aria-label="Trier">
              {[
                ["populaires", "Popularité"],
                ["prix-asc", "Prix croissant"],
                ["prix-desc", "Prix décroissant"],
                ["nouveautes", "Nouveautés"],
              ].map(([v, l]) => (
                <Link key={v} href={qs({ tri: v, page: undefined })} className={clsx("rounded-full px-3 py-1.5", filters.tri === v ? "bg-eden-green text-eden-ivory" : "bg-white hover:bg-eden-ivory-2")}>
                  {l}
                </Link>
              ))}
            </div>
          </div>

          {result.items.length === 0 ? (
            <EmptyState
              title="Aucun produit ne correspond."
              text="Élargissez vos filtres, ou laissez Eden chercher pour vous à partir de votre budget."
              action={<ButtonLink href="/trouver">Trouver mon produit</ButtonLink>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 xl:grid-cols-3">
              {result.items.map((p) => (
                <ProductCard key={p.id} p={p} favorite={favs.has(p.id)} back={qs({})} />
              ))}
            </div>
          )}

          {result.pages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: result.pages }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={qs({ page: String(n) })} aria-current={n === result.page ? "page" : undefined} className={clsx("grid h-10 w-10 place-items-center rounded-full text-sm", n === result.page ? "bg-eden-green text-eden-ivory" : "bg-white hover:bg-eden-ivory-2")}>
                  {n}
                </Link>
              ))}
            </nav>
          )}
        </section>
      </Container>
    </>
  );
}
