// Statuts de commande et transitions autorisées — pures et testées.
import type { OrderStatus } from "@prisma/client";

export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_VENDOR: ["CONFIRMED", "ACTION_REQUIRED", "CANCELLED"],
  ACTION_REQUIRED: ["PENDING_VENDOR", "CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PAYMENT_PENDING", "QUALITY_CHECK", "DELAYED", "CANCELLED"],
  PAYMENT_PENDING: ["PAID", "CANCELLED"],
  PAID: ["QUALITY_CHECK", "DELAYED", "REFUNDED"],
  QUALITY_CHECK: ["OUT_FOR_DELIVERY", "READY_FOR_PICKUP", "DELAYED", "CANCELLED", "REFUNDED"],
  DELAYED: ["QUALITY_CHECK", "OUT_FOR_DELIVERY", "READY_FOR_PICKUP", "CANCELLED", "REFUNDED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "DELAYED"],
  READY_FOR_PICKUP: ["DELIVERED", "DELAYED"],
  DELIVERED: ["CLOSED", "REFUNDED"],
  CLOSED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return TRANSITIONS[from].includes(to);
}

/** Le client peut annuler tant que rien n'est parti en livraison ni payé. */
export const CUSTOMER_CANCELLABLE: OrderStatus[] = ["PENDING_VENDOR", "ACTION_REQUIRED", "CONFIRMED", "PAYMENT_PENDING"];

/** Étapes affichées dans le suivi client. */
export const TRACKING_STEPS: { key: string; label: string; statuses: OrderStatus[] }[] = [
  { key: "placed", label: "Commande reçue", statuses: ["PENDING_VENDOR", "ACTION_REQUIRED"] },
  { key: "confirmed", label: "Disponibilité confirmée", statuses: ["CONFIRMED", "PAYMENT_PENDING", "PAID"] },
  { key: "check", label: "Contrôle du produit", statuses: ["QUALITY_CHECK", "DELAYED"] },
  { key: "delivery", label: "Livraison ou retrait", statuses: ["OUT_FOR_DELIVERY", "READY_FOR_PICKUP"] },
  { key: "done", label: "Reçue", statuses: ["DELIVERED", "CLOSED"] },
];

export function trackingIndex(status: OrderStatus) {
  return TRACKING_STEPS.findIndex((s) => s.statuses.includes(status));
}

/** Statut global d'une commande à partir de ses articles. */
export function aggregateItemsStatus(items: { status: "AWAITING_VENDOR" | "CONFIRMED" | "UNAVAILABLE" | "CANCELLED" }[]): OrderStatus {
  const live = items.filter((i) => i.status !== "CANCELLED");
  if (live.length === 0) return "CANCELLED";
  if (live.some((i) => i.status === "UNAVAILABLE")) return "ACTION_REQUIRED";
  if (live.every((i) => i.status === "CONFIRMED")) return "CONFIRMED";
  return "PENDING_VENDOR";
}
