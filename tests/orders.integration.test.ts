// Test d'intégration du cycle de commande sur une vraie base PostgreSQL (DATABASE_URL).
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { requestNextVendor, syncOrderStatus, vendorRespond, changeOrderStatus } from "@/lib/orders";

const hasDb = Boolean(process.env.DATABASE_URL);
const suffix = Date.now().toString(36);

describe.skipIf(!hasDb)("commande → confirmation vendeur → réaffectation", () => {
  let productId = "";
  let v1 = "";
  let v2 = "";
  let orderId = "";
  let itemId = "";

  beforeAll(async () => {
    const cat = await db.category.create({ data: { slug: `test-${suffix}`, name: "Test", icon: "phone" } });
    const mkVendor = async (n: number) => {
      const u = await db.user.create({ data: { email: `v${n}-${suffix}@test.local`, name: `V${n}`, passwordHash: "x", role: "VENDOR" } });
      return (await db.vendor.create({ data: { userId: u.id, shopName: `V${n}`, city: "Lomé", phone: "0", status: "APPROVED" } })).id;
    };
    v1 = await mkVendor(1);
    v2 = await mkVendor(2);
    const p = await db.product.create({
      data: { slug: `p-${suffix}`, name: "Produit test", brand: "T", reference: "T1", categoryId: cat.id, description: "", specs: {}, illustration: "phone", fromPrice: 1000 },
    });
    productId = p.id;
    await db.offer.create({ data: { productId, vendorId: v1, purchasePrice: 800, salePrice: 900, availability: "TO_CONFIRM" } });
    await db.offer.create({ data: { productId, vendorId: v2, purchasePrice: 900, salePrice: 1000, availability: "TO_CONFIRM" } });
    const order = await db.order.create({
      data: {
        number: `T-${suffix}`, customerName: "Test", customerPhone: "0", city: "Lomé", deliveryMode: "PICKUP", deliveryFee: 0,
        subtotal: 900, total: 900, paymentMethod: "CASH_ON_DELIVERY",
        items: { create: { productId, productName: "Produit test", quantity: 1, unitPrice: 900 } },
      },
      include: { items: true },
    });
    orderId = order.id;
    itemId = order.items[0].id;
    await db.$transaction((tx) => requestNextVendor(tx, itemId));
  });

  afterAll(async () => {
    await db.order.deleteMany({ where: { id: orderId } });
    await db.product.deleteMany({ where: { id: productId } });
    await db.user.deleteMany({ where: { email: { endsWith: `${suffix}@test.local` } } });
    await db.category.deleteMany({ where: { slug: `test-${suffix}` } });
    await db.$disconnect();
  });

  it("sollicite d'abord le vendeur le moins cher", async () => {
    const reqs = await db.vendorRequest.findMany({ where: { orderItemId: itemId } });
    expect(reqs).toHaveLength(1);
    expect(reqs[0].vendorId).toBe(v1);
  });

  it("un refus passe la demande au vendeur suivant", async () => {
    const r = await db.vendorRequest.findFirstOrThrow({ where: { orderItemId: itemId, vendorId: v1 } });
    const status = await vendorRespond(r.id, v1, false, "Plus en stock");
    expect(status).toBe("PENDING_VENDOR");
    const next = await db.vendorRequest.findFirstOrThrow({ where: { orderItemId: itemId, status: "PENDING" } });
    expect(next.vendorId).toBe(v2);
  });

  it("un vendeur ne peut pas répondre à la demande d'un autre", async () => {
    const r = await db.vendorRequest.findFirstOrThrow({ where: { orderItemId: itemId, status: "PENDING" } });
    await expect(vendorRespond(r.id, v1, true)).rejects.toThrow();
  });

  it("l'acceptation confirme la commande et la disponibilité de l'offre", async () => {
    const r = await db.vendorRequest.findFirstOrThrow({ where: { orderItemId: itemId, status: "PENDING" } });
    expect(await vendorRespond(r.id, v2, true)).toBe("CONFIRMED");
    const offer = await db.offer.findFirstOrThrow({ where: { productId, vendorId: v2 } });
    expect(offer.availability).toBe("CONFIRMED");
    expect(offer.lastConfirmedAt).not.toBeNull();
  });

  it("refuse une transition non prévue et trace les étapes", async () => {
    await expect(changeOrderStatus(orderId, "CLOSED", "eden")).rejects.toThrow();
    await changeOrderStatus(orderId, "QUALITY_CHECK", "eden");
    await changeOrderStatus(orderId, "READY_FOR_PICKUP", "eden");
    await changeOrderStatus(orderId, "DELIVERED", "eden");
    const o = await db.order.findUniqueOrThrow({ where: { id: orderId }, include: { events: true, payments: true } });
    expect(o.paymentStatus).toBe("SUCCEEDED");
    expect(o.payments).toHaveLength(1);
    expect(o.events.map((e) => e.status)).toEqual(expect.arrayContaining(["CONFIRMED", "QUALITY_CHECK", "DELIVERED"]));
  });

  it("une commande sans aucun vendeur restant passe en « action requise »", async () => {
    const o2 = await db.order.create({
      data: {
        number: `T2-${suffix}`, customerName: "Test", customerPhone: "0", city: "Lomé", deliveryMode: "PICKUP", deliveryFee: 0,
        subtotal: 900, total: 900, paymentMethod: "CASH_ON_DELIVERY",
        items: { create: { productId, productName: "Produit test", quantity: 1, unitPrice: 900 } },
      },
      include: { items: true },
    });
    await db.offer.updateMany({ where: { productId }, data: { availability: "OUT_OF_STOCK" } });
    await db.$transaction(async (tx) => {
      await requestNextVendor(tx, o2.items[0].id);
      await syncOrderStatus(tx, o2.id);
    });
    const after = await db.order.findUniqueOrThrow({ where: { id: o2.id } });
    expect(after.status).toBe("ACTION_REQUIRED");
    await db.order.delete({ where: { id: o2.id } });
  });
});
