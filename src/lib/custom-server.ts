import { describe, sanitize, type CustomKind } from "./custom";

/** Résumé lisible d'une personnalisation enregistrée (JSON en base). */
export function describeCustom(raw: unknown): string[] {
  const kind = (raw as { kind?: CustomKind } | null)?.kind;
  if (kind !== "phone" && kind !== "laptop") return [];
  const c = sanitize(raw, kind);
  return c ? describe(c) : [];
}
