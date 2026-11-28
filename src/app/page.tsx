import Link from "next/link";
import { Hero } from "@/components/hero/Hero";
import { IntroOverlay } from "@/components/intro/IntroOverlay";
import { Experience } from "@/components/experience/Experience";
import { BudgetBar } from "@/components/BudgetBar";
import { Container, ButtonLink } from "@/components/ui";
import { ProductCard } from "@/components/ProductCard";
import { Shelf } from "@/components/Shelf";
import { Reveal } from "@/components/Reveal";
import { byCategory, type ProductCardData } from "@/lib/catalog";
import { getEnabledServices, SERVICES } from "@/lib/settings";
import { favoriteIds } from "@/lib/favorites";

export const dynamic = "force-dynamic";

function Selection({ title, accent, items, favs, href, label }: { title: string; accent: string; items: ProductCardData[]; favs: Set<string>; href: string; label: string }) {
  return (
    <>
      <Container className="flex flex-wrap items-end justify-between gap-4">
        <h3 className="font-display text-[clamp(1.5rem,1rem+1.6vw,2.3rem)] font-medium tracking-[-0.03em]">
          {title} <span className="serif-accent">{accent}</span>
        </h3>
        <Link href={href} className="text-sm font-medium text-eden-charcoal underline-offset-4 hover:underline">
          {label} →
        </Link>
      </Container>
      <div className="mt-6">
        <Shelf label={title}>
          {items.map((p) => (
            <ProductCard key={p.id} p={p} favorite={favs.has(p.id)} back="/" />
          ))}
        </Shelf>
      </div>
    </>
  );
}

const CHAPTERS = [
  ["#ordinateurs", "01", "Ordinateurs"],
  ["#smartphones", "02", "Smartphones"],
  ["#audio", "03", "Audio"],
  ["#gaming", "04", "Gaming"],
  ["#professionnels", "05", "Professionnels"],
] as const;

export default async function Home() {
  const [laptops, phones, audio, gaming, office, services, favs] = await Promise.all([
    byCategory("ordinateurs"),
    byCategory("smartphones"),
    byCategory("audio-accessoires"),
    byCategory("gaming"),
    byCategory("bureau"),
    getEnabledServices(),
    favoriteIds(),
  ]);
  const enabledServices = SERVICES.filter((s) => services.includes(s.key));

  return (
    <>
      <IntroOverlay />
      <Hero />

      {/* budget */}
      <section className="relative bg-eden-porcelain pb-24 pt-6" aria-labelledby="budget-title">
        <Container>
          <div className="mb-8 max-w-2xl">
            <p className="eyebrow">Recherche par budget</p>
            <h2 id="budget-title" className="mt-3 font-display text-[clamp(1.8rem,1.2rem+2vw,3rem)] font-medium leading-tight tracking-[-0.03em]">
              Dis-nous ton budget. <span className="serif-accent">On s&apos;occupe du reste.</span>
            </h2>
          </div>
          <BudgetBar />
        </Container>
      </section>

      {/* sommaire des expériences */}
      <nav id="experiences" aria-label="Expériences" className="scroll-mt-16 border-y border-eden-charcoal/[0.06] bg-eden-porcelain">
        <Container className="flex gap-2 overflow-x-auto py-4 [scrollbar-width:none]">
          {CHAPTERS.map(([href, n, l]) => (
            <a key={href} href={href} className="group flex shrink-0 items-baseline gap-2 rounded-full px-4 py-2 text-sm transition hover:bg-eden-ivory">
              <span className="text-[11px] tabular-nums text-eden-gold-2">{n}</span>
              <span className="text-eden-charcoal/80 group-hover:text-eden-charcoal">{l}</span>
            </a>
          ))}
        </Container>
      </nav>

      <Experience
        id="ordinateurs"
        index="01"
        eyebrow="Ordinateurs"
        title="Ouvrez-le."
        accent="Il s'éveille."
        scene="laptop"
        tone="ivory"
        steps={[
          { title: "Un objet, d'abord.", text: "Fermé, il tient dans un sac. Le choix d'un ordinateur commence par ce qu'on emporte avec soi." },
          { title: "L'ouverture.", text: "Une charnière qui s'ouvre d'un doigt, un écran qui s'allume : tout se joue dans les premières secondes." },
          { title: "Le clavier, révélé.", text: "Pour coder, écrire ou monter des vidéos : Eden vous aide à choisir la bonne mémoire et le bon processeur." },
          { title: "De profil.", text: "Finesse, poids, autonomie. Les détails qui comptent quand on l'utilise tous les jours." },
          { title: "Votre sélection.", text: "Des modèles confirmés par nos vendeurs partenaires, prêts à commander." },
        ]}
      >
        <Selection title="Ordinateurs." accent="Choisis pour durer." items={laptops} favs={favs} href="/boutique?categorie=ordinateurs" label="Tous les ordinateurs" />
      </Experience>

      <Experience
        id="smartphones"
        index="02"
        eyebrow="Smartphones"
        title="Regardez de plus près."
        accent="Tout est là."
        scene="phone"
        tone="porcelain"
        steps={[
          { title: "Il entre en scène.", text: "Un écran qui s'allume, une finition métal champagne : l'objet qu'on tient le plus souvent dans la journée." },
          { title: "Le module photo.", text: "Capteurs, ouverture, stabilisation : Eden compare les appareils photo pour vous." },
          { title: "À l'intérieur.", text: "Écran, carte mère, batterie, appareil photo. Comprendre ce qu'on achète, sans jargon." },
          { title: "Puis tout se réassemble.", text: "Les composants retrouvent leur place, l'écran devient une porte d'entrée." },
          { title: "Votre sélection.", text: "Neufs ou reconditionnés et contrôlés, du premier prix au haut de gamme." },
        ]}
      >
        <Selection title="Smartphones." accent="Pour chaque budget." items={phones} favs={favs} href="/boutique?categorie=smartphones" label="Tous les smartphones" />
      </Experience>

      <Experience
        id="audio"
        index="03"
        eyebrow="Audio et accessoires"
        title="Le son,"
        accent="mis en scène."
        scene="audio"
        tone="ivory"
        steps={[
          { title: "Le boîtier s'ouvre.", text: "Les écouteurs en sortent, prêts. Réduction de bruit, autonomie, maintien : on vous dit ce qui compte." },
          { title: "Le casque se dévoile.", text: "Coussinets, arceau, articulations. Le confort se voit avant de s'entendre." },
          { title: "La montre se décompose.", text: "Boîtier, écran, bracelet : chaque élément compte pour le sport, la santé et le style." },
          { title: "Une composition.", text: "Chaque objet est une porte d'entrée : touchez-le pour ouvrir sa catégorie." },
        ]}
      >
        <Selection title="Audio et accessoires." accent="À offrir ou à garder." items={audio} favs={favs} href="/boutique?categorie=audio-accessoires" label="Tout l'audio" />
      </Experience>

      <Experience
        id="gaming"
        index="04"
        eyebrow="Gaming"
        title="Prenez la main."
        accent="Le jeu commence."
        scene="gaming"
        tone="sage"
        steps={[
          { title: "La manette s'avance.", text: "Une lumière plus vive, un rythme plus rapide : bienvenue côté jeu." },
          { title: "Chaque bouton compte.", text: "Réactivité, ergonomie, compatibilité : Eden vérifie ce qui fonctionne avec votre console." },
          { title: "Sticks et gâchettes.", text: "Précision des sticks, retour des gâchettes : les sensations qui font la différence." },
          { title: "Les consoles entrent en jeu.", text: "PlayStation, Switch, Xbox : les machines et leurs accessoires." },
        ]}
      >
        <Selection title="Gaming." accent="Prêt à jouer." items={gaming} favs={favs} href="/boutique?categorie=gaming" label="Tout le gaming" />
      </Experience>

      <Experience
        id="professionnels"
        index="05"
        eyebrow="Professionnels et institutions"
        title="Équipez vos équipes."
        accent="Simplifiez vos achats."
        scene="office"
        tone="porcelain"
        steps={[
          { title: "Un espace de travail.", text: "Écrans, ordinateurs, imprimantes : un équipement cohérent, pensé pour durer." },
          { title: "Tout s'allume.", text: "Configurations précises, marques imposées, quantités : Eden consolide les offres de plusieurs vendeurs." },
          { title: "Un devis clair.", text: "Une demande, une proposition chiffrée sous 24 h ouvrées, une facturation en règle." },
        ]}
      >
        <Container>
          <div className="grid gap-6 rounded-[2rem] bg-eden-ivory p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <h3 className="font-display text-[clamp(1.5rem,1rem+1.6vw,2.3rem)] font-medium tracking-[-0.03em]">
                Un interlocuteur. <span className="serif-accent">Des devis clairs.</span>
              </h3>
              <p className="mt-3 max-w-lg text-eden-mute">Entreprises, écoles, ONG et administrations : commandes en quantité, demandes personnalisées, facturation et historique dans votre espace.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="/professionnels#devis">Demander un devis</ButtonLink>
                <ButtonLink href="/inscription?type=pro" variant="outline">Créer un compte pro</ButtonLink>
              </div>
            </div>
            <ul className="grid grid-cols-2 gap-3 text-sm">
              {["Demande de devis", "Commandes en quantité", "Demandes personnalisées", "Facturation", "Historique des achats", "Contact commercial"].map((f) => (
                <li key={f} className="rounded-2xl bg-eden-porcelain px-4 py-3.5">{f}</li>
              ))}
            </ul>
          </div>
        </Container>
        <div className="mt-14">
          <Selection title="Équipements de bureau." accent="Fiables, au quotidien." items={office} favs={favs} href="/boutique?categorie=bureau" label="Tout l'équipement de bureau" />
        </div>
      </Experience>

      {/* Eden Studio et import */}
      <section className="bg-eden-porcelain pt-24" aria-label="Eden Studio et import">
        <Container className="grid gap-5 lg:grid-cols-2">
          <Reveal>
            <Link href={phones[0] ? `/personnaliser/${phones[0].slug}` : "/boutique?categorie=smartphones"} className="group relative flex min-h-[26rem] flex-col justify-between overflow-hidden rounded-[2.25rem] bg-eden-ivory p-8 sm:p-12">
              <div className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(167,185,165,0.45),transparent_65%)]" />
              <div className="relative">
                <p className="eyebrow">Eden Studio</p>
                <h2 className="mt-3 font-display text-[clamp(1.9rem,1.2rem+2.2vw,3.2rem)] font-medium leading-[1.02] tracking-[-0.035em]">
                  Rendez-le <span className="serif-accent">unique.</span>
                </h2>
                <p className="mt-4 max-w-sm text-eden-mute">Coque offerte avec chaque téléphone, capot et pochette offerts avec chaque ordinateur. Couleur, motif, inscription, accessoires : vous voyez le résultat en 3D avant de commander.</p>
              </div>
              <div className="relative mt-8 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {["#a7b9a5", "#b82e35", "#c6a36a", "#33312e", "#9fb4c7"].map((c) => (
                    <span key={c} className="h-9 w-9 rounded-full ring-2 ring-eden-ivory" style={{ background: c }} />
                  ))}
                </div>
                <span className="text-sm font-medium group-hover:underline">Essayer le studio →</span>
              </div>
            </Link>
          </Reveal>
          <Reveal delay={0.08}>
            <Link href="/import" className="group relative flex min-h-[26rem] flex-col justify-between overflow-hidden rounded-[2.25rem] bg-[#efe7da] p-8 sm:p-12">
              <div className="relative">
                <p className="eyebrow">Import sur commande</p>
                <h2 className="mt-3 font-display text-[clamp(1.9rem,1.2rem+2.2vw,3.2rem)] font-medium leading-[1.02] tracking-[-0.035em]">
                  Introuvable ici ? <span className="serif-accent">On le fait venir.</span>
                </h2>
                <p className="mt-4 max-w-sm text-eden-mute">Chine, Dubaï, Europe, États-Unis : Eden source le modèle exact, annonce un prix tout compris et un délai, puis contrôle le produit à son arrivée à Lomé.</p>
              </div>
              <div className="relative mt-8 flex flex-wrap items-center gap-2 text-xs text-eden-mute">
                {["Demande", "Proposition", "Commande", "Transit", "Livraison"].map((s, i) => (
                  <span key={s} className="flex items-center gap-2">
                    <span className="rounded-full bg-eden-porcelain px-3 py-1.5">{s}</span>
                    {i < 4 && <span aria-hidden>→</span>}
                  </span>
                ))}
              </div>
            </Link>
          </Reveal>
        </Container>
      </section>

      {/* Eden Gift */}
      <section className="bg-eden-porcelain py-24" aria-labelledby="gift-title">
        <Container>
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.25rem] bg-[#efe7da] px-6 py-14 sm:px-14 sm:py-20">
              <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9),transparent_65%)]" />
              <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
                <div>
                  <p className="eyebrow">Eden Gift</p>
                  <h2 id="gift-title" className="mt-3 font-display text-[clamp(2rem,1.3rem+2.6vw,3.6rem)] font-medium leading-[1.02] tracking-[-0.035em]">
                    Offrir juste. <span className="serif-accent">Sans chercher.</span>
                  </h2>
                  <p className="mt-5 max-w-md text-eden-mute">Pour qui, quelle occasion, quel budget : quatre questions, une sélection pensée pour la personne, puis l&apos;emballage et le message.</p>
                  <ButtonLink href="/eden-gift" className="mt-8 px-7 py-4">Composer un cadeau</ButtonLink>
                </div>
                <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {["Le destinataire", "L'occasion", "Le budget", "Ses goûts", "La sélection", "La présentation"].map((s, i) => (
                    <li key={s} className="rounded-2xl bg-eden-porcelain/80 p-4">
                      <span className="font-serif text-2xl italic text-eden-red">{i + 1}</span>
                      <p className="mt-1 text-sm">{s}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Seulement chez Eden */}
      {enabledServices.length > 0 && (
        <section className="bg-eden-porcelain pb-10" aria-label="Seulement chez Eden">
          <Container>
            <h2 className="font-display text-[clamp(1.6rem,1.1rem+1.8vw,2.6rem)] font-medium tracking-[-0.03em]">
              Seulement chez Eden. <span className="serif-accent">Bien plus qu&apos;un achat.</span>
            </h2>
          </Container>
          <div className="mt-6">
            <Shelf label="Services Eden">
              {enabledServices.map((s) => (
                <Link key={s.key} href={s.href} className="group flex min-h-60 flex-col rounded-[var(--radius-card)] bg-eden-ivory p-7 transition duration-500 hover:-translate-y-1 hover:bg-[#efe7da]">
                  <span className="eyebrow">{s.eyebrow}</span>
                  <span className="mt-4 font-display text-xl font-medium leading-snug tracking-tight">{s.title}</span>
                  <span className="mt-2 text-sm text-eden-mute">{s.text}</span>
                  <span className="mt-auto pt-6 text-sm font-medium group-hover:underline">En savoir plus →</span>
                </Link>
              ))}
            </Shelf>
          </div>
        </section>
      )}
    </>
  );
}
