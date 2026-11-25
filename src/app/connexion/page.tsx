import Link from "next/link";
import type { Metadata } from "next";
import { Container, Input, Label } from "@/components/ui";
import { ActionForm } from "@/components/ActionForm";
import { login } from "@/actions/auth";

export const metadata: Metadata = { title: "Connexion" };

export default async function Connexion({ searchParams }: { searchParams: Promise<{ suite?: string }> }) {
  const suite = (await searchParams).suite ?? "";
  const demo = process.env.DEMO_MODE === "true";
  return (
    <Container className="grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-md">
        <h1 className="headline text-center">Bon retour.</h1>
        <p className="mt-2 text-center text-eden-mute">Connectez-vous à votre espace Eden.</p>
        <ActionForm action={login} submitLabel="Se connecter" submitClassName="w-full py-3.5" className="mt-8 rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
          <input type="hidden" name="suite" value={suite} />
          <label className="block">
            <Label>E-mail</Label>
            <Input name="email" type="email" required autoComplete="email" />
          </label>
          <label className="mt-4 block">
            <Label>Mot de passe</Label>
            <Input name="password" type="password" required autoComplete="current-password" />
          </label>
        </ActionForm>
        <p className="mt-6 text-center text-sm">
          Pas encore de compte ? <Link href={`/inscription${suite ? `?suite=${encodeURIComponent(suite)}` : ""}`} className="font-semibold text-eden-green underline">Créer un compte</Link>
        </p>
        {demo && (
          <p className="mt-6 rounded-2xl bg-eden-gold/15 p-4 text-xs text-[#6b4f16]">
            Version de démonstration : des comptes de test existent (client@eden.demo, pro@eden.demo, vendeur1@eden.demo, admin). Leurs mots de passe sont communiqués par l&apos;équipe Eden.
          </p>
        )}
      </div>
    </Container>
  );
}
