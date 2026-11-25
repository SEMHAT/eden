"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { setCompare, useCompare, MAX_COMPARE } from "./compare-store";

export function CompareBar() {
  const ids = useCompare();
  const pathname = usePathname();
  const show = ids.length > 0 && pathname !== "/comparer" && !pathname.startsWith("/admin") && !pathname.startsWith("/vendeur");
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-xl items-center gap-3 rounded-full bg-eden-charcoal/95 py-2 pl-5 pr-2 text-sm text-eden-ivory shadow-2xl backdrop-blur"
          role="region"
          aria-label="Comparaison"
        >
          <span className="flex-1">
            {ids.length} produit{ids.length > 1 ? "s" : ""} à comparer <span className="text-eden-ivory/50">(max. {MAX_COMPARE})</span>
          </span>
          <button onClick={() => setCompare([])} className="rounded-full px-3 py-2 text-eden-ivory/70 hover:text-eden-ivory">
            Vider
          </button>
          <Link href={`/comparer?ids=${ids.join(",")}`} className="rounded-full bg-eden-gold px-4 py-2 font-semibold text-eden-green">
            Comparer
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
