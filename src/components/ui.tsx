import Link from "next/link";
import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";
import { fcfa, dateTimeFr } from "@/lib/format";

type Variant = "gold" | "green" | "outline" | "outline-light" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  gold: "bg-eden-gold text-eden-charcoal hover:bg-[#d2b37f]",
  green: "bg-eden-charcoal text-eden-porcelain hover:bg-eden-green-2",
  outline: "border border-eden-charcoal/20 text-eden-charcoal hover:border-eden-charcoal hover:bg-eden-charcoal/[0.03]",
  "outline-light": "border border-eden-charcoal/20 text-eden-charcoal hover:border-eden-charcoal",
  ghost: "text-eden-charcoal hover:bg-eden-charcoal/5",
  danger: "border border-eden-red/30 text-eden-red hover:bg-eden-red/5",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium tracking-tight transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

export function Button({ variant = "green", className, ...p }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={clsx(base, variants[variant], className)} {...p} />;
}

export function ButtonLink({ variant = "green", className, ...p }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={clsx(base, variants[variant], className)} {...p} />;
}

export function Container({ className, ...p }: ComponentProps<"div">) {
  return <div className={clsx("mx-auto w-full max-w-7xl px-5 sm:px-8", className)} {...p} />;
}

export function Headline({ title, tagline, className, as: As = "h2" }: { title: string; tagline?: string; className?: string; as?: "h1" | "h2" }) {
  return (
    <As className={clsx("headline", className)}>
      {title} {tagline && <span>{tagline}</span>}
    </As>
  );
}

export function Card({ className, ...p }: ComponentProps<"div">) {
  return <div className={clsx("rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-soft)]", className)} {...p} />;
}

export function Badge({ tone = "neutral", className, children }: { tone?: "neutral" | "green" | "gold" | "red" | "dark"; className?: string; children: ReactNode }) {
  const tones = {
    neutral: "bg-eden-ivory-2 text-eden-charcoal",
    green: "bg-eden-sage/25 text-[#3f5a45]",
    gold: "bg-eden-gold/20 text-[#7a5a1c]",
    red: "bg-eden-red/10 text-eden-red",
    dark: "bg-eden-charcoal text-eden-porcelain",
  };
  return <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide", tones[tone], className)}>{children}</span>;
}

export function Availability({ level, confirmedAt, compact }: { level: "CONFIRMED" | "TO_CONFIRM" | "OUT_OF_STOCK"; confirmedAt?: Date | null; compact?: boolean }) {
  if (level === "CONFIRMED")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4d6b54]">
        <span className="h-2 w-2 rounded-full bg-eden-botanical" aria-hidden />
        {compact ? <><span className="sm:hidden">Disponible</span><span className="hidden sm:inline">Disponibilité confirmée</span></> : `Disponibilité confirmée${confirmedAt ? ` le ${dateTimeFr(confirmedAt)}` : ""}`}
      </span>
    );
  if (level === "TO_CONFIRM")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8a6a2a]">
        <span className="h-2 w-2 rounded-full bg-eden-gold" aria-hidden />
        {compact ? <><span className="sm:hidden">À confirmer</span><span className="hidden sm:inline">À confirmer auprès du vendeur</span></> : "À confirmer auprès du vendeur"}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-eden-red">
      <span className="h-2 w-2 rounded-full bg-eden-red" aria-hidden />
      Indisponible
    </span>
  );
}

export function Price({ value, className, prefix }: { value: number | null; className?: string; prefix?: string }) {
  if (value === null) return <span className={clsx("text-eden-mute", className)}>Prix sur demande</span>;
  return (
    <span className={clsx("font-display font-semibold tabular-nums", className)}>
      {prefix && <span className="mr-1 text-xs font-normal text-eden-mute">{prefix}</span>}
      {fcfa(value)}
    </span>
  );
}

const field = "w-full rounded-xl border border-eden-charcoal/15 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-eden-botanical focus:ring-2 focus:ring-eden-sage/30";

export function Input({ className, ...p }: ComponentProps<"input">) {
  return <input className={clsx(field, className)} {...p} />;
}
export function Select({ className, ...p }: ComponentProps<"select">) {
  return <select className={clsx(field, "appearance-none", className)} {...p} />;
}
export function Textarea({ className, ...p }: ComponentProps<"textarea">) {
  return <textarea className={clsx(field, "min-h-28", className)} {...p} />;
}
export function Label({ children, hint, className }: { children: ReactNode; hint?: string; className?: string }) {
  return (
    <span className={clsx("mb-1.5 block text-sm font-medium text-eden-charcoal", className)}>
      {children}
      {hint && <span className="ml-1 font-normal text-eden-mute">{hint}</span>}
    </span>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-eden-charcoal/15 bg-white/60 p-10 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      {text && <p className="mx-auto mt-2 max-w-md text-sm text-eden-mute">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, tagline, children }: { title: string; tagline?: string; children?: ReactNode }) {
  return (
    <div className="border-b border-eden-charcoal/5 bg-eden-ivory">
      <Container className="py-10 sm:py-14">
        <Headline as="h1" title={title} tagline={tagline} />
        {children}
      </Container>
    </div>
  );
}

export { fcfa };
