# EDEN — La tech qui vous ressemble

Plateforme de commerce technologique pour le Togo : boutique, recherche par budget, Eden Gift, espace professionnel, réseau de vendeurs partenaires avec confirmation de disponibilité.

> **Dis-nous ton budget. On s'occupe du reste.**

## Ce qui fonctionne

| Domaine | Fonctionnalités |
| --- | --- |
| Accueil | Scène 3D (pomme Eden, 6 appareils, orbites dorées, parallaxe souris, défilement GSAP, appareils cliquables), rendu 2D de secours, recherche par budget, catégories, étagères produits, Eden Gift, « Seulement chez Eden », professionnels, engagements |
| Boutique | Catégories et sous-catégories, recherche, filtres (prix, marque, état, usage, disponibilité confirmée), tris, pagination, favoris, comparaison (4 produits) |
| Fiche produit | Galerie avec zoom, photos et vidéo si fournies, vue 3D à la demande, caractéristiques, disponibilité datée, livraison, garantie, produits complémentaires, données structurées |
| Trouver mon produit | Moteur déterministe : comprend budget, catégorie et usages en langage libre, interroge le catalogue et les offres vendeurs, classe, explique et compare |
| Eden Gift | Parcours en 6 étapes : destinataire, occasion, budget, goûts, sélection, emballage et message |
| Commandes | Panier, codes promo, emballage cadeau, livraison (standard, express, retrait), commande sans compte, anti double-soumission, suivi, annulation, confirmation de réception, réclamations, facture imprimable |
| Vendeurs | Demandes de confirmation, acceptation ou refus avec motif, réaffectation automatique au vendeur suivant, expiration des demandes, gestion des offres et prix, statistiques |
| Professionnels | Demande de devis, suivi des demandes, historique des commandes et factures |
| Administration | Tableau de bord, commandes (statuts contrôlés), vendeurs (validation, suspension), produits, marges par offre et par défaut, paiements, devis, réclamations, utilisateurs et rôles, contenus, codes promo, journal d'activité |

Le cycle de commande suit des transitions strictes (`src/lib/order-flow.ts`) : un produit n'est jamais annoncé disponible sans confirmation datée de moins de 72 h.

## Technique

- Next.js 15 (App Router, actions serveur), React 19, TypeScript, Tailwind CSS 4
- Three.js, React Three Fiber, Drei, GSAP ScrollTrigger, Framer Motion
- PostgreSQL et Prisma
- Sessions signées (JWT HS256, cookie httpOnly), mots de passe bcrypt, rôles vérifiés côté serveur à chaque action
- Tests : Vitest (logique métier et test d'intégration du cycle de commande sur PostgreSQL)

Choix d'architecture : une seule application Next.js (pages et API via actions serveur) plutôt qu'un monorepo Next + NestJS. C'est plus simple à déployer sur Vercel et suffisant pour le lancement. La logique métier est isolée dans `src/lib`, ce qui permet de l'extraire vers une API dédiée plus tard.

```
prisma/            schéma, migrations, données de démonstration
src/app/           pages (accueil, boutique, produit, trouver, eden-gift, panier, commande, compte, espace-pro, vendeur, admin…)
src/actions/       actions serveur (panier, auth, commande, vendeur, admin)
src/lib/           logique métier : prix, disponibilité, recommandation, cadeaux, commandes, paiements
src/components/    interface, scène 3D (hero/), galerie et 3D produit (product/)
tests/             tests Vitest
docs/              déploiement, paiements
```

## Lancer en local

Prérequis : Node.js 20 ou plus, PostgreSQL 14 ou plus.

```bash
cp .env.example .env          # puis renseigner DATABASE_URL, DATABASE_URL_UNPOOLED et AUTH_SECRET
npm install
npx prisma migrate deploy
DEMO_PASSWORD=choisir-un-mot-de-passe npm run db:seed
npm run dev                   # http://localhost:3000
```

Pour forcer le rendu 3D ou 2D de l'accueil pendant les tests : `/?rendu=3d` ou `/?rendu=2d`.

## Vérifications

```bash
npm run lint
npm run typecheck
npm test            # avec DATABASE_URL défini, le test d'intégration des commandes s'exécute aussi
npm run build
```

## Déploiement

Voir [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md) : Preview Vercel d'abord, puis domaine `eden.eledji.com` après validation.

## Ressources graphiques et 3D

- Logo : fourni par Eden, détouré pour le web (`public/brand/`).
- Appareils 3D et pomme 3D : modélisés en code (géométries Three.js procédurales), aucun fichier GLB externe, aucune licence tierce.
- Illustrations produits : vecteurs génériques sans logo de marque (`src/components/DeviceArt.tsx`), remplacées par les photos réelles dès qu'elles sont renseignées (`Product.images`).
- Polices : Sora et Inter (licence SIL Open Font), servies localement.

## Données de démonstration

Le catalogue, les prix et les vendeurs créés par `prisma/seed.ts` sont **fictifs**. Le bandeau « version de démonstration » reste affiché tant que `DEMO_MODE="true"`. Avant le lancement : remplacer le catalogue, valider les vrais vendeurs, passer `DEMO_MODE` à `false`.
