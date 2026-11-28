export const IMPORT_STEPS = [
  { key: "NEW", label: "Demande reçue", text: "Nous étudions votre demande." },
  { key: "SOURCING", label: "Recherche du fournisseur", text: "Eden compare les fournisseurs fiables à l'étranger." },
  { key: "QUOTED", label: "Proposition envoyée", text: "Prix tout compris (produit, transport, douane) et délai." },
  { key: "ACCEPTED", label: "Proposition acceptée", text: "Eden vous contacte pour l'acompte avant de commander." },
  { key: "ORDERED", label: "Commandé", text: "Le produit est commandé auprès du fournisseur." },
  { key: "IN_TRANSIT", label: "En transit", text: "Le colis est en route vers Lomé." },
  { key: "ARRIVED", label: "Arrivé à Lomé", text: "Dédouané et contrôlé par Eden." },
  { key: "DELIVERED", label: "Livré", text: "Votre produit est entre vos mains." },
] as const;

export const IMPORT_LABEL: Record<string, string> = Object.fromEntries([...IMPORT_STEPS.map((s) => [s.key, s.label]), ["CANCELLED", "Annulée"]]);

export const ORIGINS = ["Indifférent", "Chine", "Dubaï", "Europe", "États-Unis", "Nigeria", "Ghana"] as const;
