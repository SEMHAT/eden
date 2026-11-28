import Link from "next/link";
import type { Metadata } from "next";
import { allForReco, toReco } from "@/lib/catalog";
import { parseQuery, recommend, explainDifference, USAGE_KEYWORDS } from "@/lib/reco";
import { fcfa } from "@/lib/format";
import { Container, Availability, Price, ButtonLink, EmptyState } from "@/components/ui";
import { DeviceArt } from "@/components/DeviceArt";
import { AddToCart } from "@/components/ProductActions";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Trouver mon produit" };
export const dynamic = "force-dynamic";

const CATEGORIES = [
  ["", "Laisser Eden choisir"],
  ["smartphones", "Smartphone"],
  ["ordinateurs", "Ordinateur ou tablette"],
  ["audio-accessoires", "Audio, montre"],
  ["gaming", "Gaming"],
  ["energie", "Énergie et recharge"],
  ["bureau", "Équipement de bureau"],
] as const;

const USAGE_LABEL: Record<string, string> = {
  programmation: "programmation",
  montage: "montage vidéo",
  graphisme: "graphisme",
  gaming: "jeux vidéo",
  photo: "photo",
  bureautique: "bureautique",
  etudiant: "études",
  autonomie: "grande autonomie",
  musique: "musique",
  sport: "sport",
  voyage: "mobilité",
  appels: "appels et visio",
};

const EXAMPLES = [
  "Je cherche un ordinateur pour programmer et faire du montage vidéo. Mon budget est de 250 000 FCFA.",
  "Un téléphone qui fait de belles photos, avec une bonne batterie, pas plus de 120 000 F.",
  "Un casque pour écouter de la musique dans le bus, budget 40k.",
];

type SP = { besoin?: string; budget?: string; categorie?: string };

export default async function Trouver({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const text = (sp.besoin ?? "").slice(0, 500);
  const searched = Boolean(text || sp.budget || sp.categorie);
  const q = parseQuery(text);
  if (sp.budget && /^\d+$/.test(sp.budget)) q.budget = parseInt(sp.budget, 10);
  if (sp.categorie && CATEGORIES.some(([v]) => v === sp.categorie)) q.category = sp.categorie;

  let results: ReturnType<typeof recommend> = [];
  let vendorsConsulted = 0;
  if (searched) {
    const products = (await allForReco()).map(toReco);
    results = recommend(products, q, 6);
    vendorsConsulted = await db.vendor.count({ where: { status: "APPROVED" } });
  }
  const top = results[0]?.product;

  return (
    <>
      <section className="bg-eden-ivory text-eden-charcoal">
        <Container className="py-12 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-eden-gold-2">Trouver mon produit</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-tight sm:text-5xl">
            Dites-nous ce qu&apos;il vous faut. <span className="gold-text">Eden s&apos;occupe du reste.</span>
          </h1>
          <form action="/trouver" className="mt-8 grid gap-4 rounded-[2rem] bg-white/80 p-5 ring-1 ring-eden-charcoal/[0.06] shadow-[var(--shadow-soft)] backdrop-blur sm:p-6 lg:grid-cols-[1fr_200px_220px_auto] lg:items-end">
            <label className="block">
              <span className="mb-1.5 block text-sm text-eden-mute">Votre besoin, avec vos mots</span>
              <textarea name="besoin" defaultValue={text} rows={2} placeholder={EXAMPLES[0]} className="w-full resize-none rounded-2xl border border-eden-charcoal/12 bg-white px-4 py-3 text-eden-charcoal placeholder:text-eden-mute outline-none focus:border-eden-botanical" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-eden-mute">Budget (FCFA)</span>
              <input name="budget" inputMode="numeric" pattern="[0-9]*" defaultValue={sp.budget ?? ""} placeholder="250000" className="w-full rounded-2xl border border-eden-charcoal/12 bg-white px-4 py-3 text-eden-charcoal placeholder:text-eden-mute outline-none focus:border-eden-botanical" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-eden-mute">Catégorie</span>
              <select name="categorie" defaultValue={sp.categorie ?? ""} className="w-full rounded-2xl border border-eden-charcoal/12 bg-white px-4 py-3 text-eden-charcoal outline-none focus:border-eden-botanical">
                {CATEGORIES.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </label>
            <button className="rounded-full bg-eden-charcoal px-7 py-3.5 font-medium text-eden-porcelain">Trouver</button>
          </form>
          {!searched && (
            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              <span className="text-eden-mute">Exemples :</span>
              {EXAMPLES.map((e) => (
                <Link key={e} href={`/trouver?besoin=${encodeURIComponent(e)}`} className="rounded-full bg-white px-3 py-1 text-eden-charcoal/80 ring-1 ring-eden-charcoal/10 hover:ring-eden-charcoal/30">
                  {e.length > 60 ? e.slice(0, 58) + "…" : e}
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>

      {searched && (
        <Container className="mt-10">
          <div className="rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-soft)]">
            <p className="text-sm font-semibold">Ce qu&apos;Eden a compris</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <Chip label="Budget" value={q.budget ? `${fcfa(q.budget)} maximum` : "non précisé"} />
              <Chip label="Catégorie" value={CATEGORIES.find(([v]) => v === q.category)?.[1] ?? "toutes"} />
              <Chip label="Usages" value={q.usages.length ? q.usages.map((u) => USAGE_LABEL[u] ?? u).join(", ") : "non précisés"} />
              {q.minRam && <Chip label="Mémoire" value={`${q.minRam} Go minimum`} />}
            </div>
            <p className="mt-3 text-xs text-eden-mute">
              Eden a interrogé le catalogue et les offres de {vendorsConsulted} vendeur{vendorsConsulted > 1 ? "s" : ""} partenaire{vendorsConsulted > 1 ? "s" : ""}, écarté les produits hors budget ou en rupture, puis classé les résultats selon vos usages. Ce classement est calculé par des règles transparentes, pas par une IA.
            </p>
            {q.usages.length === 0 && text && (
              <p className="mt-2 text-xs text-[#8a6a2a]">Astuce : précisez l&apos;usage (par exemple {Object.keys(USAGE_KEYWORDS).slice(0, 4).map((u) => USAGE_LABEL[u]).join(", ")}) pour un classement plus fin.</p>
            )}
          </div>

          {results.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                title="Rien ne correspond exactement pour l'instant."
                text={q.budget ? `Aucun produit disponible ne rentre dans ${fcfa(q.budget)} pour ces critères. Essayez un budget un peu plus large ou une autre catégorie.` : "Essayez de préciser votre budget ou la catégorie."}
                action={<ButtonLink href={`/import?produit=${encodeURIComponent(text)}${q.budget ? `&budget=${q.budget}` : ""}`} variant="outline">Le faire venir sur commande</ButtonLink>}
              />
            </div>
          ) : (
            <ol className="mt-8 grid gap-5">
              {results.map((r, i) => {
                const diff = i > 0 && top ? explainDifference(top, r.product) : [];
                return (
                  <li key={r.product.id} className="grid gap-5 rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-soft)] sm:grid-cols-[140px_1fr_auto] sm:items-center sm:p-6">
                    <div className="relative mx-auto h-32 w-32">
                      <span className={`absolute -left-2 -top-2 grid h-8 w-8 place-items-center rounded-full font-display text-sm font-bold ${i === 0 ? "bg-eden-gold text-eden-green" : "bg-eden-ivory-2 text-eden-charcoal"}`}>{i + 1}</span>
                      <DeviceArt kind={r.product.illustration ?? "phone"} color={r.product.color} className="h-full w-full" title={r.product.name} />
                    </div>
                    <div>
                      {i === 0 && <p className="text-xs font-semibold uppercase tracking-widest text-eden-gold-2">Le choix d&apos;Eden</p>}
                      <Link href={`/produit/${r.product.slug}`} className="font-display text-lg font-semibold hover:underline">
                        {r.product.brand} {r.product.name}
                      </Link>
                      <div className="mt-1"><Availability level={r.product.availability ?? "TO_CONFIRM"} compact /></div>
                      {r.reasons.length > 0 && (
                        <ul className="mt-3 space-y-1 text-sm">
                          {r.reasons.slice(0, 3).map((x) => (
                            <li key={x} className="flex gap-2"><span className="text-eden-green">✓</span>{x}</li>
                          ))}
                        </ul>
                      )}
                      {r.warnings.length > 0 && (
                        <ul className="mt-2 space-y-1 text-sm text-[#8a6a2a]">
                          {r.warnings.map((x) => (
                            <li key={x} className="flex gap-2"><span>!</span>{x}</li>
                          ))}
                        </ul>
                      )}
                      {diff.length > 0 && <p className="mt-3 text-xs text-eden-mute">Par rapport au n° 1 : {diff.join(", ")}.</p>}
                    </div>
                    <div className="flex flex-col items-start gap-3 sm:items-end">
                      <Price value={r.product.price} className="text-xl text-eden-green" />
                      <AddToCart productId={r.product.id} label="Ajouter au panier" />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          {results.length >= 2 && (
            <div className="mt-6 flex justify-center">
              <ButtonLink href={`/comparer?ids=${results.slice(0, 3).map((r) => r.product.id).join(",")}`} variant="outline">
                Comparer les {Math.min(3, results.length)} premiers
              </ButtonLink>
            </div>
          )}
        </Container>
      )}
    </>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full bg-eden-ivory px-3 py-1.5">
      <span className="text-eden-mute">{label} : </span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}
