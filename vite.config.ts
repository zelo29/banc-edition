import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * `base` vise le sous-chemin de GitHub Pages — `zelo29.github.io/banc-edition/`.
 *
 * C'est la seule ligne qui sépare un dépôt qu'on lance avec `cd` et `npm run
 * dev` d'un signet qu'on ouvre en un geste, et le lancement est le vrai
 * blocage : un instrument de mesure parfait qu'on n'ouvre jamais ne fait
 * progresser personne.
 *
 * Un détail à savoir avant de basculer : `localStorage` est cloisonné par
 * origine. L'historique de `localhost:5180` ne suivra pas sur le site déployé,
 * et inversement. Il faut donc choisir lequel des deux est LE banc — le
 * déployé, si on veut l'ouvrir tous les jours — et garder `npm run dev` pour
 * développer, pas pour s'entraîner.
 */
export default defineConfig({
  base: '/banc-edition/',
  plugins: [react()],
  server: { port: 5180 },
});
