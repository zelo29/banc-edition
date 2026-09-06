/**
 * Ce qui reste d'une épreuve une fois qu'elle est finie.
 *
 * Le journal des gestes n'a jamais survécu à rien : `armer()` vide `gestes` au
 * début de chaque épreuve, et `EtapeFaite` ne garde que des totaux — durée,
 * frappes, souris, efficacité. Le coach annoncé par la roadmap doit pouvoir
 * dire « tu retapes des lignes entières au lieu de les déplacer » ou « tu prends
 * la souris dès que la sélection dépasse une ligne » : aucune de ces deux
 * phrases ne se déduit d'un total.
 *
 * Ce fichier existe donc AVANT le coach, et c'est le seul point de la roadmap
 * qui ait une urgence propre : **une séance faite avant lui est perdue pour
 * toujours.** On ne peut pas rejouer hier pour en extraire des gestes qu'on
 * n'a pas enregistrés.
 *
 * ON NE GARDE PAS LE JOURNAL, ON LE RÉSUME.
 *
 * Un kata produit cent à deux cents gestes. Cinq épreuves par jour, reprises
 * comprises, font près de quinze mille gestes par mois — une quinzaine de
 * mégaoctets par an, dans un `localStorage` qui en offre cinq. Garder le flux
 * brut n'est pas une option prudente qu'on aurait écartée par élégance : c'est
 * une option qui casse.
 *
 * La contrepartie est réelle et il faut la dire : **ce qui n'est pas résumé
 * aujourd'hui n'existera jamais.** Le choix des champs ci-dessous est donc le
 * choix de ce que le coach saura voir, et il se fait maintenant. D'où le seul
 * champ de séquence retenu — la plus longue rafale de retours arrière — parce
 * que c'est le seul motif qu'aucun total ne permet de reconstruire : quarante
 * `delete.backward` d'affilée et quarante répartis dans l'épreuve donnent le
 * même compteur et ne racontent pas la même chose.
 */
import type { Mesures } from './journal.ts';
import type { Banc } from './epreuves.ts';

export interface Trace {
  /** l'épreuve, pour rapprocher la trace de ce qu'elle demandait */
  id: string;
  banc: Banc;
  quand: number;
  duree: number;
  /** le minimum théorique et le réel : l'écart est le premier motif du coach */
  minimum: number;
  reel: number;
  /** transactions par annotation `userEvent`, telles que CodeMirror les nomme */
  evenements: Record<string, number>;
  /** la plus longue suite de `delete.backward` consécutifs */
  rafaleArriere: number;
}

/**
 * Deux cent cinquante jours de séances quotidiennes, reprises comprises.
 *
 * Au-delà, on jette les plus vieilles : un coach qui décrit comment tu
 * travaillais il y a un an décrit quelqu'un d'autre.
 */
export const PLAFOND = 2000;

/**
 * Résume les mesures d'une épreuve terminée.
 *
 * `minimum` et `reel` viennent du score et non des mesures : pour une lecture
 * ou une navigation, ils comptent des réponses et non des caractères, et c'est
 * l'appelant qui sait lequel des deux il tient.
 */
export function resumer(
  epreuve: { id: string; banc: Banc },
  mesures: Mesures,
  score: { minimum: number; reel: number },
  quand = Date.now(),
): Trace {
  const evenements: Record<string, number> = {};
  let rafale = 0;
  let courante = 0;

  for (const geste of mesures.gestes) {
    // Directement l'annotation : `journal.ts` écarte déjà les transactions qui
    // n'en portent pas — une sélection programmatique n'est pas un geste — donc
    // il n'y a pas de nom vide à rattraper ici. Un repli `|| 'selection'` ne
    // couvrait qu'un cas qui ne se produit jamais, et le harnais le testait.
    const e = geste.evenement;
    evenements[e] = (evenements[e] ?? 0) + 1;
    if (e === 'delete.backward') {
      courante++;
      if (courante > rafale) rafale = courante;
    } else {
      courante = 0;
    }
  }

  return {
    id: epreuve.id,
    banc: epreuve.banc,
    quand,
    duree: mesures.duree,
    minimum: score.minimum,
    reel: score.reel,
    evenements,
    rafaleArriere: rafale,
  };
}

/** Ajoute une trace, en jetant les plus anciennes au-delà du plafond. */
export function ajouter(traces: Trace[], trace: Trace): Trace[] {
  return [...traces, trace].slice(-PLAFOND);
}

const CLE = 'banc-edition:traces';

export function chargerTraces(): Trace[] {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE) ?? '[]');
    return Array.isArray(brut) ? brut.filter((t) => t && typeof t.id === 'string') : [];
  } catch {
    return []; // stockage illisible : on repart de zéro, sans bruit
  }
}

/**
 * Écrit les traces, et se rétracte si le quota est plein.
 *
 * Le quota se manifeste par une exception à l'écriture, pas avant. On réessaie
 * donc avec la moitié la plus récente plutôt que de tout perdre — et si même ça
 * échoue, on abandonne en silence : perdre l'historique du coach ne doit jamais
 * interrompre la séance en cours.
 */
export function enregistrerTraces(traces: Trace[]): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(traces));
  } catch {
    try {
      localStorage.setItem(CLE, JSON.stringify(traces.slice(-Math.floor(traces.length / 2))));
    } catch {
      // Navigation privée, quota vraiment plein : la séance continue sans.
    }
  }
}
