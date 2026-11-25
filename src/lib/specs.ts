// Libellés lisibles des caractéristiques techniques.
const LABELS: Record<string, [string, (v: unknown) => string]> = {
  chip: ["Puce", String],
  cpu: ["Processeur", String],
  ram: ["Mémoire vive", (v) => `${v} Go`],
  storage: ["Stockage", (v) => (Number(v) >= 1000 ? `${Number(v) / 1000} To` : `${v} Go`)],
  storageType: ["Type de stockage", String],
  gpu: ["Graphisme", String],
  gpuDedicated: ["Carte graphique dédiée", (v) => (v ? "Oui" : "Non")],
  screen: ["Écran", (v) => `${String(v).replace(".", ",")} pouces`],
  camera: ["Appareil photo principal", (v) => `${v} MP`],
  battery: ["Batterie", (v) => `${v} mAh`],
  network: ["Réseau", String],
  weight: ["Poids", (v) => `${String(v).replace(".", ",")} kg`],
  autonomy: ["Autonomie annoncée", (v) => (Number(v) < 1 ? `${Math.round(Number(v) * 60)} min` : `${v} h`)],
  type: ["Type", String],
  wireless: ["Sans fil", (v) => (v ? "Oui" : "Non")],
  anc: ["Réduction de bruit active", (v) => (v ? "Oui" : "Non")],
  waterproof: ["Étanchéité", String],
  gps: ["GPS intégré", (v) => (v ? "Oui" : "Non")],
  capacity: ["Capacité", (v) => `${Number(v).toLocaleString("fr-FR")} mAh`],
  power: ["Puissance", (v) => `${String(v).replace(".", ",")} W`],
  ports: ["Ports", String],
  wifi: ["Wi-Fi", (v) => (v ? "Oui" : "Non")],
  speed: ["Vitesse d'impression", (v) => `${v} pages/min`],
  resolution: ["Résolution", String],
  refresh: ["Fréquence", (v) => `${v} Hz`],
  layout: ["Disposition", String],
  dpi: ["Précision", (v) => `${v} DPI`],
  platform: ["Plateforme", String],
};

export function specRows(specs: Record<string, unknown>): [string, string][] {
  return Object.entries(specs)
    .filter(([k, v]) => k !== "cpuTier" && v !== undefined && v !== null && v !== "")
    .map(([k, v]) => {
      const def = LABELS[k];
      return def ? [def[0], def[1](v)] : [k, String(v)];
    });
}
