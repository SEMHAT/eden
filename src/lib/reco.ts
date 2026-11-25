// Moteur « Trouver mon produit » — déterministe, sans IA simulée.
// 1. comprend la demande (budget, catégorie, usages)
// 2. en déduit des critères techniques
// 3. note chaque produit du catalogue disposant d'une offre vendeur
// 4. classe et explique les différences.

export type Specs = Record<string, string | number | boolean | undefined>;

export type RecoProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categorySlug: string; // racine
  subCategorySlug?: string | null;
  specs: Specs;
  usageTags: string[];
  popularity: number;
  price: number | null; // meilleur prix EDEN ; null = aucune offre
  availability: "CONFIRMED" | "TO_CONFIRM" | "OUT_OF_STOCK" | null;
  illustration?: string;
  color?: string;
};

export type ParsedQuery = {
  budget: number | null;
  category: string | null;
  usages: string[];
  minRam: number | null;
  text: string;
};

const strip = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  ordinateurs: ["ordinateur", "ordi", "pc", "laptop", "portable", "macbook", "notebook", "tablette"],
  smartphones: ["telephone", "smartphone", "phone", "iphone", "android", "mobile", "galaxy"],
  "audio-accessoires": ["casque", "ecouteur", "airpods", "enceinte", "audio", "montre", "watch", "son"],
  gaming: ["console", "manette", "playstation", "ps5", "xbox", "switch", "gaming"],
  energie: ["powerbank", "power bank", "batterie externe", "chargeur", "recharge", "onduleur", "solaire"],
  bureau: ["imprimante", "ecran", "moniteur", "clavier", "souris", "bureau", "webcam"],
};

export const USAGE_KEYWORDS: Record<string, string[]> = {
  programmation: ["program", "coder", "code", "developp", "informatique", "dev web"],
  montage: ["montage", "video", "premiere", "davinci", "after effects", "youtube"],
  graphisme: ["graphis", "design", "photoshop", "illustrator", "3d", "blender"],
  gaming: ["jeu", "jeux", "gaming", "gamer", "jouer", "fortnite", "fifa", "ea fc", "pubg", "free fire"],
  photo: ["photo", "camera", "selfie", "instagram", "tiktok", "filmer"],
  bureautique: ["bureautique", "word", "excel", "travail", "cours", "etude", "administratif"],
  etudiant: ["etudiant", "eleve", "ecole", "universite", "fac", "lycee"],
  autonomie: ["autonomie", "batterie qui dure", "longue duree", "tient la charge"],
  musique: ["musique", "basse", "ecouter", "podcast"],
  sport: ["sport", "course", "running", "fitness", "salle"],
  voyage: ["voyage", "leger", "deplacement", "transport"],
  appels: ["appel", "reunion", "teletravail", "visio", "zoom", "teams"],
};

/** Extrait un budget en FCFA d'un texte libre. */
export function parseBudget(input: string): number | null {
  const t = strip(input).replace(/,(\d)/g, ".$1");
  const mill = t.match(/(\d+(?:\.\d+)?)\s*million/);
  if (mill) return Math.round(parseFloat(mill[1]) * 1_000_000);
  const re = /(\d{1,3}(?:[ .  ]\d{3})+|\d+)\s*(k|mille|000)?\s*(go|gb|mp|mah|pouces|"|w|hz|ans?)?/g;
  let best: number | null = null;
  for (const m of t.matchAll(re)) {
    if (m[3]) continue; // une caractéristique, pas un prix
    let n = parseInt(m[1].replace(/[ .  ]/g, ""), 10);
    if (m[2] === "k" || m[2] === "mille") n *= 1000;
    if (n >= 5000 && (best === null || n > best)) best = n;
  }
  return best;
}

export function parseQuery(input: string): ParsedQuery {
  const t = strip(input);
  let category: string | null = null;
  let firstIdx = Infinity;
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const w of words) {
      const i = t.indexOf(w);
      if (i >= 0 && i < firstIdx) {
        firstIdx = i;
        category = cat;
      }
    }
  }
  const usages = Object.entries(USAGE_KEYWORDS)
    .filter(([, words]) => words.some((w) => t.includes(w)))
    .map(([u]) => u);
  // « jeu » dans « console de jeu » ne change pas la catégorie ; une console seule reste gaming.
  const ramMatch = t.match(/(\d{1,2})\s*(go|gb)\s*(de\s*)?(ram|memoire)/);
  return {
    budget: parseBudget(input),
    category,
    usages,
    minRam: ramMatch ? parseInt(ramMatch[1], 10) : null,
    text: input,
  };
}

type Scored = { product: RecoProduct; score: number; reasons: string[]; warnings: string[] };

const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN);

/** Critères techniques par usage. Chaque règle rapporte des points et une explication. */
function usageRules(p: RecoProduct, usage: string): { pts: number; reason?: string; warning?: string } {
  const s = p.specs;
  const ram = num(s.ram);
  const cpuTier = num(s.cpuTier);
  const isComputer = p.categorySlug === "ordinateurs";
  const isPhone = p.categorySlug === "smartphones";
  const tagged = p.usageTags.includes(usage) ? 10 : 0;

  switch (usage) {
    case "programmation":
      if (isComputer) {
        let pts = tagged;
        if (ram >= 16) pts += 20;
        else if (ram >= 8) pts += 12;
        else return { pts: -15, warning: `${ram} Go de RAM, juste pour programmer` };
        if (s.storageType === "SSD") pts += 8;
        if (cpuTier >= 3) pts += 8;
        return { pts, reason: `${ram} Go de RAM et ${s.storageType ?? "stockage"} ${s.storage} Go : confortable pour coder` };
      }
      return { pts: tagged };
    case "montage":
    case "graphisme":
      if (isComputer) {
        let pts = tagged;
        if (ram >= 16) pts += 20;
        else return { pts: -20, warning: `${ram} Go de RAM : limité pour le ${usage}` };
        if (cpuTier >= 4) pts += 15;
        if (s.gpuDedicated) pts += 15;
        return {
          pts,
          reason: s.gpuDedicated
            ? `Carte graphique dédiée (${s.gpu}) et ${ram} Go de RAM : adapté au ${usage}`
            : `${ram} Go de RAM et processeur ${s.cpu}`,
        };
      }
      if (isPhone && usage === "montage") return { pts: tagged + (ram >= 8 ? 8 : 0) };
      return { pts: tagged };
    case "gaming":
      if (isComputer) {
        if (!s.gpuDedicated) return { pts: -10, warning: "Pas de carte graphique dédiée : jeux légers seulement" };
        return { pts: tagged + 25, reason: `Carte graphique ${s.gpu} pour jouer` };
      }
      if (isPhone) return ram >= 8 ? { pts: tagged + 12, reason: `${ram} Go de RAM, fluide en jeu` } : { pts: tagged };
      return { pts: tagged + (p.categorySlug === "gaming" ? 15 : 0) };
    case "photo":
      if (isPhone) {
        const mp = num(s.camera);
        if (mp >= 100) return { pts: tagged + 20, reason: `Capteur principal ${mp} MP` };
        if (mp >= 50) return { pts: tagged + 12, reason: `Capteur principal ${mp} MP` };
        return { pts: tagged };
      }
      return { pts: tagged };
    case "autonomie": {
      const bat = num(s.battery);
      if (isPhone && bat >= 5000) return { pts: tagged + 15, reason: `Batterie de ${bat} mAh` };
      const h = num(s.autonomy);
      if (h >= 20) return { pts: tagged + 12, reason: `Jusqu'à ${h} h d'autonomie annoncée` };
      return { pts: tagged };
    }
    case "voyage": {
      const w = num(s.weight);
      if (isComputer && w > 0 && w <= 1.5) return { pts: tagged + 10, reason: `Léger : ${w} kg` };
      return { pts: tagged };
    }
    default:
      return { pts: tagged };
  }
}

export function scoreProduct(p: RecoProduct, q: ParsedQuery): Scored | null {
  if (p.price === null || p.availability === "OUT_OF_STOCK" || p.availability === null) return null;
  if (q.category && p.categorySlug !== q.category) return null;
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = Math.min(p.popularity, 100) / 10; // 0 à 10

  if (q.budget) {
    if (p.price > q.budget * 1.1) return null;
    if (p.price > q.budget) {
      score -= 15;
      warnings.push("Légèrement au-dessus de votre budget");
    } else {
      // on valorise l'utilisation du budget : un produit à 90 % du budget est souvent plus adapté qu'un produit à 30 %
      score += 20 * (p.price / q.budget);
    }
  }

  if (q.minRam !== null) {
    const ram = num(p.specs.ram);
    if (ram >= q.minRam) {
      score += 10;
      reasons.push(`${ram} Go de RAM, comme demandé`);
    } else return null;
  }

  for (const u of q.usages) {
    const r = usageRules(p, u);
    score += r.pts;
    if (r.reason) reasons.push(r.reason);
    if (r.warning) warnings.push(r.warning);
  }

  if (p.availability === "CONFIRMED") {
    score += 5;
    reasons.push("Disponibilité confirmée récemment par un vendeur");
  }
  return { product: p, score, reasons, warnings };
}

export function recommend(products: RecoProduct[], q: ParsedQuery, limit = 6): Scored[] {
  return products
    .map((p) => scoreProduct(p, q))
    .filter((x): x is Scored => x !== null)
    .sort((a, b) => b.score - a.score || (a.product.price ?? 0) - (b.product.price ?? 0))
    .slice(0, limit);
}

const SPEC_COMPARE: { key: string; label: string; unit: string }[] = [
  { key: "ram", label: "de mémoire vive", unit: "Go" },
  { key: "storage", label: "de stockage", unit: "Go" },
  { key: "camera", label: "de capteur photo", unit: "MP" },
  { key: "battery", label: "de batterie", unit: "mAh" },
  { key: "autonomy", label: "d'autonomie", unit: "h" },
  { key: "capacity", label: "de capacité", unit: "mAh" },
];

/** Explique en français ce qui distingue b par rapport à a. */
export function explainDifference(a: RecoProduct, b: RecoProduct): string[] {
  const out: string[] = [];
  if (a.price !== null && b.price !== null && a.price !== b.price) {
    const d = Math.abs(a.price - b.price);
    out.push(
      b.price < a.price
        ? `${b.name} coûte ${d.toLocaleString("fr-FR").replace(/ | /g, " ")} FCFA de moins`
        : `${b.name} coûte ${d.toLocaleString("fr-FR").replace(/ | /g, " ")} FCFA de plus`,
    );
  }
  for (const { key, label, unit } of SPEC_COMPARE) {
    const va = num(a.specs[key]);
    const vb = num(b.specs[key]);
    if (Number.isFinite(va) && Number.isFinite(vb) && va !== vb) {
      out.push(`${vb > va ? "plus" : "moins"} ${label} (${vb} ${unit} contre ${va} ${unit})`);
    }
  }
  if (a.specs.gpuDedicated !== b.specs.gpuDedicated && b.categorySlug === "ordinateurs") {
    out.push(b.specs.gpuDedicated ? "une carte graphique dédiée" : "pas de carte graphique dédiée");
  }
  return out;
}
