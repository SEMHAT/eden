"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCartId } from "@/lib/cart";

export type ActionState = { ok?: boolean; error?: string; message?: string } | null;

const addSchema = z.object({ productId: z.string().min(1), quantity: z.coerce.number().int().min(1).max(20).default(1) });

export async function addToCart(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = addSchema.safeParse({ productId: form.get("productId"), quantity: form.get("quantity") ?? 1 });
  if (!parsed.success) return { error: "Produit invalide" };
  const product = await db.product.findUnique({ where: { id: parsed.data.productId }, select: { id: true, fromPrice: true, active: true } });
  if (!product || !product.active || product.fromPrice === null) return { error: "Ce produit n'est pas disponible à la commande." };
  const cartId = (await getCartId(true))!;
  await db.cartItem.upsert({
    where: { cartId_productId: { cartId, productId: product.id } },
    update: { quantity: { increment: parsed.data.quantity } },
    create: { cartId, productId: product.id, quantity: parsed.data.quantity },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Ajouté au panier" };
}

export async function buyNow(form: FormData) {
  await addToCart(null, form);
  const { redirect } = await import("next/navigation");
  redirect("/panier");
}

export async function updateQuantity(form: FormData) {
  const itemId = String(form.get("itemId") ?? "");
  const quantity = Math.max(0, Math.min(20, Number(form.get("quantity") ?? 1)));
  const cartId = await getCartId(false);
  if (!cartId) return;
  if (quantity === 0) await db.cartItem.deleteMany({ where: { id: itemId, cartId } });
  else await db.cartItem.updateMany({ where: { id: itemId, cartId }, data: { quantity } });
  revalidatePath("/", "layout");
}

export async function applyPromo(_: ActionState, form: FormData): Promise<ActionState> {
  const code = String(form.get("code") ?? "").trim().toUpperCase().slice(0, 30);
  const cartId = await getCartId(false);
  if (!cartId) return { error: "Panier vide" };
  if (!code) {
    await db.cart.update({ where: { id: cartId }, data: { promoCode: null } });
    revalidatePath("/panier");
    return { ok: true, message: "Code retiré" };
  }
  const promo = await db.promoCode.findUnique({ where: { code } });
  const valid = promo && promo.active && (!promo.expiresAt || promo.expiresAt > new Date()) && (promo.maxUses === null || promo.uses < promo.maxUses);
  if (!valid) return { error: "Ce code n'est pas valide." };
  await db.cart.update({ where: { id: cartId }, data: { promoCode: code } });
  revalidatePath("/panier");
  return { ok: true, message: `Code ${code} appliqué : −${promo.percent} %` };
}

export async function setGiftOptions(form: FormData) {
  const cartId = (await getCartId(true))!;
  const giftWrap = form.get("giftWrap") === "on";
  const giftNote = String(form.get("giftNote") ?? "").trim().slice(0, 280) || null;
  await db.cart.update({ where: { id: cartId }, data: { giftWrap, giftNote } });
  revalidatePath("/panier");
  if (form.get("then") === "panier") {
    const { redirect } = await import("next/navigation");
    redirect("/panier");
  }
}
