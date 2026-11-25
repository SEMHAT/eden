import "server-only";
// Architecture de paiement.
// Aucun paiement réel n'est simulé : un moyen n'est proposé que si son prestataire est configuré.
// Prestataires envisagés pour le Togo (à choisir et contractualiser) : FedaPay, CinetPay, PayGate Global
// pour Mobile Money (T-Money, Flooz) et carte bancaire. Voir docs/PAIEMENTS.md.

import type { PaymentMethod } from "@prisma/client";

export type PaymentInit = { redirectUrl: string; reference: string };

export interface PaymentProvider {
  id: string;
  label: string;
  methods: PaymentMethod[];
  isConfigured(): boolean;
  /** Crée la transaction chez le prestataire (environnement de test d'abord). */
  initiate(input: { orderNumber: string; amount: number; idempotencyKey: string; customerPhone: string; returnUrl: string }): Promise<PaymentInit>;
}

/** Adaptateur Mobile Money / carte — à brancher sur le prestataire retenu. */
const gateway: PaymentProvider = {
  id: process.env.PAYMENT_PROVIDER ?? "non-configure",
  label: "Passerelle de paiement",
  methods: ["MOBILE_MONEY", "CARD"],
  isConfigured() {
    return Boolean(process.env.PAYMENT_PROVIDER && process.env.PAYMENT_API_KEY && process.env.PAYMENT_WEBHOOK_SECRET);
  },
  async initiate() {
    // Volontairement non implémenté tant que le prestataire et ses identifiants de test ne sont pas fournis.
    throw new Error("Prestataire de paiement non configuré");
  },
};

export function availableMethods(): { method: PaymentMethod; enabled: boolean; note?: string }[] {
  const gw = gateway.isConfigured();
  return [
    { method: "CASH_ON_DELIVERY", enabled: true, note: "Vous payez à la réception, après contrôle du produit." },
    { method: "MOBILE_MONEY", enabled: gw, note: gw ? undefined : "Bientôt disponible" },
    { method: "CARD", enabled: gw, note: gw ? undefined : "Bientôt disponible" },
  ];
}

export function providerFor(method: PaymentMethod): PaymentProvider | null {
  if (method === "CASH_ON_DELIVERY") return null;
  return gateway.isConfigured() ? gateway : null;
}
