import type { Metadata } from "next";
import { Container, Input, Label, Textarea, ButtonLink } from "@/components/ui";
import { ActionForm } from "@/components/ActionForm";
import { requestQuote } from "@/actions/shop";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Professionnels et institutions" };
export const dynamic = "force-dynamic";

const FEATURES = [
  ["Demande de devis", "Décrivez votre besoin, recevez une proposition chiffrée."],
  ["Commandes en quantité", "Équiper une équipe, une salle de classe ou un service entier."],
  ["Demandes personnalisées", "Configurations précises, marques imposées, délais serrés."],
  ["Facturation", "Factures au nom de votre organisation, adaptées à votre comptabilité."],
  ["Historique", "Tous vos devis et commandes retrouvés dans l'espace professionnel."],
  ["Contact commercial", "Un interlocuteur Eden qui suit vos demandes."],
];

export default async function Pros() {
  const s = await getSession();
  const user = s ? await db.user.findUnique({ where: { id: s.userId }, include: { organization: true } }) : null;
  return (
    <>
      <section className="bg-eden-ivory text-eden-charcoal">
        <Container className="py-14 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-eden-gold-2">Professionnels et institutions</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-tight sm:text-6xl">
            Équipez vos équipes. <span className="gold-text">Simplifiez vos achats.</span>
          </h1>
          <p className="mt-5 max-w-xl text-eden-mute">Entreprises, écoles, ONG et administrations : Eden centralise vos achats tech auprès de vendeurs vérifiés, avec des devis clairs et un suivi de bout en bout.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="#devis" variant="gold">Demander un devis</ButtonLink>
            <ButtonLink href={s ? "/espace-pro" : "/inscription?type=pro"} variant="outline-light">{s ? "Mon espace professionnel" : "Créer un compte pro"}</ButtonLink>
          </div>
        </Container>
      </section>

      <Container className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(([t, d]) => (
          <div key={t} className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-soft)]">
            <p className="font-display text-lg font-semibold">{t}</p>
            <p className="mt-2 text-sm text-eden-mute">{d}</p>
          </div>
        ))}
      </Container>

      <Container className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.3fr]" id="devis">
        <div>
          <h2 className="headline">Votre demande de devis. <span>Réponse sous 24 h ouvrées.</span></h2>
          <p className="mt-4 text-eden-mute">Plus votre description est précise (quantités, usages, délais, marques souhaitées), plus la proposition sera juste.</p>
        </div>
        <ActionForm action={requestQuote} submitLabel="Envoyer la demande" resetOnSuccess className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <Label>Organisation</Label>
              <Input name="orgName" required defaultValue={user?.organization?.name ?? ""} autoComplete="organization" />
            </label>
            <label>
              <Label>Votre nom</Label>
              <Input name="contactName" required defaultValue={user?.name ?? ""} autoComplete="name" />
            </label>
            <label>
              <Label>E-mail</Label>
              <Input name="email" type="email" required defaultValue={user?.email ?? ""} autoComplete="email" />
            </label>
            <label>
              <Label>Téléphone</Label>
              <Input name="phone" type="tel" required defaultValue={user?.phone ?? ""} autoComplete="tel" />
            </label>
            <label>
              <Label hint="(optionnel)">Quantité</Label>
              <Input name="quantity" inputMode="numeric" />
            </label>
            <label>
              <Label hint="(optionnel, FCFA)">Budget global</Label>
              <Input name="budget" inputMode="numeric" />
            </label>
            <label className="sm:col-span-2">
              <Label>Votre besoin</Label>
              <Textarea name="needs" required placeholder="Par exemple : 15 ordinateurs portables pour une école, i5 et 8 Go de RAM minimum, livraison à Lomé avant la rentrée." />
            </label>
          </div>
        </ActionForm>
      </Container>
    </>
  );
}
