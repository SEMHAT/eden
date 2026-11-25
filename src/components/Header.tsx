import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { cartCount } from "@/lib/cart";
import { HeaderClient } from "./HeaderClient";

export const NAV = [
  { href: "/boutique", label: "Boutique" },
  { href: "/trouver", label: "Trouver mon produit" },
  { href: "/eden-gift", label: "Eden Gift" },
  { href: "/professionnels", label: "Professionnels" },
  { href: "/comment-ca-marche", label: "Comment ça marche" },
];

export async function Header() {
  const [session, count] = await Promise.all([getSession(), cartCount().catch(() => 0)]);
  const accountHref = !session ? "/connexion" : session.role === "ADMIN" ? "/admin" : session.role === "VENDOR" ? "/vendeur" : session.role === "PRO" ? "/espace-pro" : "/compte";
  return (
    <header className="sticky top-0 z-50 print:hidden border-b border-white/5 bg-eden-green/90 text-eden-ivory backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Eden, accueil">
          <Image src="/brand/eden-logo.webp" alt="" width={30} height={39} priority className="h-9 w-auto drop-shadow" />
          <span className="leading-none">
            <span className="block font-display text-xl font-bold tracking-tight">EDEN</span>
            <span className="block text-[10px] tracking-wide text-eden-gold">Tech · Cadeaux · Bonheur</span>
          </span>
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label="Navigation principale">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-3.5 py-2 text-sm text-eden-ivory/85 transition hover:bg-white/5 hover:text-eden-ivory">
              {n.label}
            </Link>
          ))}
        </nav>
        <HeaderClient count={count} accountHref={accountHref} signedIn={Boolean(session)} name={session?.name ?? null} />
      </div>
    </header>
  );
}
