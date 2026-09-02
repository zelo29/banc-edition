/**
 * Le banc de lecture.
 *
 * Comprendre vite un fichier qu'on n'a jamais vu est ce qui sépare les bons
 * développeurs, personne ne l'entraîne, et c'est mesurable au chronomètre. Le
 * banc d'édition mesure la main ; celui-ci mesure l'œil.
 *
 * La mesure est la même dans son esprit : le minimum est UNE réponse, le réel
 * est le nombre de réponses données. Répondre juste du premier coup vaut 100 %.
 * Le temps compte, mais c'est le nombre de fausses pistes qui enseigne — il dit
 * si tu as lu ou si tu as deviné.
 *
 * La réponse est courte et exacte : un nombre, un mot, un numéro de ligne. Comme
 * pour les katas, pas de runner, pas de correcteur — on compare des chaînes.
 * Une question dont la réponse ne tient pas en un mot est une question mal posée.
 */
import type { Langage } from '../banc/langages';

export interface Lecture {
  id: string;
  titre: string;
  /** La technologie lue. Le banc n'a jamais eu besoin d'être en JavaScript. */
  langage: Langage;
  /** La technique de lecture entraînée. Montrée AVANT tant qu'elle n'est pas acquise. */
  geste: string;
  /** Le code à lire. Les numéros de ligne viennent de l'éditeur, pas du texte. */
  code: string;
  question: string;
  /**
   * Ce qu'on attend, en trois mots, affiché DANS le champ de réponse.
   *
   * Sans lui, on ne sait pas si on doit taper un mot, un nombre ou une phrase —
   * et on perd des tentatives sur le format au lieu d'en perdre sur la lecture.
   */
  format: string;
  /** Toutes les formes acceptées, déjà en minuscules et sans accent. */
  reponses: string[];
  /** Ce qu'il fallait voir, montré après coup. */
  explication: string;
}

export const LECTURES: Lecture[] = [
  {
    id: 'garde',
    titre: 'La garde qui décide',
    langage: 'js',
    geste: 'Lis les gardes avant le corps : un `continue` décide plus que les lignes qui le suivent',
    code: `function fusionner(base, ajouts) {
  const sortie = { ...base };
  for (const cle of Object.keys(ajouts)) {
    if (ajouts[cle] === undefined) continue;
    sortie[cle] = ajouts[cle];
  }
  return sortie;
}

const r = fusionner({ x: 1, y: 2 }, { y: undefined, z: 3 });`,
    question: 'Que vaut `r.y` ?',
    format: 'un nombre',
    reponses: ['2'],
    explication:
      '`y` vaut `undefined` dans les ajouts, donc le `continue` saute l’affectation : la valeur de `base` survit.',
  },
  {
    id: 'borne',
    titre: 'La borne de trop',
    langage: 'js',
    geste: 'Les bornes de boucle en premier : `<=` sur une longueur est presque toujours faux',
    code: `function moyenne(valeurs) {
  let total = 0;
  for (let i = 0; i <= valeurs.length; i++) {
    total += valeurs[i];
  }
  return total / valeurs.length;
}`,
    question: 'Quelle ligne contient le bug ?',
    format: 'un numéro de ligne',
    reponses: ['3', 'ligne 3', 'l3'],
    explication:
      '`i <= valeurs.length` lit un cran trop loin : `valeurs[length]` vaut `undefined`, et le total devient `NaN`.',
  },
  {
    id: 'reference',
    titre: 'Le const qui ne protège rien',
    langage: 'js',
    geste: 'Suis la référence, pas le nom : `const` fige la liaison, jamais le contenu',
    code: `const defauts = { tentatives: 3, delai: 1000 };

export function config(options) {
  const c = defauts;
  Object.assign(c, options);
  return c;
}

config({ tentatives: 5 });`,
    question: 'Après cet appel, que vaut `defauts.tentatives` ?',
    format: 'un nombre',
    reponses: ['5'],
    explication:
      '`c` n’est pas une copie : c’est le même objet. `Object.assign` écrit donc dans `defauts`, qui est corrompu pour tout le reste du programme.',
  },
  {
    id: 'fermeture',
    titre: 'Trois fermetures, une variable',
    langage: 'js',
    geste: '`var` n’a pas de portée de bloc : toutes les fermetures d’une boucle partagent la même variable',
    code: `const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push(() => i);
}

const r = fns[0]();`,
    question: 'Que vaut `r` ?',
    format: 'un nombre',
    reponses: ['3'],
    explication:
      'Avec `var`, il n’existe qu’un seul `i`, qui vaut 3 à la sortie de la boucle. Avec `let`, chaque tour aurait le sien et la réponse serait 0.',
  },
  {
    id: 'sequence',
    titre: 'La boucle qui attend',
    langage: 'js',
    geste: 'Un `await` dans une boucle est toujours séquentiel — le défaut de performance le plus courant',
    code: `async function chargerTout(ids) {
  const sortie = [];
  for (const id of ids) {
    sortie.push(await lire(id));
  }
  return sortie;
}`,
    question: 'Les appels à `lire` partent-ils en parallèle ou en séquence ?',
    format: 'parallèle ou séquence',
    reponses: ['sequence', 'en sequence', 'sequentiel', 'sequentiels', 'serie', 'en serie'],
    explication:
      'Chaque tour attend le précédent. Pour paralléliser : `await Promise.all(ids.map(lire))` — souvent dix fois plus rapide.',
  },
  {
    id: 'retours',
    titre: 'La carte des sorties',
    langage: 'js',
    geste: 'Lis les `return` avant le corps : ils donnent la carte de la fonction en dix secondes',
    code: `export function valider(champ) {
  if (typeof champ !== 'string') return 'type';
  const propre = champ.trim();
  if (!propre) return 'vide';
  if (propre.length > 64) return 'long';
  if (!/^[\\w.-]+@[\\w.-]+$/.test(propre)) return 'format';
  return null;
}`,
    question: "Que retourne `valider('   ')` ?",
    format: 'la valeur retournée',
    reponses: ['vide'],
    explication:
      'Trois espaces sont bien une chaîne, donc on passe la première garde. `trim()` les efface, et la chaîne vide est fausse : `return \'vide\'`.',
  },
  {
    id: 'recursion',
    titre: 'Compter sans dérouler',
    langage: 'js',
    geste: 'Déroule la récursion sur un seul chemin, puis compte les frères — jamais l’arbre entier',
    code: `function parcourir(noeud, profondeur = 0) {
  if (profondeur > 1) return;
  visiter(noeud.nom);
  for (const enfant of noeud.enfants ?? []) {
    parcourir(enfant, profondeur + 1);
  }
}

const arbre = {
  nom: 'a',
  enfants: [
    { nom: 'b', enfants: [{ nom: 'd' }] },
    { nom: 'c' },
  ],
};

parcourir(arbre);`,
    question: 'Combien de fois `visiter` est-il appelé ?',
    format: 'un nombre',
    reponses: ['3'],
    explication:
      '`a` à la profondeur 0, `b` et `c` à la profondeur 1. `d` serait à la profondeur 2 : la garde l’arrête avant `visiter`.',
  },
  {
    id: 'effet-de-bord',
    titre: 'Où l’argument est écrit',
    langage: 'js',
    geste: 'Cherche les affectations sur un paramètre : c’est là que les effets de bord se cachent',
    code: `export function appliquer(panier, remises) {
  const lignes = panier.lignes.map((l) => ({ ...l }));
  let total = 0;
  for (const ligne of lignes) {
    const r = remises[ligne.ref];
    if (r) ligne.prix *= 1 - r;
    total += ligne.prix * ligne.quantite;
  }
  panier.total = total;
  return lignes;
}`,
    question: 'Quelle ligne modifie l’objet `panier` reçu en paramètre ?',
    format: 'un numéro de ligne',
    reponses: ['9', 'ligne 9', 'l9'],
    explication:
      'La ligne 2 copie les lignes, donc `ligne.prix *= ...` n’atteint pas l’appelant. Seule `panier.total = total` écrit dans l’objet reçu.',
  },

  // --- Les technologies du métier -------------------------------------------
  // Le banc n'a jamais eu besoin d'être en JavaScript : un Dockerfile ou une
  // requête SQL se lisent de la même façon. Étendre la couverture ne demandait
  // pas un nouveau banc, seulement du matériau.
  {
    id: 'sql-left-join',
    titre: 'Le LEFT JOIN annulé',
    langage: 'sql',
    geste: 'Un filtre sur la table jointe, placé dans le WHERE, annule le LEFT JOIN — il doit aller dans le ON',
    code: `SELECT c.nom, COUNT(co.id) AS commandes
FROM clients c
LEFT JOIN commandes co ON co.client_id = c.id
WHERE co.total > 100
GROUP BY c.nom;`,
    question: 'Les clients sans aucune commande apparaissent-ils dans le résultat ?',
    format: 'oui ou non',
    reponses: ['non'],
    explication:
      'Le LEFT JOIN produit bien des lignes avec `co.total` à NULL, mais `NULL > 100` est faux : le WHERE les élimine. La requête est devenue un INNER JOIN sans le dire.',
  },
  {
    id: 'bash-non-protege',
    titre: 'La variable nue',
    langage: 'shell',
    geste: 'Une variable sans guillemets se découpe et peut disparaître : toujours `"$var"`',
    code: `#!/usr/bin/env bash
dossier=$1
rm -rf $dossier/cache`,
    question: 'Si le script est appelé sans argument, quel chemin est effacé ?',
    format: 'un chemin',
    reponses: ['/cache'],
    explication:
      '`$1` est vide, donc `$dossier/cache` devient `/cache` — à la racine. Avec `"${dossier:?}"`, le script s’arrête au lieu de détruire.',
  },
  {
    id: 'docker-cache',
    titre: 'Le cache jeté',
    langage: 'docker',
    geste: 'L’ordre des instructions est l’ordre du cache : ce qui change souvent vient en dernier',
    code: `FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm ci
CMD ["node", "serveur.js"]`,
    question: 'Quelle ligne fait rejouer `npm ci` à chaque modification du code ?',
    format: 'un numéro de ligne',
    reponses: ['3', 'ligne 3', 'l3'],
    explication:
      'Copier tout le projet avant `npm ci` invalide la couche à la moindre modification. On copie d’abord `package*.json`, on installe, puis on copie le reste.',
  },
  {
    id: 'ci-declencheur',
    titre: 'Le workflow qui dort',
    langage: 'yaml',
    geste: 'Lis le `on:` avant les `jobs:` : il décide si tout le reste tournera un jour',
    code: `name: tests
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm test`,
    question: 'Ce workflow se déclenche-t-il sur une pull request vers main ?',
    format: 'oui ou non',
    reponses: ['non'],
    explication:
      'Seul `push` est déclaré. Une PR depuis une branche ne pousse pas sur `main` : les tests ne tournent qu’après la fusion, quand il est trop tard. Il faut ajouter `pull_request`.',
  },
  {
    id: 'ts-type-large',
    titre: 'L’union perdue',
    langage: 'ts',
    geste: 'Une annotation large efface l’information : un `string[]` a oublié qu’il contenait une union',
    code: `type Etat = 'ouvert' | 'ferme';

function basculer(e: Etat): Etat {
  return e === 'ouvert' ? 'ferme' : 'ouvert';
}

const etats: string[] = ['ouvert', 'ferme'];
basculer(etats[0]);`,
    question: 'La dernière ligne compile-t-elle ?',
    format: 'oui ou non',
    reponses: ['non'],
    explication:
      '`etats[0]` est un `string`, pas un `Etat` : le compilateur refuse. Sans l’annotation `: string[]`, l’inférence aurait gardé l’union — ou `as const` l’aurait figée.',
  },
  {
    id: 'regex-gourmand',
    titre: 'L’étoile trop gourmande',
    langage: 'js',
    geste: '`.*` prend le plus possible ; `.*?` prend le moins — c’est toute la différence',
    code: `const RE = /<b>(.*)<\\/b>/;
const texte = '<b>un</b> et <b>deux</b>';

texte.match(RE)[1];`,
    question: 'Que vaut le groupe capturé ?',
    format: 'le texte capturé',
    reponses: ['un</b> et <b>deux'],
    explication:
      '`.*` est gourmand : il avance jusqu’au DERNIER `</b>` puis recule le minimum. `/<b>(.*?)<\\/b>/` capturerait `un`.',
  },
  {
    id: 'http-no-cache',
    titre: 'Le no-cache qui cache',
    langage: 'texte',
    geste: 'Lis la directive, pas son nom : `no-cache` autorise le stockage, c’est `no-store` qui l’interdit',
    code: `HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-cache
ETag: "a1b2c3"`,
    question: 'Le navigateur a-t-il le droit de stocker cette réponse ?',
    format: 'oui ou non',
    reponses: ['oui'],
    explication:
      '`no-cache` veut dire « stocke, mais revalide avant de réutiliser » — l’ETag est là pour ça. C’est `no-store` qui interdit de garder quoi que ce soit.',
  },
  {
    id: 'css-specificite',
    titre: 'À spécificité égale',
    langage: 'css',
    geste: 'Compte classes puis éléments ; à spécificité égale, la dernière règle déclarée gagne',
    code: `/* <div class="carte"><p class="important">texte</p></div> */

.carte p {
  color: red;
}

p.important {
  color: blue;
}`,
    question: 'De quelle couleur est le paragraphe ?',
    format: 'une couleur',
    reponses: ['blue', 'bleu'],
    explication:
      'Les deux sélecteurs pèsent pareil : une classe et un élément, soit (0,1,1). L’égalité se tranche par l’ordre du fichier, et `p.important` vient après.',
  },
];
