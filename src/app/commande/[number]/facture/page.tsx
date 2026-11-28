import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import { describeCustom } from "@/lib/custom-server";
import { canSeeOrder } from "@/lib/access";
import { fcfa, dateFr, PAYMENT_LABEL, DELIVERY_LABEL } from "@/lib/format";
import { PrintButton } from "@/components/PrintButton";

export const metadata = { title: "Facture", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Invoice({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const o = await db.order.findUnique({ where: { number }, include: { items: { where: { status: { not: "CANCELLED" } } } } });
  if (!o || !(await canSeeOrder(o))) notFound();
  const legal = process.env.EDEN_LEGAL_MENTIONS;
  return (
    <div className="mx-auto max-w-3xl bg-white p-8 my-8 shadow-[var(--shadow-soft)] print:my-0 print:shadow-none sm:p-12">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-3">
          <Image src="/brand/eden-logo.webp" alt="" width={40} height={52} />
          <div>
            <p className="font-display text-2xl font-bold">EDEN</p>
            <p className="text-xs text-eden-mute">Lomé, Togo</p>
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="font-display text-xl font-semibold">{o.paymentStatus === "SUCCEEDED" ? "Facture" : "Facture pro forma"}</p>
          <p>N° {o.number}</p>
          <p className="text-eden-mute">{dateFr(o.createdAt)}</p>
        </div>
      </div>
      <div className="mt-8 text-sm">
        <p className="font-semibold">Client</p>
        <p>{o.customerName}</p>
        <p>{o.customerPhone}{o.customerEmail ? ` · ${o.customerEmail}` : ""}</p>
        <p>{o.district ? `${o.district}, ` : ""}{o.city}</p>
      </div>
      <table className="mt-8 w-full text-sm">
        <thead className="border-b border-eden-charcoal/20 text-left">
          <tr><th className="py-2">Désignation</th><th className="py-2 text-right">Qté</th><th className="py-2 text-right">Prix unitaire</th><th className="py-2 text-right">Montant</th></tr>
        </thead>
        <tbody>
          {o.items.map((i) => (
            <tr key={i.id} className="border-b border-eden-charcoal/5">
              <td className="py-2">{i.productName}{i.custom ? <span className="block text-xs text-eden-mute">Personnalisation : {describeCustom(i.custom).join(", ")} (+ {fcfa(i.customFee)})</span> : null}</td>
              <td className="py-2 text-right">{i.quantity}</td>
              <td className="py-2 text-right">{fcfa(i.unitPrice)}</td>
              <td className="py-2 text-right">{fcfa((i.unitPrice + i.customFee) * i.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="ml-auto mt-6 w-64 space-y-1 text-sm">
        <div className="flex justify-between"><dt>Sous-total</dt><dd>{fcfa(o.subtotal)}</dd></div>
        {o.discount > 0 && <div className="flex justify-between"><dt>Remise</dt><dd>− {fcfa(o.discount)}</dd></div>}
        {o.customFees > 0 && <div className="flex justify-between"><dt>Personnalisation</dt><dd>{fcfa(o.customFees)}</dd></div>}
        {o.giftWrapFee > 0 && <div className="flex justify-between"><dt>Emballage cadeau</dt><dd>{fcfa(o.giftWrapFee)}</dd></div>}
        <div className="flex justify-between"><dt>{DELIVERY_LABEL[o.deliveryMode]}</dt><dd>{fcfa(o.deliveryFee)}</dd></div>
        <div className="flex justify-between border-t border-eden-charcoal/20 pt-2 font-semibold"><dt>Total</dt><dd>{fcfa(o.total)}</dd></div>
      </dl>
      <p className="mt-8 text-xs text-eden-mute">Mode de paiement : {PAYMENT_LABEL[o.paymentMethod]}.</p>
      <p className="mt-2 text-xs text-eden-mute">{legal ?? "Mentions légales d'Eden (raison sociale, RCCM, NIF) à compléter dans la configuration avant le lancement."}</p>
      <div className="mt-8 print:hidden"><PrintButton /></div>
    </div>
  );
}
