import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import { getCart } from "@/lib/cart";
import { getSession } from "@/lib/auth";
import { availableMethods } from "@/lib/payments";
import { db } from "@/lib/db";
import { DELIVERY_FEES } from "@/lib/pricing";
import { Container, PageHeader } from "@/components/ui";
import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata: Metadata = { title: "Commande" };
export const dynamic = "force-dynamic";

export default async function Checkout() {
  const cart = await getCart();
  const lines = cart?.lines.filter((l) => l.price !== null && l.availability !== "OUT_OF_STOCK") ?? [];
  if (!cart || lines.length === 0) redirect("/panier");
  const s = await getSession();
  const user = s ? await db.user.findUnique({ where: { id: s.userId }, include: { addresses: { orderBy: { createdAt: "desc" } } } }) : null;

  return (
    <>
      <PageHeader title="Finaliser la commande." tagline="Aucun paiement avant la confirmation du vendeur." />
      <Container className="mt-8">
        <CheckoutForm
          token={randomUUID()}
          signedIn={Boolean(s)}
          defaults={{
            name: user?.name ?? "",
            phone: user?.addresses[0]?.phone ?? user?.phone ?? "",
            email: user?.email ?? "",
            city: user?.addresses[0]?.city ?? "Lomé",
            district: user?.addresses[0]?.district ?? "",
            note: user?.addresses[0]?.details ?? "",
          }}
          addresses={user?.addresses.map((a) => ({ id: a.id, label: a.label, city: a.city, district: a.district, details: a.details ?? "", phone: a.phone })) ?? []}
          lines={lines.map((l) => ({ name: `${l.product.brand} ${l.product.name}${l.custom ? " (personnalisé)" : ""}`, quantity: l.quantity, price: l.price! + l.customFee }))}
          subtotal={cart.subtotal}
          customFees={cart.customFees}
          promoPercent={cart.promoPercent}
          giftWrap={cart.giftWrap}
          fees={DELIVERY_FEES}
          methods={availableMethods()}
        />
      </Container>
    </>
  );
}
