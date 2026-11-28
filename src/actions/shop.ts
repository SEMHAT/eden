"use server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getCart, cartTotals, clearCartCookie } from "@/lib/cart";
import { orderNumber, requestNextVendor, syncOrderStatus, changeOrderStatus } from "@/lib/orders";
import { availableMethods } from "@/lib/payments";
import { CUSTOMER_CANCELLABLE } from "@/lib/order-flow";
import { logActivity } from "@/lib/log";
import { canSeeOrder } from "@/lib/access";
import type { ActionState } from "./cart";

export async function toggleFavorite(form: FormData) {
  const s = await getSession();
  const productId = String(form.get("productId") ?? "");
  if (!s) redirect(`/connexion?suite=${encodeURIComponent(String(form.get("back") ?? "/boutique"))}`);
  const key = { userId_productId: { userId: s.userId, productId } };
  const exists = await db.favorite.findUnique({ where: key });
  if (exists) await db.favorite.delete({ where: key });
  else await db.favorite.create({ data: { userId: s.userId, productId } });
  revalidatePath("/", "layout");
}

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "Indiquez votre nom").max(80),
  customerPhone: z.string().trim().regex(/^[+\d][\d\s]{7,18}$/, "Numéro de téléphone invalide"),
  customerEmail: z.union([z.email("Adresse e-mail invalide"), z.literal("")]).optional(),
  city: z.string().trim().min(2, "Indiquez votre ville").max(60),
  district: z.string().trim().max(80).optional(),
  addressNote: z.string().trim().max(300).optional(),
  deliveryMode: z.enum(["PICKUP", "STANDARD", "EXPRESS"]),
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "MOBILE_MONEY", "CARD"]),
  checkoutToken: z.string().min(8),
});

export async function placeOrder(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = checkoutSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  const d = parsed.data;
  if (d.deliveryMode !== "PICKUP" && !d.district) return { error: "Indiquez votre quartier pour la livraison." };
  const method = availableMethods().find((m) => m.method === d.paymentMethod);
  if (!method?.enabled) return { error: "Ce moyen de paiement n'est pas encore disponible." };

  const cart = await getCart();
  const lines = cart?.lines.filter((l) => l.price !== null && l.availability !== "OUT_OF_STOCK") ?? [];
  if (!cart || lines.length === 0) return { error: "Votre panier ne contient aucun article disponible." };

  // anti double-soumission : un même jeton de paiement ne crée qu'une commande
  const existing = await db.orderEvent.findFirst({ where: { note: `checkout:${d.checkoutToken}` }, include: { order: true } });
  if (existing) redirect(`/commande/${existing.order.number}`);

  const s = await getSession();
  const totals = cartTotals(cart, d.deliveryMode);
  const number = orderNumber();

  const order = await db.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        number,
        userId: s?.userId,
        customerName: d.customerName,
        customerPhone: d.customerPhone,
        customerEmail: d.customerEmail || null,
        city: d.city,
        district: d.district || null,
        addressNote: d.addressNote || null,
        deliveryMode: d.deliveryMode,
        deliveryFee: totals.deliveryFee,
        subtotal: totals.subtotal,
        discount: totals.discount,
        giftWrapFee: totals.giftWrapFee,
        customFees: totals.customFees,
        total: totals.total,
        promoCode: cart.promoCode,
        giftWrap: cart.giftWrap,
        giftNote: cart.giftNote,
        paymentMethod: d.paymentMethod,
        items: {
          create: lines.map((l) => ({
            productId: l.product.id,
            productName: `${l.product.brand} ${l.product.name}`,
            quantity: l.quantity,
            unitPrice: l.price!,
            ...(l.custom ? { custom: l.custom, customFee: l.customFee } : {}),
          })),
        },
        events: {
          create: [
            { status: "PENDING_VENDOR", note: `checkout:${d.checkoutToken}`, actor: "systeme" },
            { status: "PENDING_VENDOR", note: "Commande reçue. Nous demandons la confirmation de disponibilité au vendeur.", actor: "eden" },
          ],
        },
      },
      include: { items: true },
    });
    for (const item of o.items) await requestNextVendor(tx, item.id);
    await syncOrderStatus(tx, o.id);
    if (cart.promoCode) await tx.promoCode.update({ where: { code: cart.promoCode }, data: { uses: { increment: 1 } } });
    await tx.cart.delete({ where: { id: cart.id } });
    return o;
  });
  await clearCartCookie();
  const jar = await cookies();
  const mine = (jar.get("eden_orders")?.value ?? "").split(",").filter(Boolean).slice(-19);
  jar.set("eden_orders", [...mine, order.number].join(","), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 180 });
  await logActivity({ actorId: s?.userId, actorRole: s?.role ?? "GUEST", action: "order.create", entity: "order", entityId: order.id, data: { total: order.total } });
  redirect(`/commande/${order.number}?nouvelle=1`);
}

async function ownOrder(number: string) {
  const order = await db.order.findUnique({ where: { number } });
  if (!order) throw new Error("Commande introuvable");
  if (!(await canSeeOrder(order))) throw new Error("Accès refusé");
  return { order };
}

export async function cancelOrder(form: FormData) {
  const { order } = await ownOrder(String(form.get("number")));
  if (!CUSTOMER_CANCELLABLE.includes(order.status)) throw new Error("Cette commande ne peut plus être annulée en ligne.");
  await changeOrderStatus(order.id, "CANCELLED", "client", "Annulée par le client.");
  revalidatePath(`/commande/${order.number}`);
}

export async function confirmReception(form: FormData) {
  const { order } = await ownOrder(String(form.get("number")));
  if (order.status !== "DELIVERED") throw new Error("La commande n'est pas encore livrée.");
  await changeOrderStatus(order.id, "CLOSED", "client", "Réception confirmée par le client.");
  revalidatePath(`/commande/${order.number}`);
}

const claimSchema = z.object({ number: z.string(), subject: z.string().trim().min(3).max(120), message: z.string().trim().min(10, "Décrivez le problème en quelques mots").max(2000) });

export async function createClaim(_: ActionState, form: FormData): Promise<ActionState> {
  const s = await getSession();
  if (!s) return { error: "Connectez-vous pour ouvrir une réclamation." };
  const parsed = claimSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const order = await db.order.findUnique({ where: { number: parsed.data.number } });
  if (!order || order.userId !== s.userId) return { error: "Commande introuvable" };
  await db.claim.create({ data: { orderId: order.id, userId: s.userId, subject: parsed.data.subject, message: parsed.data.message } });
  revalidatePath("/compte");
  return { ok: true, message: "Réclamation envoyée. L'équipe Eden vous répond rapidement." };
}

const quoteSchema = z.object({
  orgName: z.string().trim().min(2, "Indiquez votre organisation").max(120),
  contactName: z.string().trim().min(2, "Indiquez votre nom").max(80),
  email: z.email("Adresse e-mail invalide"),
  phone: z.string().trim().min(8, "Numéro invalide").max(20),
  needs: z.string().trim().min(10, "Décrivez votre besoin").max(3000),
  quantity: z.coerce.number().int().min(1).max(100000).optional().or(z.literal("").transform(() => undefined)),
  budget: z.coerce.number().int().min(0).optional().or(z.literal("").transform(() => undefined)),
});

export async function requestQuote(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = quoteSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const s = await getSession();
  const user = s ? await db.user.findUnique({ where: { id: s.userId } }) : null;
  const q = await db.quote.create({ data: { ...parsed.data, userId: s?.userId, organizationId: user?.organizationId } });
  await logActivity({ actorId: s?.userId, actorRole: s?.role ?? "GUEST", action: "quote.create", entity: "quote", entityId: q.id });
  return { ok: true, message: "Demande envoyée. Un conseiller Eden vous recontacte sous 24 h ouvrées." };
}

const addressSchema = z.object({
  label: z.string().trim().min(2).max(40),
  city: z.string().trim().min(2).max(60),
  district: z.string().trim().min(2).max(80),
  details: z.string().trim().max(200).optional(),
  phone: z.string().trim().min(8).max(20),
});

export async function addAddress(_: ActionState, form: FormData): Promise<ActionState> {
  const s = await getSession();
  if (!s) return { error: "Connexion requise" };
  const parsed = addressSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Adresse incomplète" };
  await db.address.create({ data: { ...parsed.data, userId: s.userId } });
  revalidatePath("/compte");
  return { ok: true, message: "Adresse ajoutée" };
}

export async function deleteAddress(form: FormData) {
  const s = await getSession();
  if (!s) return;
  await db.address.deleteMany({ where: { id: String(form.get("id")), userId: s.userId } });
  revalidatePath("/compte");
}
