import { describe, it, expect } from "vitest";
import { computeSalePrice, effectiveAvailability, bestOffer, nextOfferToRequest, computeTotals, bonusFor } from "@/lib/pricing";
import { parseBudget, parseQuery, recommend, explainDifference, type RecoProduct } from "@/lib/reco";
import { canTransition, aggregateItemsStatus } from "@/lib/order-flow";
import { pickGifts } from "@/lib/gift";

describe("prix", () => {
  it("applique la marge et arrondit à la centaine", () => {
    expect(computeSalePrice(100000, 12)).toBe(112000);
    expect(computeSalePrice(14350, 12)).toBe(16100);
  });
  it("refuse un prix négatif", () => {
    expect(() => computeSalePrice(-1)).toThrow();
  });
  it("calcule remise, emballage et livraison", () => {
    expect(computeTotals({ subtotal: 100000, deliveryFee: 1500, promoPercent: 5, giftWrap: true })).toEqual({
      discount: 5000,
      giftWrapFee: 2000,
      total: 98500,
    });
    expect(bonusFor(98500)).toBe(98);
  });
});

describe("disponibilité", () => {
  const now = new Date("2026-11-25T12:00:00Z");
  it("une confirmation de plus de 72 h redevient « à confirmer »", () => {
    expect(effectiveAvailability("CONFIRMED", new Date("2026-11-24T12:00:00Z"), now)).toBe("CONFIRMED");
    expect(effectiveAvailability("CONFIRMED", new Date("2026-11-20T12:00:00Z"), now)).toBe("TO_CONFIRM");
    expect(effectiveAvailability("CONFIRMED", null, now)).toBe("TO_CONFIRM");
  });
  const offers = [
    { id: "a", vendorId: "v1", salePrice: 100, purchasePrice: 90, availability: "TO_CONFIRM" as const, lastConfirmedAt: null, active: true },
    { id: "b", vendorId: "v2", salePrice: 120, purchasePrice: 100, availability: "CONFIRMED" as const, lastConfirmedAt: new Date("2026-11-25T10:00:00Z"), active: true },
    { id: "c", vendorId: "v3", salePrice: 80, purchasePrice: 70, availability: "OUT_OF_STOCK" as const, lastConfirmedAt: null, active: true },
  ];
  it("préfère une offre confirmée, jamais une rupture", () => {
    expect(bestOffer(offers, now)?.id).toBe("b");
  });
  it("sollicite le vendeur suivant en excluant ceux déjà sollicités", () => {
    expect(nextOfferToRequest(offers, ["v2"], now)?.id).toBe("a");
    expect(nextOfferToRequest(offers, ["v1", "v2"], now)).toBeNull();
  });
});

describe("compréhension de la demande", () => {
  it("lit les budgets écrits de plusieurs façons", () => {
    expect(parseBudget("Mon budget est de 250 000 FCFA")).toBe(250000);
    expect(parseBudget("250.000 f")).toBe(250000);
    expect(parseBudget("pas plus de 300k")).toBe(300000);
    expect(parseBudget("1,2 million")).toBe(1200000);
    expect(parseBudget("16 Go de RAM, 512 Go")).toBeNull();
  });
  it("comprend catégorie et usages", () => {
    const q = parseQuery("Je cherche un ordinateur pour programmer et faire du montage vidéo. Mon budget est de 250 000 FCFA.");
    expect(q.category).toBe("ordinateurs");
    expect(q.budget).toBe(250000);
    expect(q.usages).toEqual(expect.arrayContaining(["programmation", "montage"]));
  });
});

const mk = (o: Partial<RecoProduct> & { id: string; price: number }): RecoProduct => ({
  slug: o.id,
  name: o.id,
  brand: "X",
  categorySlug: "ordinateurs",
  specs: {},
  usageTags: [],
  popularity: 50,
  availability: "CONFIRMED",
  ...o,
});

describe("recommandation", () => {
  const catalog = [
    mk({ id: "bureau-8go", price: 200000, specs: { ram: 8, storage: 256, storageType: "SSD", cpuTier: 2, gpuDedicated: false } }),
    mk({ id: "creatif-16go", price: 240000, specs: { ram: 16, storage: 512, storageType: "SSD", cpuTier: 4, gpuDedicated: true, gpu: "GTX 1650" } }),
    mk({ id: "trop-cher", price: 400000, specs: { ram: 32, cpuTier: 5, gpuDedicated: true } }),
    mk({ id: "rupture", price: 150000, availability: "OUT_OF_STOCK", specs: { ram: 16 } }),
    mk({ id: "telephone", price: 100000, categorySlug: "smartphones", specs: { ram: 8 } }),
  ];
  it("respecte le budget, la catégorie et la disponibilité, et classe selon l'usage", () => {
    const res = recommend(catalog, parseQuery("ordinateur pour programmer et montage vidéo, budget 250 000"));
    expect(res.map((r) => r.product.id)).toEqual(["creatif-16go", "bureau-8go"]);
    expect(res[0].reasons.join(" ")).toMatch(/Carte graphique/);
  });
  it("explique les différences", () => {
    const lines = explainDifference(catalog[0], catalog[1]);
    expect(lines.join(" | ")).toMatch(/plus de mémoire vive \(16 Go contre 8 Go\)/);
    expect(lines.join(" | ")).toMatch(/carte graphique dédiée/);
  });
});

describe("cycle de commande", () => {
  it("n'autorise que les transitions prévues", () => {
    expect(canTransition("PENDING_VENDOR", "CONFIRMED")).toBe(true);
    expect(canTransition("PENDING_VENDOR", "DELIVERED")).toBe(false);
    expect(canTransition("CANCELLED", "CONFIRMED")).toBe(false);
  });
  it("agrège le statut des articles", () => {
    expect(aggregateItemsStatus([{ status: "CONFIRMED" }, { status: "AWAITING_VENDOR" }])).toBe("PENDING_VENDOR");
    expect(aggregateItemsStatus([{ status: "CONFIRMED" }, { status: "CONFIRMED" }])).toBe("CONFIRMED");
    expect(aggregateItemsStatus([{ status: "CONFIRMED" }, { status: "UNAVAILABLE" }])).toBe("ACTION_REQUIRED");
    expect(aggregateItemsStatus([{ status: "CANCELLED" }])).toBe("CANCELLED");
  });
});

describe("Eden Gift", () => {
  it("sélectionne selon destinataire, goûts et budget", () => {
    const items = [
      { ...mk({ id: "casque", price: 30000, categorySlug: "audio-accessoires", usageTags: ["musique"] }), giftTags: ["ado"] },
      { ...mk({ id: "console", price: 300000, categorySlug: "gaming", usageTags: ["gaming"] }), giftTags: ["ado"] },
      { ...mk({ id: "imprimante", price: 20000, categorySlug: "bureau", usageTags: ["bureautique"] }), giftTags: [] },
    ];
    const picks = pickGifts(items, { recipient: "ado", occasion: "anniversaire", budget: 50000, preferences: ["musique"] });
    expect(picks.map((p) => p.product.id)).toEqual(["casque"]);
  });
});
