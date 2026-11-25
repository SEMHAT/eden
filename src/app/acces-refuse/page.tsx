import { Container, ButtonLink } from "@/components/ui";

export const metadata = { title: "Accès refusé" };

export default function Denied() {
  return (
    <Container className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <h1 className="headline">Accès réservé.</h1>
        <p className="mt-3 text-eden-mute">Cet espace n&apos;est pas accessible avec votre compte.</p>
        <ButtonLink href="/" className="mt-6">Retour à l&apos;accueil</ButtonLink>
      </div>
    </Container>
  );
}
