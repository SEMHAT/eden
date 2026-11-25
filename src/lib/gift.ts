// Eden Gift — sélection déterministe de cadeaux selon destinataire, occasion, budget et goûts.
import type { RecoProduct } from "./reco";

export const RECIPIENTS = [
  { id: "elle", label: "Pour elle" },
  { id: "lui", label: "Pour lui" },
  { id: "ado", label: "Un ado" },
  { id: "parent", label: "Un parent" },
  { id: "collegue", label: "Un collègue" },
  { id: "moi", label: "Pour moi" },
] as const;

export const OCCASIONS = [
  { id: "anniversaire", label: "Anniversaire" },
  { id: "saint-valentin", label: "Saint-Valentin" },
  { id: "fetes", label: "Fêtes de fin d'année" },
  { id: "diplome", label: "Diplôme, réussite" },
  { id: "mariage", label: "Mariage" },
  { id: "merci", label: "Remerciement" },
] as const;

export const PREFERENCES = [
  { id: "musique", label: "Musique" },
  { id: "sport", label: "Sport, bien-être" },
  { id: "gaming", label: "Jeux vidéo" },
  { id: "photo", label: "Photo, réseaux sociaux" },
  { id: "travail", label: "Travail, études" },
  { id: "pratique", label: "Pratique au quotidien" },
] as const;

export type GiftInput = { recipient: string; occasion: string; budget: number; preferences: string[] };

export type GiftPick = { product: RecoProduct; score: number; why: string[] };

const PREF_TO_USAGE: Record<string, string[]> = {
  musique: ["musique"],
  sport: ["sport"],
  gaming: ["gaming"],
  photo: ["photo"],
  travail: ["bureautique", "programmation", "appels", "etudiant"],
  pratique: ["autonomie", "voyage"],
};

export function pickGifts(products: (RecoProduct & { giftTags: string[] })[], input: GiftInput, limit = 6): GiftPick[] {
  const picks: GiftPick[] = [];
  for (const p of products) {
    if (p.price === null || p.availability === null || p.availability === "OUT_OF_STOCK") continue;
    if (p.price > input.budget) continue;
    let score = 0;
    const why: string[] = [];
    if (p.giftTags.includes(input.recipient)) {
      score += 20;
      why.push("Souvent choisi pour ce type de destinataire");
    }
    if (p.giftTags.includes(input.occasion)) {
      score += 8;
      why.push("Adapté à l'occasion");
    }
    for (const pref of input.preferences) {
      const usages = PREF_TO_USAGE[pref] ?? [];
      if (usages.some((u) => p.usageTags.includes(u))) {
        score += 15;
        why.push(`Colle à son goût : ${PREFERENCES.find((x) => x.id === pref)?.label.toLowerCase()}`);
      }
    }
    if (score === 0) continue;
    score += 10 * (p.price / input.budget);
    score += Math.min(p.popularity, 100) / 20;
    if (p.availability === "CONFIRMED") score += 3;
    picks.push({ product: p, score, why });
  }
  return picks.sort((a, b) => b.score - a.score).slice(0, limit);
}
