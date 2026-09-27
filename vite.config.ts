import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Le site est publié sur GitHub Pages sous forme de "project page" :
  // https://curioflow.github.io/devis-factures/
  // Tous les chemins d'assets générés doivent donc être préfixés par ce sous-dossier.
  base: '/devis-factures/',
  plugins: [react(), tailwindcss()],
})
