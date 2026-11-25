import Link from "next/link";
import Image from "next/image";
import { ReplayIntro } from "./intro/ReplayIntro";

const quick = [
  { href: "/compte", label: "Suivre ma commande" },
  { href: "/comment-ca-marche", label: "Aide à l'achat" },
  { href: "/compte#reclamations", label: "Retours et réclamations" },
  { href: "/compte#favoris", label: "Mes favoris" },
  { href: "/inscription?type=vendeur", label: "Devenir vendeur partenaire" },
];

export function Footer() {
  const demo = process.env.DEMO_MODE === "true";
  return (
    <footer className="mt-28 border-t border-eden-charcoal/[0.06] bg-eden-ivory text-eden-charcoal print:hidden">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap gap-x-8 gap-y-3 border-b border-eden-charcoal/[0.08] py-6 text-sm">
          {quick.map((q) => (
            <Link key={q.href} href={q.href} className="text-eden-charcoal/70 hover:text-eden-charcoal">
              {q.label}
            </Link>
          ))}
        </div>
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <Image src="/brand/eden-logo.webp" alt="" width={30} height={39} className="h-10 w-auto" />
              <span className="font-display text-xl font-semibold tracking-[0.18em]">EDEN</span>
            </div>
            <p className="mt-5 max-w-xs font-serif text-xl italic text-eden-botanical">La technologie mérite une autre expérience.</p>
            <p className="mt-3 text-sm text-eden-mute">Lomé, Togo</p>
            <div className="mt-5"><ReplayIntro /></div>
          </div>
          <FooterCol title="Boutique" links={[["/boutique?categorie=smartphones", "Smartphones"], ["/boutique?categorie=ordinateurs", "Ordinateurs"], ["/boutique?categorie=audio-accessoires", "Audio et accessoires"], ["/boutique?categorie=gaming", "Gaming"], ["/boutique?categorie=energie", "Énergie et recharge"], ["/boutique?categorie=bureau", "Équipements de bureau"]]} />
          <FooterCol title="Services" links={[["/trouver", "Trouver mon produit"], ["/eden-gift", "Eden Gift"], ["/comparer", "Comparer"], ["/comment-ca-marche", "Comment ça marche"]]} />
          <FooterCol title="Espaces" links={[["/compte", "Espace client"], ["/espace-pro", "Espace professionnel"], ["/vendeur", "Espace vendeur"], ["/professionnels", "Demander un devis"]]} />
        </div>
        {demo && (
          <p className="border-t border-eden-charcoal/[0.08] py-5 text-xs text-eden-gold-2">
            Version de démonstration : le catalogue, les prix et les vendeurs affichés sont fictifs et servent à tester la plateforme. Aucune commande n&apos;est livrée et aucun paiement n&apos;est encaissé.
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-eden-charcoal/[0.08] py-6 text-xs text-eden-mute">
          <span>© {new Date().getFullYear()} Eden. Tous droits réservés.</span>
          <span>Les marques citées appartiennent à leurs propriétaires respectifs. Eden est un revendeur indépendant.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="eyebrow">{title}</p>
      <ul className="mt-5 space-y-2.5 text-sm">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-eden-charcoal/70 hover:text-eden-charcoal">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
