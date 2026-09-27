# Devis & Factures

Application web pour créer des devis et des factures, pensée pour les indépendants.

- 🔒 **100 % locale** : aucune donnée n'est envoyée sur un serveur, tout est stocké dans le navigateur (`localStorage`). Pas de compte à créer.
- 🌍 **Taxes réglables** : modèles prêts à l'emploi pour le Québec (TPS + TVQ), la France (TVA) et le Sénégal (TVA), ou taux personnalisés.
- 💱 Devises : CAD, EUR, XOF (FCFA), USD, CHF, MAD.
- 🔁 Transformez un devis accepté en facture en un clic, avec numérotation automatique et continue.
- 📄 Export PDF avec mise en page soignée (logo, coordonnées, tableau des lignes, taxes, totaux).
- 📱 Interface en français, responsive (ordinateur et téléphone).
- 💾 Sauvegarde/restauration de vos données via un simple fichier JSON (à faire régulièrement, puisque tout vit dans votre navigateur).

## Démarrer en local

```bash
npm install
npm run dev
```

## Construire pour la production

```bash
npm run build
npm run preview   # pour prévisualiser le build localement
```

## Déploiement sur GitHub Pages

Le dépôt contient un workflow GitHub Actions (`.github/workflows/deploy.yml`) qui construit et publie
automatiquement le site à chaque push sur `main`.

Étapes à faire une seule fois côté GitHub :

1. Pousser ce dépôt sur `github.com/curioflow/devis-factures`.
2. Dans **Settings → Pages**, sous « Build and deployment », choisir la source **GitHub Actions**.
3. Pousser sur `main` (ou lancer le workflow manuellement depuis l'onglet **Actions**) : le site est
   ensuite disponible à l'adresse
   **https://curioflow.github.io/devis-factures/**.

Le routage utilise `HashRouter` (URLs du type `.../#/clients`), ce qui évite tout problème de
rafraîchissement de page sur un hébergement 100 % statique comme GitHub Pages : aucune configuration
serveur supplémentaire n'est nécessaire.

> Si le dépôt est renommé ou déplacé sous un autre compte/organisation, pensez à mettre à jour la
> propriété `base` dans `vite.config.ts` pour qu'elle corresponde au nouveau chemin
> (`/nom-du-nouveau-depot/`).

## Stack technique

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Zustand](https://github.com/pmndrs/zustand) (état + persistance `localStorage`)
- [jsPDF](https://github.com/parallax/jsPDF) + [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) pour la génération de PDF
- [react-router-dom](https://reactrouter.com/) (`HashRouter`)
