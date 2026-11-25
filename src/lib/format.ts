export const fcfa = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n).replace(/ | /g, " ") + " FCFA";

export const dateFr = (d: Date | string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d));

export const dateTimeFr = (d: Date | string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(d));

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING_VENDOR: "En attente de confirmation vendeur",
  ACTION_REQUIRED: "Action requise",
  CONFIRMED: "Disponibilité confirmée",
  PAYMENT_PENDING: "Paiement en attente",
  PAID: "Payée",
  QUALITY_CHECK: "Contrôle qualité",
  OUT_FOR_DELIVERY: "En cours de livraison",
  READY_FOR_PICKUP: "Prête pour le retrait",
  DELIVERED: "Livrée",
  CLOSED: "Clôturée",
  DELAYED: "Retardée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};

export const PAYMENT_LABEL: Record<string, string> = {
  CASH_ON_DELIVERY: "Paiement à la livraison",
  MOBILE_MONEY: "Mobile Money (T-Money, Flooz)",
  CARD: "Carte bancaire",
};

export const DELIVERY_LABEL: Record<string, string> = {
  PICKUP: "Retrait au point Eden",
  STANDARD: "Livraison standard (Lomé)",
  EXPRESS: "Livraison express (Lomé)",
};

export const CONDITION_LABEL: Record<string, string> = {
  NEUF: "Neuf",
  RECONDITIONNE: "Reconditionné",
  OCCASION: "Occasion",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "non payée",
  PENDING: "paiement en cours",
  SUCCEEDED: "payée",
  FAILED: "paiement échoué",
  REFUNDED: "remboursée",
};

export const ITEM_STATUS_LABEL: Record<string, string> = {
  AWAITING_VENDOR: "en attente du vendeur",
  CONFIRMED: "confirmé",
  UNAVAILABLE: "indisponible",
  CANCELLED: "annulé",
};

export const REQUEST_STATUS_LABEL: Record<string, string> = {
  PENDING: "en attente",
  ACCEPTED: "confirmée",
  REFUSED: "refusée",
  EXPIRED: "expirée",
  CANCELLED: "annulée",
};
