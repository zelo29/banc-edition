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
import { NAVIGATIONS, type Navigation } from '../navigations/index.ts';

export type Epreuve =
  | ({ banc: 'edition' } & Kata)
  | ({ banc: 'lecture' } & Lecture)
  | ({ banc: 'debogage' } & Debogage)
  | ({ banc: 'navigation' } & Navigation);

/** Le nom d'un banc, dérivé des épreuves : ajouter un banc suffit à l'étendre. */
export type Banc = Epreuve['banc'];

/** Les bancs qui posent une question plutôt qu'une édition. */
export const AVEC_QUESTION = ['lecture', 'debogage', 'navigation'] as const;

export const EPREUVES: Epreuve[] = [
  ...KATAS.map((k) => ({ banc: 'edition' as const, ...k })),
  ...LECTURES.map((l) => ({ banc: 'lecture' as const, ...l })),
  ...DEBOGAGES.map((d) => ({ banc: 'debogage' as const, ...d })),
  ...NAVIGATIONS.map((n) => ({ banc: 'navigation' as const, ...n })),
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
    c =
      e.banc === 'edition'
        ? distance(e.depart, e.cible)
        : // Une navigation se compte en FICHIERS, pas en lignes. Sommer les
          // lignes de l'arbre suppose qu'on le lit en entier, ce qui est
          // exactement le geste que le banc apprend à ne pas faire : on ouvre
          // deux fichiers sur cinq et on ferme. La difficulté, c'est la taille
          // de l'espace de recherche, pas celle du texte.
          //
          // Ce n'est pas un détail d'échelle. En lignes, les six navigations
          // coûtaient 48 à 96 quand la lecture médiane en coûte 32 : elles
          // partaient donc en dernier parmi les épreuves jamais rencontrées, et
          // le banc entier n'apparaissait qu'à la NEUVIÈME séance.
          e.banc === 'navigation'
          ? e.fichiers.length * 12
          : e.code.split('\n').length * 4;
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
