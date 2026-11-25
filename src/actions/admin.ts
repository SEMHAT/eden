"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertRole } from "@/lib/auth";
import { changeOrderStatus, dropUnavailableItems, requestNextVendor, syncOrderStatus } from "@/lib/orders";
import { computeSalePrice } from "@/lib/pricing";
import { refreshProductPrice } from "@/lib/catalog";
import { logActivity } from "@/lib/log";
import { SERVICES } from "@/lib/settings";
import type { OrderStatus } from "@prisma/client";
import type { ActionState } from "./cart";

const admin = () => assertRole(["ADMIN"]);

export async function setOrderStatus(form: FormData) {
  const s = await admin();
  const orderId = String(form.get("orderId"));
  const to = String(form.get("status")) as OrderStatus;
  const note = String(form.get("note") ?? "").trim().slice(0, 300) || undefined;
  await changeOrderStatus(orderId, to, "eden", note);
  await logActivity({ actorId: s.userId, actorRole: "ADMIN", action: "order.status", entity: "order", entityId: orderId, data: { to } });
  revalidatePath("/admin");
}

export async function continueWithoutUnavailable(form: FormData) {
  const s = await admin();
  const orderId = String(form.get("orderId"));
  await dropUnavailableItems(orderId, "eden");
  await logActivity({ actorId: s.userId, actorRole: "ADMIN", action: "order.dropUnavailable", entity: "order", entityId: orderId });
  revalidatePath("/admin");
}

export async function retryVendors(form: FormData) {
  const s = await admin();
  const orderId = String(form.get("orderId"));
  await db.$transaction(async (tx) => {
    const items = await tx.orderItem.findMany({ where: { orderId, status: "UNAVAILABLE" } });
    // on repart de zéro pour ces articles : de nouvelles offres ont pu apparaître
    for (const i of items) {
      await tx.vendorRequest.updateMany({ where: { orderItemId: i.id, status: "PENDING" }, data: { status: "CANCELLED" } });
      const offers = await tx.offer.findMany({ where: { productId: i.productId, active: true, availability: { not: "OUT_OF_STOCK" } } });
      if (offers.length) {
        await tx.vendorRequest.deleteMany({ where: { orderItemId: i.id, status: { in: ["REFUSED", "EXPIRED", "CANCELLED"] }, vendorId: { in: offers.map((o) => o.vendorId) } } });
        await requestNextVendor(tx, i.id);
      }
    }
    await tx.order.update({ where: { id: orderId }, data: { status: "PENDING_VENDOR" } });
    await tx.orderEvent.create({ data: { orderId, status: "PENDING_VENDOR", note: "Nouvelle recherche de vendeur lancée.", actor: "eden" } });
    await syncOrderStatus(tx, orderId, "eden");
  });
  await logActivity({ actorId: s.userId, actorRole: "ADMIN", action: "order.retryVendors", entity: "order", entityId: orderId });
  revalidatePath("/admin");
}

export async function setVendorStatus(form: FormData) {
  const s = await admin();
  const vendorId = String(form.get("vendorId"));
  const status = z.enum(["PENDING", "APPROVED", "SUSPENDED"]).parse(form.get("status"));
  await db.vendor.update({ where: { id: vendorId }, data: { status, verifiedAt: status === "APPROVED" ? new Date() : undefined } });
  const offers = await db.offer.findMany({ where: { vendorId }, select: { productId: true } });
  await db.offer.updateMany({ where: { vendorId }, data: { active: status === "APPROVED" } });
  for (const o of offers) await refreshProductPrice(o.productId);
  await logActivity({ actorId: s.userId, actorRole: "ADMIN", action: "vendor.status", entity: "vendor", entityId: vendorId, data: { status } });
  revalidatePath("/admin");
}

export async function setOfferMargin(form: FormData) {
  const s = await admin();
  const offerId = String(form.get("offerId"));
  const margin = z.coerce.number().min(0).max(80).parse(form.get("marginPct"));
  const offer = await db.offer.findUniqueOrThrow({ where: { id: offerId } });
  await db.offer.update({ where: { id: offerId }, data: { marginPct: margin, salePrice: computeSalePrice(offer.purchasePrice, margin) } });
  await refreshProductPrice(offer.productId);
  await logActivity({ actorId: s.userId, actorRole: "ADMIN", action: "offer.margin", entity: "offer", entityId: offerId, data: { margin } });
  revalidatePath("/admin");
}

export async function setDefaultMargin(form: FormData) {
  const s = await admin();
  const margin = z.coerce.number().min(0).max(80).parse(form.get("marginPct"));
  const apply = form.get("apply") === "on";
  await db.setting.upsert({ where: { key: "defaultMarginPct" }, update: { value: margin }, create: { key: "defaultMarginPct", value: margin } });
  if (apply) {
    const offers = await db.offer.findMany({ where: { marginPct: null } });
    for (const o of offers) await db.offer.update({ where: { id: o.id }, data: { salePrice: computeSalePrice(o.purchasePrice, margin) } });
    const ids = [...new Set(offers.map((o) => o.productId))];
    for (const id of ids) await refreshProductPrice(id);
  }
  await logActivity({ actorId: s.userId, actorRole: "ADMIN", action: "settings.margin", entity: "setting", data: { margin, apply } });
  revalidatePath("/admin");
}

export async function toggleProduct(form: FormData) {
  const s = await admin();
  const id = String(form.get("productId"));
  const field = z.enum(["active", "isFeatured", "isNew"]).parse(form.get("field"));
  const p = await db.product.findUniqueOrThrow({ where: { id } });
  await db.product.update({ where: { id }, data: { [field]: !p[field] } });
  await logActivity({ actorId: s.userId, actorRole: "ADMIN", action: `product.${field}`, entity: "product", entityId: id });
  revalidatePath("/admin");
}

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  brand: z.string().trim().min(1).max(60),
  categoryId: z.string().min(1),
  description: z.string().trim().min(10).max(3000),
  illustration: z.string().min(2).max(30),
  condition: z.enum(["NEUF", "RECONDITIONNE", "OCCASION"]),
  warrantyMonths: z.coerce.number().int().min(0).max(60),
  usageTags: z.string().max(300).optional(),
  giftTags: z.string().max(300).optional(),
  specs: z.string().max(3000).optional(),
});

export async function createProduct(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const s = await admin();
    const parsed = productSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };
    const d = parsed.data;
    let specs: Record<string, unknown> = {};
    if (d.specs) {
      try {
        specs = JSON.parse(d.specs);
      } catch {
        return { error: "Caractéristiques : JSON invalide, par exemple {\"ram\": 8}" };
      }
    }
    const tags = (v?: string) => (v ?? "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    const slugBase = `${d.brand} ${d.name}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const count = await db.product.count();
    const p = await db.product.create({
      data: {
        slug: `${slugBase}-${Date.now().toString(36).slice(-4)}`,
        name: d.name,
        brand: d.brand,
        reference: `ED-${1000 + count}`,
        categoryId: d.categoryId,
        description: d.description,
        illustration: d.illustration,
        condition: d.condition,
        warrantyMonths: d.warrantyMonths,
        usageTags: tags(d.usageTags),
        giftTags: tags(d.giftTags),
        specs: specs as object,
      },
    });
    await logActivity({ actorId: s.userId, actorRole: "ADMIN", action: "product.create", entity: "product", entityId: p.id });
    revalidatePath("/admin");
    return { ok: true, message: "Produit créé. Les vendeurs peuvent maintenant y ajouter leurs offres." };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function respondQuote(form: FormData) {
  const s = await admin();
  const id = String(form.get("quoteId"));
  const status = z.enum(["NEW", "IN_REVIEW", "SENT", "ACCEPTED", "DECLINED"]).parse(form.get("status"));
  const amount = form.get("amount") ? Number(form.get("amount")) : undefined;
  const response = String(form.get("response") ?? "").trim().slice(0, 2000) || undefined;
  await db.quote.update({ where: { id }, data: { status, amount: Number.isFinite(amount) ? amount : undefined, response } });
  await logActivity({ actorId: s.userId, actorRole: "ADMIN", action: "quote.update", entity: "quote", entityId: id, data: { status } });
  revalidatePath("/admin");
}

export async function updateClaim(form: FormData) {
  const s = await admin();
  const id = String(form.get("claimId"));
  const status = z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "REJECTED"]).parse(form.get("status"));
  const response = String(form.get("response") ?? "").trim().slice(0, 2000) || undefined;
  await db.claim.update({ where: { id }, data: { status, response } });
  await logActivity({ actorId: s.userId, actorRole: "ADMIN", action: "claim.update", entity: "claim", entityId: id, data: { status } });
  revalidatePath("/admin");
}

export async function setUserRole(form: FormData) {
  const s = await admin();
  const userId = String(form.get("userId"));
  if (userId === s.userId) throw new Error("Vous ne pouvez pas modifier votre propre rôle.");
  const role = z.enum(["CUSTOMER", "VENDOR", "PRO", "ADMIN"]).parse(form.get("role"));
  await db.user.update({ where: { id: userId }, data: { role } });
  await logActivity({ actorId: s.userId, actorRole: "ADMIN", action: "user.role", entity: "user", entityId: userId, data: { role } });
  revalidatePath("/admin");
}

export async function setServices(form: FormData) {
  const s = await admin();
  const enabled = SERVICES.map((x) => x.key).filter((k) => form.get(k) === "on");
  await db.setting.upsert({ where: { key: "services" }, update: { value: enabled }, create: { key: "services", value: enabled } });
  await logActivity({ actorId: s.userId, actorRole: "ADMIN", action: "settings.services", entity: "setting", data: { enabled } });
  revalidatePath("/", "layout");
}

const promoSchema = z.object({ code: z.string().trim().min(3).max(30), percent: z.coerce.number().int().min(1).max(50), maxUses: z.coerce.number().int().min(1).optional().or(z.literal("").transform(() => undefined)) });

export async function createPromo(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const s = await admin();
    const parsed = promoSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) return { error: "Code promotionnel invalide" };
    const code = parsed.data.code.toUpperCase();
    await db.promoCode.upsert({ where: { code }, update: { percent: parsed.data.percent, maxUses: parsed.data.maxUses ?? null, active: true }, create: { code, percent: parsed.data.percent, maxUses: parsed.data.maxUses } });
    await logActivity({ actorId: s.userId, actorRole: "ADMIN", action: "promo.upsert", entity: "promo", entityId: code });
    revalidatePath("/admin");
    return { ok: true, message: `Code ${code} enregistré` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function togglePromo(form: FormData) {
  const s = await admin();
  const code = String(form.get("code"));
  const p = await db.promoCode.findUniqueOrThrow({ where: { code } });
  await db.promoCode.update({ where: { code }, data: { active: !p.active } });
  await logActivity({ actorId: s.userId, actorRole: "ADMIN", action: "promo.toggle", entity: "promo", entityId: code });
  revalidatePath("/admin");
}
