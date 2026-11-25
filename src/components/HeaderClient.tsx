"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const NAV = [
  { href: "/boutique", label: "Boutique" },
  { href: "/trouver", label: "Trouver mon produit" },
  { href: "/eden-gift", label: "Eden Gift" },
  { href: "/professionnels", label: "Professionnels" },
  { href: "/comment-ca-marche", label: "Comment ça marche" },
];

const iconBtn = "relative grid h-10 w-10 place-items-center rounded-full transition hover:bg-eden-charcoal/5";

export function HeaderClient({ count, accountHref, signedIn, name }: { count: number; accountHref: string; signedIn: boolean; name: string | null }) {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMenu(false);
    setSearch(false);
  }, [pathname]);
  useEffect(() => {
    if (search) inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (setSearch(false), setMenu(false));
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [search]);
  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
  }, [menu]);

  return (
    <div className="ml-auto flex items-center gap-1 lg:ml-0">
      <button className={iconBtn} aria-label="Rechercher" onClick={() => setSearch((v) => !v)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      </button>
      <Link href={accountHref} className={iconBtn} aria-label={signedIn ? `Mon espace (${name})` : "Se connecter"}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
        {signedIn && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-eden-botanical" aria-hidden />}
      </Link>
      <Link href="/panier" className={iconBtn} aria-label={`Panier, ${count} article${count > 1 ? "s" : ""}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" /><circle cx="10" cy="20" r="1.3" /><circle cx="17" cy="20" r="1.3" /></svg>
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-eden-red px-1 text-[11px] font-bold text-white">{count}</span>
        )}
      </Link>
      <button className={`${iconBtn} lg:hidden`} aria-label="Menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {menu ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h10" />}
        </svg>
      </button>

      <AnimatePresence>
        {search && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute inset-x-0 top-16 border-b border-eden-charcoal/5 bg-eden-porcelain/95 backdrop-blur-xl"
          >
            <form
              className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-5"
              onSubmit={(e) => {
                e.preventDefault();
                const q = inputRef.current?.value.trim();
                if (q) router.push(`/boutique?q=${encodeURIComponent(q)}`);
              }}
            >
              <input
                ref={inputRef}
                name="q"
                placeholder="Rechercher un produit, une marque…"
                className="w-full rounded-full border border-eden-charcoal/10 bg-white px-5 py-3 text-eden-charcoal placeholder:text-eden-mute outline-none focus:border-eden-botanical"
              />
              <button className="rounded-full bg-eden-charcoal px-5 py-3 text-sm font-medium text-eden-porcelain">Rechercher</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {menu && (
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 bottom-0 top-16 z-40 bg-eden-porcelain px-6 py-6 lg:hidden"
            aria-label="Menu mobile"
          >
            <ul className="space-y-1">
              {NAV.map((n, i) => (
                <motion.li key={n.href} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                  <Link href={n.href} className="flex items-center justify-between border-b border-eden-charcoal/10 py-4 font-display text-2xl font-medium">
                    {n.label}
                    <span className="text-eden-gold-2">→</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
            <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
              <Link href={accountHref} className="rounded-2xl bg-eden-ivory p-4">{signedIn ? "Mon espace" : "Se connecter"}</Link>
              <Link href="/panier" className="rounded-2xl bg-eden-ivory p-4">Panier ({count})</Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
