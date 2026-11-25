// Règles de prix et de disponibilité — fonctions pures, testées.

export const DEFAULT_MARGIN_PCT = 12;

/** Prix de vente EDEN arrondi à la centaine supérieure (FCFA). */
export function computeSalePrice(purchasePrice: number, marginPct: number = DEFAULT_MARGIN_PCT): number {
  if (!Number.isFinite(purchasePrice) || purchasePrice < 0) throw new Error("Prix d'achat invalide");
  // calcul en entiers (centièmes de pourcent) pour éviter les erreurs d'arrondi flottant
  const raw = (purchasePrice * Math.round((100 + marginPct) * 100)) / 10000;
  return Math.ceil(Math.round(raw * 100) / 100 / 100) * 100;
}

/** Durée pendant laquelle une confirmation vendeur reste valable. */
export const CONFIRMATION_TTL_HOURS = 72;

export type AvailabilityLevel = "CONFIRMED" | "TO_CONFIRM" | "OUT_OF_STOCK";

export function effectiveAvailability(
  availability: AvailabilityLevel,
  lastConfirmedAt: Date | null,
  now: Date = new Date(),
): AvailabilityLevel {
  if (availability === "OUT_OF_STOCK") return "OUT_OF_STOCK";
  if (availability === "CONFIRMED" && lastConfirmedAt) {
    const ageH = (now.getTime() - lastConfirmedAt.getTime()) / 36e5;
    if (ageH <= CONFIRMATION_TTL_HOURS) return "CONFIRMED";
  }
  return "TO_CONFIRM";
}

export type OfferLike = {
  id: string;
  vendorId: string;
  salePrice: number;
  purchasePrice: number;
  availability: AvailabilityLevel;
  lastConfirmedAt: Date | null;
  active: boolean;
};

/** Meilleure offre affichable : disponible, confirmée d'abord, puis la moins chère. */
export function bestOffer<T extends OfferLike>(offers: T[], now = new Date()): T | null {
  const rank = (o: T) => (effectiveAvailability(o.availability, o.lastConfirmedAt, now) === "CONFIRMED" ? 0 : 1);
  const usable = offers.filter(
    (o) => o.active && effectiveAvailability(o.availability, o.lastConfirmedAt, now) !== "OUT_OF_STOCK",
  );
  usable.sort((a, b) => rank(a) - rank(b) || a.salePrice - b.salePrice);
  return usable[0] ?? null;
}

/** Offre à solliciter pour une commande, en excluant les vendeurs déjà sollicités. */
export function nextOfferToRequest<T extends OfferLike>(offers: T[], excludedVendorIds: string[], now = new Date()): T | null {
  return bestOffer(
    offers.filter((o) => !excludedVendorIds.includes(o.vendorId)),
    now,
  );
}

export const DELIVERY_FEES = { PICKUP: 0, STANDARD: 1500, EXPRESS: 3000 } as const;
export const GIFT_WRAP_FEE = 2000;
/** 1 point bonus par tranche de 1 000 FCFA. */
export const bonusFor = (total: number) => Math.floor(total / 1000);

export function computeTotals(input: {
  subtotal: number;
  deliveryFee: number;
  promoPercent?: number;
  giftWrap?: boolean;
}) {
  const discount = input.promoPercent ? Math.round((input.subtotal * input.promoPercent) / 100) : 0;
  const giftWrapFee = input.giftWrap ? GIFT_WRAP_FEE : 0;
  const total = Math.max(0, input.subtotal - discount) + input.deliveryFee + giftWrapFee;
  return { discount, giftWrapFee, total };
}
