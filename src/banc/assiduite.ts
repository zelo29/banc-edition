/**
 * Les jours où la séance a été faite.
 *
 * Le reste du produit répond à « est-ce que je progresse ». Celui-ci répond à
 * la seule question qui décide de tout : **est-ce que j'y reviens**. Un
 * instrument de mesure parfait qu'on n'ouvre jamais ne fait progresser
 * personne, et le critère de réussite n'a jamais été « la mesure est juste »
 * mais « je l'ouvre tous les jours ».
 *
 * Ce n'est pas un score. La carte des gestes dit ce que tu sais faire, le bilan
 * dit ce que tu viens de faire ; l'assiduité ne dit que des faits de calendrier,
 * et c'est justement pour ça qu'elle a le droit d'exister ici : des dates se
 * vérifient, un classement non.
 *
 * DEUX DÉCISIONS.
 *
 * **Le jour est LOCAL, jamais UTC.** `toISOString().slice(0, 10)` est le
 * réflexe, et il est faux : une séance faite à 00 h 30 à Paris s'enregistre la
 * veille, une séance faite à 23 h à Auckland s'enregistre le lendemain. On perd
 * ou on double un jour, et une série cassée par un fuseau horaire ne se
 * rattrape pas — on ne peut pas refaire hier.
 *
 * **Une série n'affiche jamais un zéro accusateur.** Manquer un jour est déjà
 * ce qui fait abandonner ; l'annoncer en rouge finit le travail. La série reste
 * donc VIVANTE tout le lendemain — elle se sauve encore — et quand elle est
 * vraiment rompue, on montre les jours faits sur sept, qui ne sont jamais nuls
 * quand on vient de revenir.
 */

/** Le jour local au format `AAAA-MM-JJ`. */
export function jourLocal(d: Date = new Date()): string {
  const deux = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
}

/**
 * La veille d'un jour.
 *
 * L'ancrage à midi n'est pas une coquetterie : au changement d'heure, minuit
 * moins vingt-quatre heures ne tombe pas sur minuit, et la veille du 30 mars
 * devient le 30 mars. À midi, la marge d'une heure absorbe le décalage.
 */
export function veille(jour: string): string {
  const [a, m, j] = jour.split('-').map(Number);
  const d = new Date(a, m - 1, j, 12);
  d.setDate(d.getDate() - 1);
  return jourLocal(d);
}

/** Ajoute un jour, sans doublon, et rend la liste triée. */
export function marquer(jours: string[], jour: string): string[] {
  return [...new Set([...jours, jour])].sort();
}

/**
 * La longueur de la suite de jours consécutifs qui se termine à `fin`.
 * Zéro si `fin` n'est pas dans la liste.
 */
function suiteFinissantLe(jours: string[], fin: string): number {
  const vus = new Set(jours);
  let n = 0;
  for (let j = fin; vus.has(j); j = veille(j)) n++;
  return n;
}

export type EtatSerie =
  /** la séance du jour est faite */
  | 'aujourdhui'
  /** faite hier, pas encore aujourd'hui : la série tient toujours */
  | 'a-sauver'
  /** la dernière séance est plus vieille qu'hier */
  | 'rompue'
  /** aucune séance, jamais */
  | 'jamais';

export interface Assiduite {
  etat: EtatSerie;
  /** jours consécutifs, série en cours — vaut 0 seulement si elle est rompue */
  serie: number;
  /** la plus longue jamais tenue */
  record: number;
  /** jours faits sur les sept derniers, aujourd'hui compris */
  surSept: number;
  total: number;
}

export function assiduite(jours: string[], aujourdhui = jourLocal()): Assiduite {
  const vus = new Set(jours);
  const hier = veille(aujourdhui);

  const etat: EtatSerie = vus.has(aujourdhui)
    ? 'aujourdhui'
    : vus.has(hier)
      ? 'a-sauver'
      : jours.length
        ? 'rompue'
        : 'jamais';

  // Le record se cherche sur toutes les fins possibles : la plus longue suite
  // n'est pas forcément celle qui touche aujourd'hui.
  let record = 0;
  for (const j of jours) record = Math.max(record, suiteFinissantLe(jours, j));

  let sept = 0;
  for (let j = aujourdhui, i = 0; i < 7; j = veille(j), i++) if (vus.has(j)) sept++;

  return {
    etat,
    serie: etat === 'aujourdhui' || etat === 'a-sauver' ? suiteFinissantLe(jours, vus.has(aujourdhui) ? aujourdhui : hier) : 0,
    record,
    surSept: sept,
    total: jours.length,
  };
}

const CLE = 'banc-edition:jours';

export function chargerJours(): string[] {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE) ?? '[]');
    return Array.isArray(brut) ? brut.filter((j) => typeof j === 'string').sort() : [];
  } catch {
    return []; // stockage illisible : on repart de zéro, sans bruit
  }
}

export function enregistrerJours(jours: string[]): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(jours));
  } catch {
    // Navigation privée, quota plein : la séance du jour compte quand même,
    // elle ne survivra simplement pas au rechargement.
  }
}
