/**
 * Les deux bancs sous un seul toit.
 *
 * Une épreuve, c'est un exercice quel que soit le banc : un identifiant, un
 * titre, un geste enseigné. Tout ce qui vient après — le tirage, l'historique,
 * la carte, le bilan — ne travaille que sur cette forme-là et n'a jamais à
 * savoir s'il s'agit d'éditer ou de lire. C'est ce qui permettra d'ajouter un
 * troisième banc sans toucher à la séance.
 *
 * Seul l'écran sait faire la différence.
 */
import { distance } from './score.ts';
import { KATAS, type Kata } from '../katas/index.ts';
import { LECTURES, type Lecture } from '../lectures/index.ts';
import { DEBOGAGES, type Debogage } from '../debogages/index.ts';

export type Epreuve =
  | ({ banc: 'edition' } & Kata)
  | ({ banc: 'lecture' } & Lecture)
  | ({ banc: 'debogage' } & Debogage);

/** Le nom d'un banc, dérivé des épreuves : ajouter un banc suffit à l'étendre. */
export type Banc = Epreuve['banc'];

/** Les bancs qui posent une question plutôt qu'une édition. */
export const AVEC_QUESTION = ['lecture', 'debogage'] as const;

export const EPREUVES: Epreuve[] = [
  ...KATAS.map((k) => ({ banc: 'edition' as const, ...k })),
  ...LECTURES.map((l) => ({ banc: 'lecture' as const, ...l })),
  ...DEBOGAGES.map((d) => ({ banc: 'debogage' as const, ...d })),
];

const couts = new Map<string, number>();

/**
 * Le coût d'une épreuve, qui n'ordonne qu'une chose : les épreuves jamais
 * rencontrées, de la moins chère à la plus chère. Sans ça, la toute première
 * séance sert les cinq plus lourdes.
 *
 * Pour un kata, c'est exactement la distance d'édition. Pour une lecture, il
 * n'existe pas de mesure exacte de la difficulté : le nombre de lignes en est
 * le moins mauvais indice, ramené à la même échelle que les caractères.
 */
export function cout(e: Epreuve): number {
  let c = couts.get(e.id);
  if (c === undefined) {
    c = e.banc === 'edition' ? distance(e.depart, e.cible) : e.code.split('\n').length * 4;
    couts.set(e.id, c);
  }
  return c;
}

/**
 * Compare une réponse à celles attendues.
 *
 * On normalise franchement — casse, accents, guillemets, espaces, et le
 * « ligne » qu'on écrit machinalement devant un numéro. Refuser « Ligne 3 »
 * quand on attend « 3 » n'enseigne rien sur la lecture de code : ça n'apprend
 * qu'à deviner le format du correcteur.
 */
export function reponseJuste(saisie: string, attendues: string[]): boolean {
  const propre = (t: string) =>
    t
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[`'"«»]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  const s = propre(saisie);
  return s.length > 0 && attendues.some((a) => propre(a) === s);
}
