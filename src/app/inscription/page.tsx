import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { RegisterForm } from "@/components/RegisterForm";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function Inscription({ searchParams }: { searchParams: Promise<{ suite?: string; type?: string }> }) {
  const sp = await searchParams;
  const kind = sp.type === "pro" ? "PRO" : sp.type === "vendeur" ? "VENDOR" : "CUSTOMER";
  return (
    <Container className="grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-lg">
        <h1 className="headline text-center">Bienvenue chez Eden.</h1>
        <p className="mt-2 text-center text-eden-mute">Un compte pour suivre vos commandes, vos favoris et vos bonus.</p>
        <RegisterForm initialKind={kind} suite={sp.suite ?? ""} />
        <p className="mt-6 text-center text-sm">
          Déjà inscrit ? <Link href="/connexion" className="font-semibold text-eden-green underline">Se connecter</Link>
        </p>
      </div>
    </Container>
  );
}
