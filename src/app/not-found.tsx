import { Container, ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <p className="font-display text-6xl font-bold text-eden-gold">404</p>
        <h1 className="headline mt-2">Cette page s&apos;est égarée. <span>Pas votre produit.</span></h1>
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href="/boutique">La boutique</ButtonLink>
          <ButtonLink href="/trouver" variant="outline">Trouver mon produit</ButtonLink>
        </div>
      </div>
    </Container>
  );
}
