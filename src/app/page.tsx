import Link from "next/link";
import { Hero } from "@/components/hero/Hero";
import { BudgetBar } from "@/components/BudgetBar";
import { Container, Headline, ButtonLink } from "@/components/ui";
import { ProductCard } from "@/components/ProductCard";
import { DeviceArt } from "@/components/DeviceArt";
import { Shelf } from "@/components/Shelf";
import { Reveal } from "@/components/Reveal";
import { getRootCategories, shelf, productCardSelect } from "@/lib/catalog";
import { getEnabledServices, SERVICES } from "@/lib/settings";
import { favoriteIds } from "@/lib/favorites";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const CAT_ART: Record<string, { kind: string; color: string }> = {
  smartphones: { kind: "phone", color: "#2a2a2a" },
  ordinateurs: { kind: "laptop", color: "#9fa3a7" },
  "audio-accessoires": { kind: "headphones", color: "#1e1e1e" },
  gaming: { kind: "controller", color: "#151716" },
  energie: { kind: "powerbank", color: "#202020" },
  bureau: { kind: "printer", color: "#3a3a3a" },
};

const BUDGETS = [
  { max: 25000, label: "Moins de 25 000 FCFA", hint: "Écouteurs, powerbanks, accessoires" },
  { min: 25000, max: 100000, label: "25 000 à 100 000 FCFA", hint: "Casques, montres, smartphones d'entrée de gamme" },
  { min: 100000, max: 250000, label: "100 000 à 250 000 FCFA", hint: "Smartphones milieu de gamme, tablettes" },
  { min: 250000, max: 500000, label: "250 000 à 500 000 FCFA", hint: "Ordinateurs portables, consoles" },
  { min: 500000, label: "Plus de 500 000 FCFA", hint: "Le haut de gamme" },
];

async function suggestions() {
  const s = await getSession();
  if (!s) return null;
  const favs = await db.favorite.findMany({ where: { userId: s.userId }, select: { product: { select: { categoryId: true, id: true } } } });
  if (!favs.length) return null;
  return db.product.findMany({
    where: { active: true, fromPrice: { not: null }, categoryId: { in: favs.map((f) => f.product.categoryId) }, id: { notIn: favs.map((f) => f.product.id) } },
    orderBy: { popularity: "desc" },
    take: 8,
    select: productCardSelect,
  });
}

export default async function Home() {
  const [cats, news, popular, cheap, services, favs, sugg] = await Promise.all([
    getRootCategories(),
    shelf("nouveautes"),
    shelf("populaires"),
    shelf("offres"),
    getEnabledServices(),
    favoriteIds(),
    suggestions(),
  ]);
  const enabledServices = SERVICES.filter((s) => services.includes(s.key));

  return (
    <>
      <Hero />

      <Container className="relative z-10 -mt-16 sm:-mt-20">
        <BudgetBar />
      </Container>

      {/* Catégories */}
      <section className="mt-20" aria-labelledby="cat-title">
        <Container>
          <div className="flex items-end justify-between gap-4">
            <div id="cat-title">
              <Headline title="Nos catégories phares." tagline="Tout l'univers tech, au même endroit." />
            </div>
            <Link href="/boutique" className="hidden shrink-0 text-sm font-semibold text-eden-green hover:underline sm:block">Voir toute la boutique →</Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {cats.map((c, i) => (
              <Reveal key={c.id} delay={i * 0.05}>
                <Link href={`/boutique?categorie=${c.slug}`} className="group flex h-full flex-col items-center rounded-[var(--radius-card)] bg-white p-5 text-center shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)]">
                  <div className="aspect-square w-24 transition duration-500 group-hover:-translate-y-1 group-hover:scale-110">
                    <DeviceArt kind={CAT_ART[c.slug]?.kind ?? c.icon} color={CAT_ART[c.slug]?.color} className="h-full w-full" title={c.name} />
                  </div>
                  <span className="mt-3 text-sm font-semibold">{c.name}</span>
                  <span className="mt-2 grid h-7 w-7 place-items-center rounded-full bg-eden-green text-xs text-eden-ivory transition group-hover:bg-eden-gold group-hover:text-eden-green">→</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Nouveautés */}
      {news.length > 0 && (
        <section className="mt-24" aria-label="Nouveautés">
          <Container>
            <Headline title="Les nouveautés." tagline="Fraîchement arrivées dans le jardin." />
          </Container>
          <div className="mt-6">
            <Shelf label="Nouveautés">
              {news.map((p) => (
                <ProductCard key={p.id} p={p} favorite={favs.has(p.id)} back="/" />
              ))}
            </Shelf>
          </div>
        </section>
      )}

      {/* Par budget */}
      <section className="mt-20" aria-label="Selon votre budget">
        <Container>
          <Headline title="Selon votre budget." tagline="Le meilleur pour chaque montant." />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {BUDGETS.map((b, i) => {
              const q = new URLSearchParams();
              if (b.min) q.set("min", String(b.min));
              if (b.max) q.set("max", String(b.max));
              return (
                <Reveal key={b.label} delay={i * 0.05}>
                  <Link href={`/boutique?${q}`} className="group flex h-full flex-col justify-between rounded-[var(--radius-card)] border border-eden-green/10 bg-gradient-to-br from-white to-eden-ivory-2/60 p-5 transition hover:border-eden-gold hover:shadow-[var(--shadow-soft)]">
                    <span className="font-display text-lg font-semibold leading-tight text-eden-green">{b.label}</span>
                    <span className="mt-6 text-sm text-eden-mute">{b.hint}</span>
                    <span className="mt-3 text-sm font-semibold text-eden-green group-hover:underline">Voir la sélection →</span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Populaires */}
      <section className="mt-24" aria-label="Les plus demandés">
        <Container>
          <Headline title="Les plus demandés." tagline="Ce que nos clients regardent le plus." />
        </Container>
        <div className="mt-6">
          <Shelf label="Les plus demandés">
            {popular.map((p) => (
              <ProductCard key={p.id} p={p} favorite={favs.has(p.id)} back="/" />
            ))}
          </Shelf>
        </div>
      </section>

      {sugg && sugg.length > 0 && (
        <section className="mt-16" aria-label="Suggestions pour vous">
          <Container>
            <Headline title="Pour vous." tagline="Inspiré de vos favoris." />
          </Container>
          <div className="mt-6">
            <Shelf label="Suggestions">
              {sugg.map((p) => (
                <ProductCard key={p.id} p={p} favorite={favs.has(p.id)} back="/" />
              ))}
            </Shelf>
          </div>
        </section>
      )}

      {/* Eden Gift */}
      <section className="mt-24" aria-labelledby="gift-title">
        <Container>
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] bg-eden-green px-6 py-12 text-eden-ivory sm:px-12 sm:py-16">
              <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(217,179,106,0.4),transparent_65%)]" />
              <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(168,15,28,0.35),transparent_65%)]" />
              <div className="relative grid items-center gap-10 lg:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-eden-gold">Eden Gift</p>
                  <h2 id="gift-title" className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">
                    Le cadeau parfait, <span className="gold-text">sans chercher.</span>
                  </h2>
                  <p className="mt-4 max-w-md text-eden-ivory/75">Pour qui, quelle occasion, quel budget : répondez à quelques questions, Eden compose une sélection. Ajoutez un emballage et un message, on s&apos;occupe du reste.</p>
                  <ButtonLink href="/eden-gift" variant="gold" className="mt-8 px-6 py-3.5">Composer un cadeau →</ButtonLink>
                </div>
                <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {["Le destinataire", "L'occasion", "Le budget", "Ses goûts", "La sélection", "La présentation"].map((s, i) => (
                    <li key={s} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                      <span className="font-display text-2xl font-bold text-eden-gold">{i + 1}</span>
                      <p className="mt-1 text-sm">{s}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Petits prix */}
      <section className="mt-24" aria-label="Petits prix">
        <Container>
          <Headline title="Petits prix." tagline="Des accessoires utiles, à prix doux." />
        </Container>
        <div className="mt-6">
          <Shelf label="Petits prix">
            {cheap.map((p) => (
              <ProductCard key={p.id} p={p} favorite={favs.has(p.id)} back="/" />
            ))}
          </Shelf>
        </div>
      </section>

      {/* Seulement chez Eden */}
      {enabledServices.length > 0 && (
        <section className="mt-20" aria-label="Seulement chez Eden">
          <Container>
            <Headline title="Seulement chez Eden." tagline="Bien plus qu'un achat." />
          </Container>
          <div className="mt-6">
            <Shelf label="Services Eden">
              {enabledServices.map((s) => (
                <Link key={s.key} href={s.href} className="group flex min-h-56 flex-col rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
                  <span className="text-[11px] font-semibold tracking-[0.2em] text-eden-gold-2">{s.eyebrow}</span>
                  <span className="mt-3 font-display text-xl font-semibold leading-snug">{s.title}</span>
                  <span className="mt-2 text-sm text-eden-mute">{s.text}</span>
                  <span className="mt-auto pt-6 text-sm font-semibold text-eden-green group-hover:underline">En savoir plus →</span>
                </Link>
              ))}
            </Shelf>
          </div>
        </section>
      )}

      {/* Professionnels */}
      <section className="mt-20" aria-labelledby="pro-title">
        <Container>
          <Reveal>
            <div className="grid gap-10 rounded-[2rem] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-12 lg:grid-cols-[1.1fr_1fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-eden-gold-2">Professionnels et institutions</p>
                <h2 id="pro-title" className="headline mt-3">
                  Équipez vos équipes. <span>Simplifiez vos achats.</span>
                </h2>
                <p className="mt-4 max-w-lg text-eden-mute">Entreprises, écoles, ONG et administrations : un interlocuteur, des devis clairs, des commandes en quantité et une facturation en règle.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <ButtonLink href="/professionnels#devis">Demander un devis</ButtonLink>
                  <ButtonLink href="/inscription?type=pro" variant="outline">Créer un compte pro</ButtonLink>
                </div>
              </div>
              <ul className="grid grid-cols-2 gap-3 text-sm">
                {["Demande de devis", "Commandes en quantité", "Demandes personnalisées", "Facturation", "Historique des achats", "Contact commercial dédié"].map((f) => (
                  <li key={f} className="flex items-center gap-2 rounded-2xl bg-eden-ivory p-4">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-eden-green text-[10px] text-eden-gold">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Confiance */}
      <section className="mt-20" aria-label="Nos engagements">
        <Container>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] bg-eden-charcoal/5 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["Vendeurs vérifiés", "Validés par Eden avant de vendre"],
              ["Disponibilité confirmée", "Le vendeur confirme avant tout paiement"],
              ["Produits contrôlés", "Selon les procédures Eden"],
              ["Livraison suivie", "Chaque étape visible en ligne"],
              ["Assistance", "Une équipe joignable à Lomé"],
              ["Bonus Eden", "Des points à chaque achat"],
            ].map(([t, d]) => (
              <div key={t} className="bg-eden-ivory p-5">
                <p className="font-display text-sm font-semibold text-eden-green">{t}</p>
                <p className="mt-1 text-xs text-eden-mute">{d}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
