/**
 * Le score : ce qu'il FALLAIT faire, contre ce qu'on A fait.
 *
 * Le chronomètre seul récompense de taper vite, pas de taper juste. La mesure
 * qui apprend quelque chose est le rapport entre le minimum théorique et le
 * réel.
 *
 * On compare des CARACTÈRES et non des transactions. C'est volontaire : le
 * minimum théorique en nombre de gestes n'est pas calculable — renommer quatre
 * occurrences au multi-curseur, c'est une seule transaction qui touche quatre
 * endroits. En caractères, en revanche, le minimum est exact : c'est la distance
 * d'édition entre le départ et la cible.
 *
 * Ce que ça attrape, et c'est précisément le défaut à corriger : retaper une
 * ligne entière pour changer un mot. Le minimum dit 3 caractères, le réel en
 * compte 60, l'efficacité tombe à 0,05.
 */

/**
 * Distance d'édition en insertions/suppressions de caractères — la seule qui
 * corresponde à ce qu'un éditeur sait faire. On passe par la plus longue
 * sous-séquence commune : distance = (ce qui reste à supprimer) + (à insérer).
 *
 * Pas de substitution dans le modèle : CodeMirror n'en émet pas, une
 * substitution y est toujours une suppression suivie d'une insertion.
 */
export function distance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  // Les préfixes et suffixes communs ne coûtent rien : les retirer d'abord
  // fait tomber le coût du DP de façon spectaculaire sur des katas, où seules
  // quelques lignes changent au milieu d'un fichier identique.
  let debut = 0;
  const maxDebut = Math.min(a.length, b.length);
  while (debut < maxDebut && a[debut] === b[debut]) debut++;

  let fin = 0;
  const maxFin = Math.min(a.length, b.length) - debut;
  while (fin < maxFin && a[a.length - 1 - fin] === b[b.length - 1 - fin]) fin++;

  const x = a.slice(debut, a.length - fin);
  const y = b.slice(debut, b.length - fin);
  if (!x.length) return y.length;
  if (!y.length) return x.length;

  // LCS par programmation dynamique, deux lignes seulement en mémoire.
  let precedente = new Uint32Array(y.length + 1);
  let courante = new Uint32Array(y.length + 1);
  for (let i = 1; i <= x.length; i++) {
    for (let j = 1; j <= y.length; j++) {
      courante[j] =
        x[i - 1] === y[j - 1]
          ? precedente[j - 1] + 1
          : Math.max(precedente[j], courante[j - 1]);
    }
    const echange = precedente;
    precedente = courante;
    courante = echange;
    courante.fill(0);
  }
  const lcs = precedente[y.length];
  return x.length - lcs + (y.length - lcs);
}

export interface Score {
  /** caractères qu'il fallait strictement toucher */
  minimum: number;
  /** caractères réellement insérés + supprimés */
  reel: number;
  /** minimum / reel, plafonné à 1 — 1,00 = parcours parfait */
  efficacite: number;
  /** caractères brassés pour rien */
  gaspilles: number;
}

export function score(depart: string, cible: string, caracteresTouches: number): Score {
  const minimum = distance(depart, cible);
  const reel = Math.max(caracteresTouches, minimum);
  return {
    minimum,
    reel,
    efficacite: reel === 0 ? 1 : Math.min(1, minimum / reel),
    gaspilles: reel - minimum,
  };
}

/**
 * Part du chemin parcourue, de 0 à 1.
 *
 * Mesurée par la même distance, et non par le préfixe commun : dès qu'on édite
 * au milieu du fichier, un compteur de préfixe s'effondre alors qu'on avance.
 */
export function progression(courant: string, depart: string, cible: string): number {
  const total = distance(depart, cible);
  if (total === 0) return 1;
  const restant = distance(courant, cible);
  return Math.max(0, Math.min(1, 1 - restant / total));
}
