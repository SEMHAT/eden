# Paiements

## Aujourd'hui

- **Paiement à la livraison** : actif. Il est enregistré automatiquement quand l'administration passe la commande en « Livrée ».
- **Mobile Money (T-Money, Flooz) et carte bancaire** : l'interface est prête mais désactivée. Ces moyens s'affichent « Bientôt disponible » tant qu'aucun prestataire n'est configuré. Aucune transaction n'est simulée.

## Ce qui est en place

- `src/lib/payments.ts` : interface `PaymentProvider` (`isConfigured`, `initiate`), liste des moyens disponibles.
- Table `Payment` avec `idempotencyKey` unique : une même tentative ne peut pas être enregistrée deux fois.
- Le paiement n'intervient qu'après la confirmation du vendeur (statut `CONFIRMED` puis `PAYMENT_PENDING`, puis `PAID`).
- Remboursement : statut `REFUNDED` sur la commande et le paiement.

## Pour activer Mobile Money et carte

1. Choisir un prestataire agréé au Togo qui gère T-Money, Flooz et la carte (par exemple FedaPay, CinetPay ou PayGate Global) et ouvrir un compte marchand.
2. Récupérer les identifiants **de test** (sandbox) puis de production.
3. Renseigner `PAYMENT_PROVIDER`, `PAYMENT_API_KEY` et `PAYMENT_WEBHOOK_SECRET` dans Vercel (jamais dans le code).
4. Implémenter `initiate` pour ce prestataire et une route webhook `src/app/api/paiements/webhook/route.ts`. Le webhook doit vérifier la signature, retrouver le paiement par sa référence, puis passer la commande en `PAID` dans une transaction.
5. Tester en sandbox : paiement réussi, échec, abandon, double clic, webhook reçu deux fois.
