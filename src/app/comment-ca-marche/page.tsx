import type { Metadata } from "next";
import { Container, PageHeader, ButtonLink } from "@/components/ui";
import { DELIVERY_FEES, GIFT_WRAP_FEE, CONFIRMATION_TTL_HOURS } from "@/lib/pricing";
import { fcfa } from "@/lib/format";

export const metadata: Metadata = { title: "Comment ça marche" };

const STEPS = [
  ["Vous choisissez", "Dans la boutique, ou en donnant votre budget et votre besoin à « Trouver mon produit »."],
  ["Le vendeur confirme", "Eden sollicite un vendeur partenaire vérifié. S'il n'a plus le produit, Eden en sollicite un autre. Vous ne payez rien avant cette confirmation."],
  ["Eden contrôle", "Le produit est vérifié selon les procédures Eden : état, conformité à la fiche, fonctionnement."],
  ["Vous recevez", "Livraison suivie à Lomé, ou retrait gratuit. Chaque étape est visible dans votre suivi de commande."],
];

const FAQ = [
  ["Que veut dire « disponibilité confirmée » ?", `Le vendeur a confirmé avoir le produit au cours des ${CONFIRMATION_TTL_HOURS} dernières heures. Sinon, nous affichons « à confirmer auprès du vendeur » : la disponibilité est vérifiée à la commande.`],
  ["Et si le produit n'est plus disponible ?", "Eden sollicite automatiquement un autre vendeur partenaire. Si aucun ne l'a, nous vous contactons pour vous proposer une alternative ou annuler sans frais."],
  ["Comment payer ?", "Aujourd'hui : à la livraison ou au retrait, après contrôle du produit. Le paiement Mobile Money (T-Money, Flooz) et par carte arrive prochainement."],
  ["Combien coûte la livraison ?", `Livraison standard à Lomé : ${fcfa(DELIVERY_FEES.STANDARD)}. Express : ${fcfa(DELIVERY_FEES.EXPRESS)}. Retrait au point Eden : gratuit. Emballage cadeau : ${fcfa(GIFT_WRAP_FEE)}.`],
  ["Qu'est-ce que le bonus Eden ?", "Chaque commande clôturée vous rapporte 1 point par tranche de 1 000 FCFA, visible dans votre espace client."],
  ["Je suis vendeur, comment devenir partenaire ?", "Créez un compte vendeur. L'équipe Eden vérifie votre boutique avant d'activer vos offres."],
];

export default function HowItWorks() {
  return (
    <>
      <PageHeader title="Comment ça marche." tagline="Simple pour vous, rigoureux pour nous." />
      <Container className="mt-10">
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-soft)]">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-eden-green font-display font-bold text-eden-gold">{i + 1}</span>
              <p className="mt-4 font-display text-lg font-semibold">{t}</p>
              <p className="mt-2 text-sm text-eden-mute">{d}</p>
            </li>
          ))}
        </ol>

        <section className="mt-16 max-w-3xl">
          <h2 className="headline">Questions fréquentes.</h2>
          <div className="mt-6 divide-y divide-eden-charcoal/10 rounded-[var(--radius-card)] bg-white px-6 shadow-[var(--shadow-soft)]">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {q}
                  <span className="text-eden-gold transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-eden-mute">{a}</p>
              </details>
            ))}
          </div>
        </section>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/trouver">Trouver mon produit</ButtonLink>
          <ButtonLink href="/boutique" variant="outline">Explorer la boutique</ButtonLink>
        </div>
      </Container>
    </>
  );
}
