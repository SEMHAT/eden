# Déploiement

## Étape 1 — Preview Vercel

1. Sur [vercel.com/new](https://vercel.com/new), importer le dépôt GitHub `SEMHAT/eden` (framework détecté : Next.js).
2. Avant le premier déploiement, onglet **Storage** du projet : ajouter une base **Neon Postgres** (intégration Vercel Marketplace) et la relier au projet, environnements Preview et Production. Elle crée `DATABASE_URL` et `DATABASE_URL_UNPOOLED`.
3. Onglet **Settings → Environment Variables**, ajouter :

| Variable | Valeur |
| --- | --- |
| `AUTH_SECRET` | 48 caractères aléatoires (`openssl rand -base64 48`) |
| `DEMO_MODE` | `true` |
| `DEMO_PASSWORD` | mot de passe des comptes de test |
| `SEED_ADMIN_EMAIL` | adresse de l'administrateur |
| `SEED_ADMIN_PASSWORD` | mot de passe administrateur, différent du précédent |
| `NEXT_PUBLIC_SITE_URL` | l'URL de la Preview, puis `https://eden.eledji.com` |

4. Déployer. La commande `vercel-build` applique les migrations, crée le catalogue de démonstration s'il est vide, puis construit le site.
5. Tester la Preview : accueil (3D et 2D), boutique et filtres, fiche produit, Trouver mon produit, Eden Gift, panier puis commande, espace vendeur (confirmer une demande), administration (faire avancer la commande), suivi client.

Comptes de test créés : `client@eden.demo`, `pro@eden.demo`, `vendeur1@eden.demo` à `vendeur4@eden.demo` (mot de passe `DEMO_PASSWORD`) et l'administrateur (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

## Étape 2 — Domaine eden.eledji.com (après validation de la Preview)

1. Vercel → projet → **Settings → Domains** → ajouter `eden.eledji.com`.
2. Chez le gestionnaire DNS d'`eledji.com`, créer l'enregistrement indiqué par Vercel. Pour un sous-domaine, c'est en général :

| Type | Nom | Valeur |
| --- | --- | --- |
| CNAME | `eden` | `cname.vercel-dns.com` |

   Vercel peut afficher une valeur propre au projet (du type `xxxx.vercel-dns-017.com`) : c'est celle-là qu'il faut utiliser. Si `eledji.com` utilise déjà des enregistrements CAA, ajouter `0 issue "letsencrypt.org"`.
3. Attendre la validation : Vercel émet le certificat HTTPS automatiquement.
4. Mettre `NEXT_PUBLIC_SITE_URL=https://eden.eledji.com` en Production et redéployer.
5. Vérifier : HTTPS, redirection éventuelle depuis l'URL `*.vercel.app`, connexion (le cookie de session est `Secure` et lié au domaine), commande complète, factures.

## Avant le lancement public

- Remplacer le catalogue de démonstration par le vrai, valider les vrais vendeurs, passer `DEMO_MODE=false`.
- Renseigner `EDEN_LEGAL_MENTIONS` (raison sociale, RCCM, NIF, adresse) pour les factures.
- Choisir le prestataire de paiement (voir `PAIEMENTS.md`).
- Activer les sauvegardes automatiques de la base (Neon : restauration à un instant donné incluse).
- Confirmer les frais de livraison et l'existence d'un point de retrait (valeurs dans `src/lib/pricing.ts`).
