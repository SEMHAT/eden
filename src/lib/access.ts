import "server-only";
import { cookies } from "next/headers";
import { getSession } from "./auth";

/** Le détail d'une commande n'est visible que par son client (compte ou appareil ayant passé la commande) et l'administration. */
export async function canSeeOrder(order: { number: string; userId: string | null }) {
  const s = await getSession();
  if (s?.role === "ADMIN") return true;
  if (s && order.userId === s.userId) return true;
  const mine = ((await cookies()).get("eden_orders")?.value ?? "").split(",");
  return mine.includes(order.number);
}
