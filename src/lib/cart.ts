import "server-only";
import { cookies } from "next/headers";
import { db } from "./db";
import { cardAvailability, productCardSelect } from "./catalog";
import { computeTotals, DELIVERY_FEES } from "./pricing";

const COOKIE = "eden_cart";

export async function getCartId(create = false): Promise<string | null> {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (id) {
    const exists = await db.cart.findUnique({ where: { id }, select: { id: true } });
    if (exists) return id;
  }
  if (!create) return null;
  const cart = await db.cart.create({ data: {} });
  jar.set(COOKIE, cart.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return cart.id;
}

export async function clearCartCookie() {
  (await cookies()).delete(COOKIE);
}

export async function getCart() {
  const id = await getCartId(false);
  if (!id) return null;
  const cart = await db.cart.findUnique({ where: { id }, include: { items: true } });
  if (!cart) return null;
  const products = await db.product.findMany({
    where: { id: { in: cart.items.map((i) => i.productId) } },
    select: productCardSelect,
  });
  const lines = cart.items
    .map((i) => {
      const p = products.find((x) => x.id === i.productId);
      if (!p) return null;
      const a = cardAvailability(p);
      return { itemId: i.id, quantity: i.quantity, product: p, price: a.price, availability: a.availability };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);
  const orderable = lines.filter((l) => l.price !== null && l.availability !== "OUT_OF_STOCK");
  const subtotal = orderable.reduce((s, l) => s + (l.price ?? 0) * l.quantity, 0);
  let promoPercent = 0;
  if (cart.promoCode) {
    const promo = await db.promoCode.findUnique({ where: { code: cart.promoCode } });
    if (promo && promo.active && (!promo.expiresAt || promo.expiresAt > new Date()) && (promo.maxUses === null || promo.uses < promo.maxUses))
      promoPercent = promo.percent;
  }
  return { id: cart.id, lines, subtotal, promoCode: promoPercent ? cart.promoCode : null, promoPercent, giftWrap: cart.giftWrap, giftNote: cart.giftNote };
}

export async function cartCount() {
  const id = await getCartId(false);
  if (!id) return 0;
  const agg = await db.cartItem.aggregate({ where: { cartId: id }, _sum: { quantity: true } });
  return agg._sum.quantity ?? 0;
}

export function cartTotals(cart: NonNullable<Awaited<ReturnType<typeof getCart>>>, mode: keyof typeof DELIVERY_FEES = "STANDARD") {
  const deliveryFee = DELIVERY_FEES[mode];
  return { ...computeTotals({ subtotal: cart.subtotal, deliveryFee, promoPercent: cart.promoPercent, giftWrap: cart.giftWrap }), deliveryFee, subtotal: cart.subtotal };
}
