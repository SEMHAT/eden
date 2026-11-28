import "server-only";
import { db } from "./db";
import { nextOfferToRequest, bonusFor } from "./pricing";
import { aggregateItemsStatus, canTransition } from "./order-flow";
import { refreshProductPrice } from "./catalog";
import type { OrderStatus, Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export function orderNumber() {
  const d = new Date();
  const ymd = `${d.getUTCFullYear().toString().slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `ED-${ymd}-${rand}`;
}

/** Sollicite le prochain vendeur disponible pour un article. Retourne false s'il n'y en a plus. */
export async function requestNextVendor(tx: Tx, orderItemId: string): Promise<boolean> {
  const item = await tx.orderItem.findUniqueOrThrow({ where: { id: orderItemId }, include: { requests: true } });
  const tried = item.requests.map((r) => r.vendorId);
  const offers = await tx.offer.findMany({
    where: { productId: item.productId, active: true, vendor: { status: "APPROVED" } },
  });
  const offer = nextOfferToRequest(offers, tried);
  if (!offer) {
    await tx.orderItem.update({ where: { id: item.id }, data: { status: "UNAVAILABLE", vendorId: null, offerId: null } });
    return false;
  }
  await tx.vendorRequest.create({ data: { orderItemId: item.id, vendorId: offer.vendorId, offerId: offer.id } });
  await tx.orderItem.update({
    where: { id: item.id },
    data: { status: "AWAITING_VENDOR", vendorId: offer.vendorId, offerId: offer.id, purchasePrice: offer.purchasePrice },
  });
  return true;
}

export async function syncOrderStatus(tx: Tx, orderId: string, actor = "systeme") {
  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
  if (!["PENDING_VENDOR", "ACTION_REQUIRED"].includes(order.status)) return order.status;
  const next = aggregateItemsStatus(order.items);
  if (next !== order.status) {
    await tx.order.update({ where: { id: orderId }, data: { status: next } });
    const note =
      next === "CONFIRMED"
        ? "Tous les articles sont confirmés par les vendeurs."
        : next === "ACTION_REQUIRED"
          ? "Un article n'est plus disponible chez nos vendeurs. Eden vous contacte."
          : undefined;
    await tx.orderEvent.create({ data: { orderId, status: next, note, actor } });
  }
  return next;
}

/** Réponse d'un vendeur à une demande de confirmation. */
export async function vendorRespond(requestId: string, vendorId: string, accept: boolean, reason?: string) {
  return db.$transaction(async (tx) => {
    const req = await tx.vendorRequest.findUnique({ where: { id: requestId }, include: { orderItem: true } });
    if (!req || req.vendorId !== vendorId) throw new Error("Demande introuvable");
    if (req.status !== "PENDING") throw new Error("Cette demande a déjà été traitée");
    const now = new Date();
    await tx.vendorRequest.update({
      where: { id: req.id },
      data: { status: accept ? "ACCEPTED" : "REFUSED", reason: reason?.slice(0, 300), respondedAt: now },
    });
    if (accept) {
      await tx.orderItem.update({ where: { id: req.orderItemId }, data: { status: "CONFIRMED" } });
      await tx.offer.update({ where: { id: req.offerId }, data: { availability: "CONFIRMED", lastConfirmedAt: now } });
    } else {
      // le refus signale que l'offre n'est plus disponible
      await tx.offer.update({ where: { id: req.offerId }, data: { availability: "OUT_OF_STOCK" } });
      await requestNextVendor(tx, req.orderItemId);
    }
    const status = await syncOrderStatus(tx, req.orderItem.orderId, "vendeur");
    return { status, productId: req.orderItem.productId };
  }).then(async (r) => {
    await refreshProductPrice(r.productId);
    return r.status;
  });
}

/** Expire les demandes restées sans réponse et sollicite le vendeur suivant. */
export async function expireStaleRequests(maxMinutes = Number(process.env.VENDOR_RESPONSE_MINUTES ?? 120)) {
  const cutoff = new Date(Date.now() - maxMinutes * 60_000);
  const stale = await db.vendorRequest.findMany({ where: { status: "PENDING", createdAt: { lt: cutoff } }, include: { orderItem: true } });
  for (const r of stale) {
    await db.$transaction(async (tx) => {
      const fresh = await tx.vendorRequest.updateMany({ where: { id: r.id, status: "PENDING" }, data: { status: "EXPIRED", respondedAt: new Date() } });
      if (fresh.count === 0) return;
      await requestNextVendor(tx, r.orderItemId);
      await syncOrderStatus(tx, r.orderItem.orderId);
    });
  }
  return stale.length;
}

export async function changeOrderStatus(orderId: string, to: OrderStatus, actor: string, note?: string) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    if (!canTransition(order.status, to)) throw new Error(`Transition impossible : ${order.status} → ${to}`);
    const data: Prisma.OrderUpdateInput = { status: to };
    if (to === "CANCELLED") {
      await tx.orderItem.updateMany({ where: { orderId }, data: { status: "CANCELLED" } });
      await tx.vendorRequest.updateMany({ where: { orderItem: { orderId }, status: "PENDING" }, data: { status: "CANCELLED" } });
    }
    if (to === "REFUNDED") data.paymentStatus = order.paymentStatus === "SUCCEEDED" ? "REFUNDED" : order.paymentStatus;
    if (to === "DELIVERED" && order.paymentMethod === "CASH_ON_DELIVERY") {
      data.paymentStatus = "SUCCEEDED";
      await tx.payment.create({
        data: { orderId, method: "CASH_ON_DELIVERY", provider: "cod", amount: order.total, status: "SUCCEEDED", idempotencyKey: `cod:${orderId}` },
      });
    }
    if (to === "CLOSED" && order.userId && order.bonusAwarded === 0) {
      const pts = bonusFor(order.total);
      data.bonusAwarded = pts;
      await tx.user.update({ where: { id: order.userId }, data: { bonusPoints: { increment: pts } } });
    }
    await tx.order.update({ where: { id: orderId }, data });
    await tx.orderEvent.create({ data: { orderId, status: to, note, actor } });
    return to;
  });
}

/** Retire les articles indisponibles et reprend la commande avec le reste (après accord du client). */
export async function dropUnavailableItems(orderId: string, actor: string) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
    if (order.status !== "ACTION_REQUIRED") throw new Error("La commande n'attend pas d'action");
    const removed = order.items.filter((i) => i.status === "UNAVAILABLE");
    await tx.orderItem.updateMany({ where: { orderId, status: "UNAVAILABLE" }, data: { status: "CANCELLED" } });
    const kept = order.items.filter((i) => i.status !== "UNAVAILABLE" && i.status !== "CANCELLED");
    const subtotal = kept.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const customFees = kept.reduce((s, i) => s + i.customFee * i.quantity, 0);
    const discount = order.subtotal > 0 ? Math.round((order.discount * subtotal) / order.subtotal) : 0;
    const total = Math.max(0, subtotal - discount) + customFees + order.deliveryFee + order.giftWrapFee;
    await tx.order.update({ where: { id: orderId }, data: { subtotal, discount, customFees, total } });
    await tx.orderEvent.create({
      data: { orderId, status: "ACTION_REQUIRED", note: `${removed.length} article(s) retiré(s), nouveau total recalculé.`, actor },
    });
    return syncOrderStatus(tx, orderId, actor);
  });
}
