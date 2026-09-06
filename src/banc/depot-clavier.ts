/**
 * Les touches du banc de navigation.
 *
 * Un banc qui entraîne à chercher dans un arbre et qui n'offre que la souris
 * pour changer de fichier n'entraîne pas à chercher : il entraîne à cliquer.
 * C'était le défaut le plus visible en ouvrant l'écran — trois fichiers, aucun
 * moyen d'en ouvrir un sans quitter le clavier, sur un banc dont toute la
 * promesse est le geste.
 *
 * LES TOUCHES SONT CELLES DE VS CODE, PAS DES NÔTRES.
 *
 * Un raccourci inventé ici s'apprendrait ici et ne servirait nulle part. Le
 * banc mesure ce qui transfère au travail réel, donc il enseigne ce qui y sera
 * utile : `Ctrl+P` ouvre la recherche de fichier, `Alt+↓` / `Alt+↑` passent au
 * suivant. `Alt+1…9` est le seul ajout, et il n'entre en conflit avec rien —
 * ni dans l'éditeur, ni dans le navigateur, où ce sont les `Ctrl+1…9` qui
 * changent d'onglet.
 *
 * `Échap` ramène au champ de réponse. C'est la touche qui manque le plus quand
 * elle n'existe pas : sans elle, toute recherche se paie d'un retour à la
 * souris pour revenir écrire, et le geste qu'on vient d'apprendre est annulé
 * par le geste suivant.
 */

export type ActionDepot =
  /** ouvrir le n-ième fichier, 0 pour le premier */
  | { quoi: 'ouvrir'; index: number }
  /** avancer ou reculer dans la liste, en bouclant */
  | { quoi: 'deplacer'; pas: 1 | -1 }
  /** donner le focus au champ de recherche */
  | { quoi: 'chercher' }
  /** rendre le focus au champ de réponse */
  | { quoi: 'repondre' };

/** Ce qu'il faut savoir d'un événement clavier pour décider. */
export interface Touche {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
}

/**
 * L'action déclenchée par une touche, ou `null` si le dépôt n'a rien à en faire.
 *
 * `nombre` borne `Alt+1…9` : `Alt+7` sur un arbre de trois fichiers ne fait
 * rien plutôt que d'ouvrir le dernier. Ouvrir « le plus proche » sur une touche
 * hors plage apprend un décompte faux — on croit avoir visé le septième.
 *
 * `dansRecherche` distingue le seul cas où Échap ne veut pas dire la même
 * chose : dans le champ de recherche il ramène à la réponse, ailleurs il
 * appartient à l'application, qui recommence l'épreuve.
 */
export function actionDepot(
  t: Touche,
  nombre: number,
  dansRecherche: boolean,
): ActionDepot | null {
  const ctrl = t.ctrlKey || t.metaKey;

  if (ctrl && !t.altKey && !t.shiftKey && t.key.toLowerCase() === 'p') {
    return { quoi: 'chercher' };
  }

  if (t.altKey && !ctrl && !t.shiftKey) {
    if (t.key === 'ArrowDown') return { quoi: 'deplacer', pas: 1 };
    if (t.key === 'ArrowUp') return { quoi: 'deplacer', pas: -1 };
    if (/^[1-9]$/.test(t.key)) {
      const index = Number(t.key) - 1;
      return index < nombre ? { quoi: 'ouvrir', index } : null;
    }
  }

  if (t.key === 'Escape' && dansRecherche) return { quoi: 'repondre' };

  return null;
}

/** Le fichier atteint par un déplacement, en bouclant aux deux bouts. */
export function suivant(courant: number, pas: 1 | -1, nombre: number): number {
  if (nombre <= 0) return 0;
  return (courant + pas + nombre) % nombre;
}
