import Link from "next/link";
import Image from "next/image";

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
    <footer className="mt-24 bg-eden-green text-eden-ivory print:hidden">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap gap-x-8 gap-y-3 border-b border-white/10 py-6 text-sm">
          {quick.map((q) => (
            <Link key={q.href} href={q.href} className="text-eden-ivory/80 hover:text-eden-gold">
              {q.label}
            </Link>
          ))}
        </div>
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Image src="/brand/eden-logo.webp" alt="" width={30} height={39} className="h-10 w-auto" />
              <span className="font-display text-2xl font-bold">EDEN</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-eden-ivory/70">Dis-nous ton budget. On s&apos;occupe du reste.</p>
            <p className="mt-2 text-sm text-eden-ivory/50">Lomé, Togo</p>
          </div>
          <FooterCol title="Boutique" links={[["/boutique?categorie=smartphones", "Smartphones"], ["/boutique?categorie=ordinateurs", "Ordinateurs"], ["/boutique?categorie=audio-accessoires", "Audio et accessoires"], ["/boutique?categorie=gaming", "Gaming"], ["/boutique?categorie=energie", "Énergie et recharge"], ["/boutique?categorie=bureau", "Équipements de bureau"]]} />
          <FooterCol title="Services" links={[["/trouver", "Trouver mon produit"], ["/eden-gift", "Eden Gift"], ["/comparer", "Comparer"], ["/comment-ca-marche", "Comment ça marche"]]} />
          <FooterCol title="Espaces" links={[["/compte", "Espace client"], ["/espace-pro", "Espace professionnel"], ["/vendeur", "Espace vendeur"], ["/professionnels", "Demander un devis"]]} />
        </div>
        {demo && (
          <p className="border-t border-white/10 py-5 text-xs text-eden-gold/90">
            Version de démonstration : le catalogue, les prix et les vendeurs affichés sont fictifs et servent à tester la plateforme. Aucune commande n&apos;est livrée et aucun paiement n&apos;est encaissé.
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-eden-ivory/50">
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
      <p className="text-xs font-semibold uppercase tracking-widest text-eden-gold">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-eden-ivory/75 hover:text-eden-ivory">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
