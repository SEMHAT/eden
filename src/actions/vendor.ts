"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertRole } from "@/lib/auth";
import { vendorRespond } from "@/lib/orders";
import { computeSalePrice } from "@/lib/pricing";
import { refreshProductPrice } from "@/lib/catalog";
import { getDefaultMargin } from "@/lib/settings";
import { logActivity } from "@/lib/log";
import type { ActionState } from "./cart";

async function currentVendor() {
  const s = await assertRole(["VENDOR"]);
  const vendor = await db.vendor.findUnique({ where: { userId: s.userId } });
  if (!vendor) throw new Error("Profil vendeur introuvable");
  if (vendor.status !== "APPROVED") throw new Error("Votre compte vendeur n'est pas encore validé par Eden.");
  return { s, vendor };
}

export async function respondToRequest(form: FormData) {
  const { s, vendor } = await currentVendor();
  const requestId = String(form.get("requestId"));
  const accept = form.get("decision") === "accept";
  const reason = String(form.get("reason") ?? "") || undefined;
  await vendorRespond(requestId, vendor.id, accept, reason);
  await logActivity({ actorId: s.userId, actorRole: "VENDOR", action: accept ? "request.accept" : "request.refuse", entity: "vendorRequest", entityId: requestId });
  revalidatePath("/vendeur");
}

const offerSchema = z.object({
  productId: z.string().min(1),
  purchasePrice: z.coerce.number().int().min(500, "Prix invalide").max(50_000_000),
  availability: z.enum(["CONFIRMED", "TO_CONFIRM", "OUT_OF_STOCK"]),
});

export async function upsertOffer(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const { s, vendor } = await currentVendor();
    const parsed = offerSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };
    const d = parsed.data;
    const existing = await db.offer.findUnique({ where: { productId_vendorId: { productId: d.productId, vendorId: vendor.id } } });
    const margin = existing?.marginPct ?? (await getDefaultMargin());
    const data = {
      purchasePrice: d.purchasePrice,
      salePrice: computeSalePrice(d.purchasePrice, margin),
      availability: d.availability,
      lastConfirmedAt: d.availability === "CONFIRMED" ? new Date() : existing?.lastConfirmedAt ?? null,
      active: true,
    };
    await db.offer.upsert({
      where: { productId_vendorId: { productId: d.productId, vendorId: vendor.id } },
      update: data,
      create: { ...data, productId: d.productId, vendorId: vendor.id },
    });
    await refreshProductPrice(d.productId);
    await logActivity({ actorId: s.userId, actorRole: "VENDOR", action: "offer.upsert", entity: "product", entityId: d.productId, data: { purchasePrice: d.purchasePrice, availability: d.availability } });
    revalidatePath("/vendeur");
    return { ok: true, message: "Offre enregistrée" };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function confirmAllStock() {
  const { s, vendor } = await currentVendor();
  const offers = await db.offer.findMany({ where: { vendorId: vendor.id, active: true, availability: { not: "OUT_OF_STOCK" } }, select: { productId: true } });
  await db.offer.updateMany({ where: { vendorId: vendor.id, active: true, availability: { not: "OUT_OF_STOCK" } }, data: { availability: "CONFIRMED", lastConfirmedAt: new Date() } });
  for (const o of offers) await refreshProductPrice(o.productId);
  await logActivity({ actorId: s.userId, actorRole: "VENDOR", action: "offer.confirmAll", entity: "vendor", entityId: vendor.id });
  revalidatePath("/vendeur");
}
