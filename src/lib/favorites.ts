import "server-only";
import { db } from "./db";
import { getSession } from "./auth";

export async function favoriteIds(): Promise<Set<string>> {
  const s = await getSession();
  if (!s) return new Set();
  const favs = await db.favorite.findMany({ where: { userId: s.userId }, select: { productId: true } });
  return new Set(favs.map((f) => f.productId));
}
