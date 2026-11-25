import "server-only";
import { db } from "./db";

// Services affichés dans « Seulement chez Eden. » — une carte n'apparaît que si le service est réellement actif.
export const SERVICES = [
  { key: "budget", eyebrow: "RECHERCHE", title: "Votre budget, notre point de départ.", text: "Dites ce que vous voulez dépenser, Eden trouve ce qui va avec.", href: "/trouver" },
  { key: "gift", eyebrow: "EDEN GIFT", title: "Le cadeau juste, en trois questions.", text: "Avec emballage et message personnalisé.", href: "/eden-gift" },
  { key: "verified", eyebrow: "VENDEURS", title: "Des vendeurs vérifiés.", text: "Chaque partenaire est validé par Eden avant de vendre.", href: "/comment-ca-marche" },
  { key: "confirmed", eyebrow: "DISPONIBILITÉ", title: "Une disponibilité confirmée.", text: "Le vendeur confirme avant que vous payiez quoi que ce soit.", href: "/comment-ca-marche" },
  { key: "check", eyebrow: "CONTRÔLE", title: "Un produit contrôlé.", text: "Vérifié selon les procédures Eden avant la livraison.", href: "/comment-ca-marche" },
  { key: "delivery", eyebrow: "LIVRAISON", title: "Une livraison suivie.", text: "Chaque étape de votre commande est visible en ligne.", href: "/comment-ca-marche" },
  { key: "bonus", eyebrow: "BONUS EDEN", title: "Des points à chaque achat.", text: "Échangeables contre des bonus de personnalisation.", href: "/compte" },
  { key: "pro", eyebrow: "PROFESSIONNELS", title: "Équipez vos équipes.", text: "Devis, commandes en quantité et facturation.", href: "/professionnels" },
  { key: "tradein", eyebrow: "REPRISE", title: "Votre ancien appareil vaut quelque chose.", text: "Reprise déduite du prix du nouveau.", href: "/comment-ca-marche" },
  { key: "installments", eyebrow: "PAIEMENT", title: "Payez en plusieurs fois.", text: "Selon conditions, sur les achats éligibles.", href: "/comment-ca-marche" },
] as const;

export const DEFAULT_ENABLED = ["budget", "gift", "verified", "confirmed", "check", "delivery", "bonus", "pro"];

export async function getEnabledServices(): Promise<string[]> {
  try {
    const s = await db.setting.findUnique({ where: { key: "services" } });
    return Array.isArray(s?.value) ? (s.value as string[]) : DEFAULT_ENABLED;
  } catch {
    return DEFAULT_ENABLED;
  }
}

export async function getDefaultMargin(): Promise<number> {
  const s = await db.setting.findUnique({ where: { key: "defaultMarginPct" } });
  return typeof s?.value === "number" ? s.value : 12;
}
