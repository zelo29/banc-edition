/**
 * Le banc de débogage.
 *
 * En entreprise on passe plus de temps à trouver la cause d'un défaut qu'à
 * écrire du neuf. C'est pourtant le seul geste du métier qu'on n'entraîne
 * jamais : on l'apprend par accident, sur des bugs qu'on n'a pas choisis.
 *
 * Mécaniquement, c'est de la lecture appliquée à une panne — même mesure, même
 * correcteur. Ce qui change est le matériau : on part d'un SYMPTÔME, pas d'une
 * question. Un appel, ce qu'on attendait, ce qu'on a obtenu. Le travail est de
 * remonter de l'effet à la ligne, et la réponse est toujours un numéro de ligne
 * — la seule réponse qui ne se devine pas.
 *
 * Chaque symptôme est vérifié par exécution dans `verif/debogage.mjs` : un banc
 * de débogage dont le bug n'existe pas enseigne l'erreur.
 */
import type { Langage } from '../banc/langages';

export interface Debogage {
  id: string;
  titre: string;
  /** La technologie lue — les huit premiers débogages sont en JavaScript. */
  langage: Langage;
  /** La technique de diagnostic entraînée. Montrée AVANT tant qu'elle n'est pas acquise. */
  geste: string;
  code: string;
  /**
   * Le code réparé.
   *
   * Localiser n'est pas réparer : pointer une ligne ne laisse rien dans les
   * mains. La seconde moitié de l'épreuve est une édition ordinaire — le code
   * fautif à gauche, la version correcte à droite — et on ne repart qu'après
   * l'avoir écrite.
   */
  correction: string;
  /** Ce qu'on observe : l'appel, l'attendu, l'obtenu. */
  symptome: string;
  question: string;
  /** Ce qu'on attend, affiché DANS le champ : ici toujours un numéro de ligne. */
  format: string;
  reponses: string[];
  explication: string;
}

const LIGNE = 'Quelle ligne contient la cause ?';
const NUMERO = 'un numéro de ligne — juste le chiffre';

export const DEBOGAGES: Debogage[] = [
  {
    id: 'reduce-vide',
    titre: 'La liste vide',
    langage: 'js',
    geste: 'Lis le message d’erreur en entier : il nomme presque toujours la cause, pas le symptôme',
    code: `export function moyenne(notes) {
  const total = notes.reduce((a, b) => a + b);
  return total / notes.length;
}`,
    correction: `export function moyenne(notes) {
  const total = notes.reduce((a, b) => a + b, 0);
  return total / notes.length;
}`,
    symptome: "moyenne([]) lève : « Reduce of empty array with no initial value »",
    question: LIGNE,
    format: NUMERO,
    reponses: ['2', 'ligne 2', 'l2'],
    explication:
      'Le message désigne le `reduce`, pas la division. Sans valeur initiale, `reduce` sur une liste vide n’a rien à rendre. `reduce((a, b) => a + b, 0)` corrige.',
  },
  {
    id: 'egalite-lache',
    titre: 'La comparaison qui ment',
    langage: 'js',
    geste: 'Une comparaison lâche convertit avant de comparer : `==` est une conversion déguisée',
    code: `export function trouver(liste, id) {
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id == id) return liste[i];
  }
  return null;
}`,
    correction: `export function trouver(liste, id) {
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id === id) return liste[i];
  }
  return null;
}`,
    symptome: "trouver([{ id: '01' }], 1) rend l'objet — on attendait null",
    question: LIGNE,
    format: NUMERO,
    reponses: ['3', 'ligne 3', 'l3'],
    explication:
      "`'01' == 1` est vrai : JavaScript convertit la chaîne en nombre avant de comparer. `===` compare aussi le type et rend faux.",
  },
  {
    id: 'sort-en-place',
    titre: 'Le tri qui salit',
    langage: 'js',
    geste: 'Cherche les méthodes qui modifient au lieu de rendre : `sort`, `reverse`, `splice`, `push`',
    code: `export function trier(valeurs) {
  return valeurs.sort((a, b) => a - b);
}`,
    correction: `export function trier(valeurs) {
  return [...valeurs].sort((a, b) => a - b);
}`,
    symptome: "après trier(original), original lui-même est trié — l'appelant ne s'y attendait pas",
    question: LIGNE,
    format: NUMERO,
    reponses: ['2', 'ligne 2', 'l2'],
    explication:
      '`sort` trie **en place** et rend le même tableau. `[...valeurs].sort(...)` trie une copie et laisse l’argument intact.',
  },
  {
    id: 'await-oublie',
    titre: 'La promesse que personne n’attend',
    langage: 'js',
    geste: 'Dans une fonction `async`, cherche les appels SANS `await` : ce sont des promesses lâchées',
    code: `export async function sauver(donnees) {
  const valide = verifier(donnees);
  if (!valide) return false;
  ecrire(donnees);
  return true;
}`,
    correction: `export async function sauver(donnees) {
  const valide = verifier(donnees);
  if (!valide) return false;
  await ecrire(donnees);
  return true;
}`,
    symptome: 'sauver() rend true, mais si le processus s’arrête juste après, rien n’a été écrit',
    question: LIGNE,
    format: NUMERO,
    reponses: ['4', 'ligne 4', 'l4'],
    explication:
      '`ecrire` est asynchrone : sans `await`, la fonction rend `true` avant que l’écriture soit partie. L’erreur ne se voit qu’en production, sous charge.',
  },
  {
    id: 'borne-exacte',
    titre: 'Le cas de la borne',
    langage: 'js',
    geste: 'Teste la valeur exacte de la borne : `<` et `<=` ne diffèrent que sur le cas qu’on n’essaie jamais',
    code: `export function tronquer(texte, max) {
  if (texte.length < max) return texte;
  return texte.slice(0, max - 3) + '...';
}`,
    correction: `export function tronquer(texte, max) {
  if (texte.length <= max) return texte;
  return texte.slice(0, max - 3) + '...';
}`,
    symptome: "tronquer('abcde', 5) rend 'ab...' — on attendait 'abcde', qui tient déjà en 5",
    question: LIGNE,
    format: NUMERO,
    reponses: ['2', 'ligne 2', 'l2'],
    explication:
      'Une chaîne de longueur exactement `max` tient sans être coupée. Il faut `<=`. Le bug ne se déclenche que sur un seul cas — celui qu’aucun test improvisé n’essaie.',
  },
  {
    id: 'falsy',
    titre: 'Le zéro qui disparaît',
    langage: 'js',
    geste: 'Une valeur « fausse » piégée : `if (x)` refuse 0, la chaîne vide et false autant que undefined',
    code: `const cache = {};

export function memoriser(cle, calcul) {
  if (cache[cle]) return cache[cle];
  cache[cle] = calcul();
  return cache[cle];
}`,
    correction: `const cache = {};

export function memoriser(cle, calcul) {
  if (cle in cache) return cache[cle];
  cache[cle] = calcul();
  return cache[cle];
}`,
    symptome: "memoriser('n', () => 0) rappelle le calcul à CHAQUE appel — le cache ne sert à rien",
    question: LIGNE,
    format: NUMERO,
    reponses: ['4', 'ligne 4', 'l4'],
    explication:
      '`cache[cle]` vaut 0, qui est faux : la garde croit que rien n’est en cache. Il faut tester la présence — `cle in cache` — pas la valeur.',
  },
  {
    id: 'spread-superficiel',
    titre: 'La copie qui n’en est pas une',
    langage: 'js',
    geste: 'Le spread ne copie qu’un niveau : au-delà, les objets imbriqués restent partagés',
    code: `const DEFAUT = { limites: { max: 10 } };

export function options(perso = {}) {
  const o = { ...DEFAUT, ...perso };
  return o;
}`,
    correction: `const DEFAUT = { limites: { max: 10 } };

export function options(perso = {}) {
  const o = { ...structuredClone(DEFAUT), ...perso };
  return o;
}`,
    symptome: 'options().limites.max = 99 modifie aussi DEFAUT.limites.max, pour tout le programme',
    question: LIGNE,
    format: NUMERO,
    reponses: ['4', 'ligne 4', 'l4'],
    explication:
      '`{ ...DEFAUT }` copie la propriété `limites`, mais c’est la même référence d’objet. Seul le premier niveau est dupliqué.',
  },
  {
    id: 'ordre-des-gardes',
    titre: 'La garde arrivée trop tard',
    langage: 'js',
    geste: 'L’ordre des gardes est une logique : la première qui correspond gagne, même si elle a tort',
    code: `export function decrire(valeur) {
  if (typeof valeur === 'object') return 'objet';
  if (valeur === null) return 'nul';
  return typeof valeur;
}`,
    correction: `export function decrire(valeur) {
  if (valeur === null) return 'nul';
  if (typeof valeur === 'object') return 'objet';
  return typeof valeur;
}`,
    symptome: "decrire(null) rend 'objet' — la garde qui suit n'est jamais atteinte",
    question: LIGNE,
    format: NUMERO,
    reponses: ['2', 'ligne 2', 'l2'],
    explication:
      "`typeof null` vaut `'object'` — une bizarrerie du langage vieille de trente ans. La garde du nul doit passer AVANT celle de l'objet.",
  },
];
