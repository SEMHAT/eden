"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import clsx from "clsx";
import { addToCart } from "@/actions/cart";
import { toggleCompare, useCompare } from "./compare-store";

function SubmitAdd({ compact, label }: { compact?: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full bg-eden-green font-semibold text-eden-ivory transition hover:bg-eden-green-2 disabled:opacity-60",
        compact ? "h-10 w-10" : "px-5 py-2.5 text-sm",
      )}
      aria-label={label}
    >
      {pending ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-eden-ivory/40 border-t-eden-ivory" />
      ) : compact ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
      ) : (
        label
      )}
    </button>
  );
}

export function AddToCart({ productId, compact, label = "Ajouter au panier", quantity }: { productId: string; compact?: boolean; label?: string; quantity?: boolean }) {
  const [state, action] = useActionState(addToCart, null);
  const [qty, setQty] = useState(1);
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="productId" value={productId} />
      {quantity && (
        <div className="flex items-center rounded-full border border-eden-charcoal/15 bg-white">
          <button type="button" className="h-10 w-10 text-lg" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuer la quantité">−</button>
          <input name="quantity" value={qty} readOnly className="w-8 bg-transparent text-center text-sm font-semibold" aria-label="Quantité" />
          <button type="button" className="h-10 w-10 text-lg" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Augmenter la quantité">+</button>
        </div>
      )}
      <SubmitAdd compact={compact} label={label} />
      <span role="status" aria-live="polite" className={clsx("text-xs", state?.error ? "text-eden-red" : "text-eden-green", compact && "sr-only")}>
        {state?.error ?? (state?.ok ? state.message : "")}
      </span>
    </form>
  );
}

export function CompareToggle({ productId, className }: { productId: string; className?: string }) {
  const ids = useCompare();
  const active = ids.includes(productId);
  const [full, setFull] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setFull(!toggleCompare(productId))}
      aria-pressed={active}
      className={clsx("inline-flex items-center gap-1.5 text-xs font-medium transition", active ? "text-eden-green" : "text-eden-mute hover:text-eden-green", className)}
    >
      <span className={clsx("grid h-4 w-4 place-items-center rounded border", active ? "border-eden-green bg-eden-green text-white" : "border-eden-charcoal/30")}>
        {active && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="m5 12 5 5 9-10" /></svg>}
      </span>
      {full && !active ? "4 produits maximum" : "Comparer"}
    </button>
  );
}
