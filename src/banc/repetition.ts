/**
 * La répétition : refaire tout de suite ce qu'on vient d'apprendre.
 *
 * C'est le seul dispositif d'apprentissage moteur qui existe, et il ne fabrique
 * aucune épreuve neuve — il rend plus efficace tout ce qui existe déjà. C'est
 * pour ça qu'il passe devant les bancs suivants.
 *
 * Trois décisions le définissent, et chacune corrige une façon naturelle de se
 * tromper.
 *
 * 1. ON NE RÉPÈTE QUE LE BANC D'ÉDITION.
 *
 * Refaire une lecture ou un débogage qu'on vient de résoudre ne mesure plus
 * rien : on connaît la réponse, le second essai vaut 100 % par construction, et
 * la courbe monterait toute seule en annonçant un progrès qui n'existe pas. Un
 * geste d'édition, lui, reste exactement aussi difficile la deuxième fois —
 * savoir QUOI faire ne dit pas qu'on sait le faire. C'est toute la différence
 * entre un banc qui mesure la main et un banc qui mesure l'œil, et elle décide
 * ici de qui a le droit d'être répété.
 *
 * 2. ON NE RÉPÈTE QUE CE QU'ON N'A PAS TENU.
 *
 * Tenir un geste du premier coup veut dire qu'on l'a. Le refaire quatre fois
 * n'apprend rien et coûte le seul budget qui compte vraiment : l'envie de
 * rouvrir l'outil demain.
 *
 * 3. L'INDICE NE PARAÎT QU'AU PREMIER ESSAI — LA REPRISE EST LE TEST.
 *
 * Le banc montrait déjà le geste avant un kata non acquis, et le testait un
 * autre jour. Entre les deux, il se passait vingt-quatre heures pendant
 * lesquelles on oubliait. La reprise ramène le test dans la minute qui suit la
 * leçon : montré une fois, puis refait sans rien sous les yeux. Une reprise
 * tenue compte donc comme un vrai geste tenu, ce que la première ne pouvait
 * jamais faire.
 *
 * Ce que ce module ne fait pas : il ne dessine pas la courbe et ne connaît pas
 * l'interface. Il décide, il compte, et il rend des nombres.
 */
import { SEUIL_ACQUIS, type EtapeFaite } from './seance.ts';
import type { Epreuve } from './epreuves.ts';

/**
 * Trois essais au maximum sur une même épreuve : l'original et deux reprises.
 *
 * La roadmap disait cinq. Cinq, c'est la bonne dose pour une séance entière
 * consacrée à UN geste ; ici la séance en tire cinq différents, et cinq fois
 * cinq est un exercice que personne ne finit. Trois suffisent à voir la courbe
 * bouger, qui est tout ce qu'on demande à la reprise.
 */
export const MAX_ESSAIS = 3;

/**
 * Le budget de reprises d'une séance entière.
 *
 * Sans lui, une séance de cinq katas ratés durerait quinze étapes — et la
 * taille fixe, connue d'avance, est précisément ce qui permet de la relancer
 * demain. Le mécanisme censé faire revenir ne doit pas être ce qui fait fuir.
 */
export const MAX_REPRISES_SEANCE = 4;

/**
 * Cette épreuve peut-elle être reprise ?
 *
 * Le banc, et non l'épreuve : c'est une propriété de ce qu'on mesure, pas du
 * contenu. Un banc futur qui mesurerait un geste plutôt qu'une réponse
 * entrerait ici sans discussion.
 */
export function repetable(epreuve: Epreuve): boolean {
  return epreuve.banc === 'edition';
}

/**
 * Faut-il refaire cette épreuve tout de suite ?
 *
 * `essais` porte les efficacités déjà obtenues sur cette épreuve DANS cette
 * séance, dans l'ordre. Appelée après chaque réussite.
 */
export function refaire(
  epreuve: Epreuve,
  essais: number[],
  reprisesRestantes: number,
): boolean {
  if (!repetable(epreuve)) return false;
  if (reprisesRestantes <= 0) return false;
  if (essais.length === 0 || essais.length >= MAX_ESSAIS) return false;
  return essais[essais.length - 1] < SEUIL_ACQUIS;
}

/**
 * Montre-t-on l'indice pour cet essai ?
 *
 * `numero` est l'indice de l'essai à venir : 0 pour le premier, 1 pour la
 * première reprise. Un geste déjà acquis n'a jamais d'indice, une reprise non
 * plus — c'est ce qui fait d'elle un test.
 */
export function montrerIndice(dejaAcquis: boolean, numero: number): boolean {
  return !dejaAcquis && numero === 0;
}

/** La courbe d'une série, telle qu'on la raconte. */
export interface Progres {
  /** les efficacités, dans l'ordre des essais */
  essais: number[];
  premier: number;
  /** ce qu'on sait faire maintenant : c'est le dernier essai, pas le meilleur */
  dernier: number;
  /** dernier moins premier — négatif si on a fait pire, et on le dit */
  gain: number;
  /** le dernier essai passe-t-il le seuil ? */
  tenu: boolean;
}

/**
 * Ce que la série a donné.
 *
 * On retient le DERNIER essai et non le meilleur : la question posée est « que
 * sais-tu faire maintenant », pas « qu'as-tu réussi une fois ». Garder le
 * meilleur transformerait la reprise en machine à tirer au sort une bonne note.
 */
export function progres(essais: number[]): Progres | null {
  if (!essais.length) return null;
  const premier = essais[0];
  const dernier = essais[essais.length - 1];
  return { essais, premier, dernier, gain: dernier - premier, tenu: dernier >= SEUIL_ACQUIS };
}

/**
 * Les étapes que le bilan doit compter : une seule par épreuve, la dernière.
 *
 * Sans ça, la reprise se punit elle-même. L'efficacité d'une séance est la
 * somme des minimums sur la somme des réels ; trois essais sur le même kata
 * ajoutent trois fois le réel, et le score de la séance s'effondre — pour avoir
 * fait exactement ce que l'outil venait de demander. Un mécanisme
 * d'apprentissage qui dégrade la note de celui qui l'utilise ne sera pas
 * utilisé deux fois.
 */
export function derniersEssais(faites: EtapeFaite[]): EtapeFaite[] {
  const dernier = new Map<string, EtapeFaite>();
  for (const e of faites) dernier.set(e.kataId, e);

  // On garde le CONTENU du dernier essai, à la PLACE du premier. Filtrer sur la
  // dernière occurrence rendait la liste dans le désordre : un kata repris
  // remontait derrière ceux qui l'avaient suivi, et le bilan racontait une
  // séance qui n'a pas eu lieu. Une reprise n'est pas une épreuve de plus.
  const vus = new Set<string>();
  const sortie: EtapeFaite[] = [];
  for (const e of faites) {
    if (vus.has(e.kataId)) continue;
    vus.add(e.kataId);
    sortie.push(dernier.get(e.kataId)!);
  }
  return sortie;
}

/** Le nombre de reprises consommées par une séance — l'original ne compte pas. */
export function reprisesFaites(faites: EtapeFaite[]): number {
  const vues = new Set<string>();
  let n = 0;
  for (const e of faites) {
    if (vues.has(e.kataId)) n++;
    vues.add(e.kataId);
  }
  return n;
}
