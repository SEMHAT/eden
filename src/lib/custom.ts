// Eden Studio — règles de personnalisation, partagées par l'aperçu (client) et la validation (serveur).
// Les prix sont recalculés côté serveur à partir de ces règles : le client ne fixe jamais un montant.

export type CustomKind = "phone" | "laptop";

export const COLORS = [
  { id: "ivoire", label: "Ivoire", hex: "#f2ece1" },
  { id: "sauge", label: "Sauge", hex: "#a7b9a5" },
  { id: "botanique", label: "Vert botanique", hex: "#66866d" },
  { id: "pomme", label: "Rouge pomme", hex: "#b82e35" },
  { id: "champagne", label: "Champagne", hex: "#c6a36a" },
  { id: "graphite", label: "Graphite", hex: "#33312e" },
  { id: "ciel", label: "Bleu poudré", hex: "#9fb4c7" },
  { id: "rose", label: "Rose argile", hex: "#d6a79c" },
] as const;

export const PATTERNS = [
  { id: "uni", label: "Uni" },
  { id: "monogramme", label: "Monogramme EDEN" },
  { id: "lignes", label: "Lignes fines" },
  { id: "geometrique", label: "Géométrique" },
  { id: "feuillage", label: "Feuillage" },
] as const;

type Option = { id: string; label: string; price: number; note?: string };

export const CASE_STYLES: Option[] = [
  { id: "silicone", label: "Silicone doux", price: 0, note: "Offerte avec votre téléphone" },
  { id: "transparente", label: "Transparente", price: 0, note: "Offerte avec votre téléphone" },
  { id: "renforcee", label: "Renforcée anti-chocs", price: 3000 },
  { id: "cuir", label: "Cuir végétal", price: 6000 },
];

export const SKIN_FINISHES: Option[] = [
  { id: "mat", label: "Mat velours", price: 0, note: "Offert avec votre ordinateur" },
  { id: "brillant", label: "Brillant", price: 0, note: "Offert avec votre ordinateur" },
  { id: "marbre", label: "Effet marbre", price: 4000 },
  { id: "bois", label: "Effet bois", price: 4000 },
];

export const SLEEVES: Option[] = [
  { id: "aucune", label: "Sans pochette", price: 0 },
  { id: "neoprene", label: "Pochette néoprène", price: 0, note: "Offerte avec votre ordinateur" },
  { id: "cuir", label: "Pochette cuir végétal", price: 9000 },
];

export const ACCESSORIES: Record<CustomKind, Option[]> = {
  phone: [
    { id: "verre", label: "Verre trempé posé", price: 3000 },
    { id: "chargeur", label: "Chargeur rapide 25 W", price: 8000 },
    { id: "cable", label: "Câble tressé 1 m", price: 3500 },
    { id: "support", label: "Support voiture magnétique", price: 5000 },
  ],
  laptop: [
    { id: "souris", label: "Souris sans fil", price: 6000 },
    { id: "hub", label: "Adaptateur USB-C 6 en 1", price: 12000 },
    { id: "support", label: "Support ergonomique", price: 9000 },
    { id: "clavier-film", label: "Protection de clavier", price: 2500 },
  ],
};

export const TEXT_PRICE = 1000;
export const MAX_TEXT = 12;

export type Customization = {
  kind: CustomKind;
  style: string; // style de coque ou finition du capot
  color: string;
  pattern: string;
  text: string;
  sleeve?: string; // ordinateurs
  sleeveColor?: string;
  accessories: string[];
};

export function customKindFor(illustration: string): CustomKind | null {
  if (illustration === "phone") return "phone";
  if (illustration === "laptop") return "laptop";
  return null;
}

export function defaultCustomization(kind: CustomKind): Customization {
  return kind === "phone"
    ? { kind, style: "silicone", color: "sauge", pattern: "uni", text: "", accessories: [] }
    : { kind, style: "mat", color: "champagne", pattern: "uni", text: "", sleeve: "neoprene", sleeveColor: "graphite", accessories: [] };
}

/** Valide et normalise une personnalisation reçue du client. Retourne null si invalide. */
export function sanitize(input: unknown, kind: CustomKind): Customization | null {
  if (!input || typeof input !== "object") return null;
  const i = input as Record<string, unknown>;
  const styles = kind === "phone" ? CASE_STYLES : SKIN_FINISHES;
  const style = String(i.style ?? "");
  const color = String(i.color ?? "");
  const pattern = String(i.pattern ?? "uni");
  if (!styles.some((s) => s.id === style)) return null;
  if (!COLORS.some((c) => c.id === color)) return null;
  if (!PATTERNS.some((p) => p.id === pattern)) return null;
  const text = String(i.text ?? "")
    .normalize("NFC")
    .replace(/[^\p{L}\p{N} .&'-]/gu, "")
    .trim()
    .slice(0, MAX_TEXT);
  const accessories = Array.isArray(i.accessories) ? [...new Set(i.accessories.map(String))].filter((a) => ACCESSORIES[kind].some((o) => o.id === a)) : [];
  const out: Customization = { kind, style, color, pattern, text, accessories };
  if (kind === "laptop") {
    const sleeve = String(i.sleeve ?? "aucune");
    const sleeveColor = String(i.sleeveColor ?? "graphite");
    if (!SLEEVES.some((s) => s.id === sleeve)) return null;
    if (!COLORS.some((c) => c.id === sleeveColor)) return null;
    out.sleeve = sleeve;
    out.sleeveColor = sleeveColor;
  }
  return out;
}

/** Supplément par unité, en FCFA. */
export function customFee(c: Customization): number {
  const styles = c.kind === "phone" ? CASE_STYLES : SKIN_FINISHES;
  let fee = styles.find((s) => s.id === c.style)?.price ?? 0;
  if (c.text) fee += TEXT_PRICE;
  if (c.kind === "laptop") fee += SLEEVES.find((s) => s.id === c.sleeve)?.price ?? 0;
  for (const a of c.accessories) fee += ACCESSORIES[c.kind].find((o) => o.id === a)?.price ?? 0;
  return fee;
}

/** Résumé lisible, pour le panier, la commande et l'administration. */
export function describe(c: Customization): string[] {
  const color = COLORS.find((x) => x.id === c.color)?.label ?? c.color;
  const pattern = PATTERNS.find((x) => x.id === c.pattern)?.label ?? c.pattern;
  const lines: string[] = [];
  if (c.kind === "phone") lines.push(`Coque ${CASE_STYLES.find((s) => s.id === c.style)?.label.toLowerCase()}, ${color.toLowerCase()}, ${pattern.toLowerCase()}`);
  else lines.push(`Capot ${SKIN_FINISHES.find((s) => s.id === c.style)?.label.toLowerCase()}, ${color.toLowerCase()}, ${pattern.toLowerCase()}`);
  if (c.text) lines.push(`Inscription « ${c.text} »`);
  if (c.kind === "laptop" && c.sleeve && c.sleeve !== "aucune") {
    const sc = COLORS.find((x) => x.id === c.sleeveColor)?.label.toLowerCase();
    lines.push(`${SLEEVES.find((s) => s.id === c.sleeve)?.label}${sc ? `, ${sc}` : ""}`);
  }
  for (const a of c.accessories) lines.push(ACCESSORIES[c.kind].find((o) => o.id === a)?.label ?? a);
  return lines;
}

export const hexOf = (id: string) => COLORS.find((c) => c.id === id)?.hex ?? "#a7b9a5";
