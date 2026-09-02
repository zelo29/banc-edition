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
    code: `CREATE TABLE clients (id INTEGER, nom TEXT);
INSERT INTO clients VALUES (1, 'Ada'), (2, 'Grace');

CREATE TABLE commandes (id INTEGER, client_id INTEGER, total REAL);
INSERT INTO commandes VALUES (1, 1, 150);

SELECT c.nom, COUNT(co.id) AS commandes
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

  // --- Sécurité -------------------------------------------------------------
  // Le domaine est déjà très bien servi — PortSwigger, pwn.college, les CTF —
  // mais tous demandent de PRODUIRE l'attaque. Personne ne chronomètre la seule
  // chose qu'on fait vraiment en entreprise : repérer la ligne fautive dans du
  // code ordinaire, en trente secondes, sans savoir qu'on cherche une faille.
  {
    id: 'injection-sql',
    titre: 'La frontière effacée',
    langage: 'sql',
    geste: 'Une requête concaténée n’a plus de frontière entre le code et la donnée',
    code: `-- l'application fait : "SELECT jeton FROM comptes WHERE email = '" + saisie + "'"
-- et la saisie vaut :        ' OR '1'='1

CREATE TABLE comptes (id INTEGER, email TEXT, jeton TEXT);
INSERT INTO comptes VALUES
  (1, 'ada@exemple.fr',   'a1'),
  (2, 'linus@exemple.fr', 'b2'),
  (3, 'admin@exemple.fr', 'c3');

SELECT jeton FROM comptes WHERE email = '' OR '1'='1';`,
    question: 'Combien de jetons la requête rend-elle ?',
    format: 'un nombre',
    reponses: ['3'],
    explication:
      'La saisie referme la chaîne et ajoute une condition toujours vraie : le filtre disparaît et la table entière sort. Un paramètre lié — `WHERE email = ?` — n’aurait jamais été relu comme du SQL, la valeur serait restée une valeur. Ce n’est pas une question d’échappement mais de frontière : la requête doit être écrite avant de connaître la donnée.',
  },
  {
    id: 'traversee-chemin',
    titre: 'La racine qui ne retient rien',
    langage: 'js',
    geste: '`path.join` assemble et normalise — il ne confine pas',
    code: `const path = require('node:path');

const RACINE = '/var/www/televersements';

function cheminDe(nom) {
  return path.join(RACINE, nom);
}

cheminDe('../../../etc/passwd');`,
    question: 'Quel chemin la fonction rend-elle ?',
    format: 'un chemin',
    reponses: ['/etc/passwd'],
    explication:
      '`join` résout les `..` en assemblant : trois remontées suffisent à sortir de la racine, et la fonction rend un chemin hors du dossier qu’elle était censée garder. Confiner demande une vérification explicite après coup — comparer le chemin résolu à la racine — ou de n’accepter qu’un nom sans séparateur.',
  },
  {
    id: 'pollution-prototype',
    titre: 'La clé qui n’en est pas une',
    langage: 'js',
    geste: '`__proto__` vise le prototype : écrire dedans modifie tous les objets, pas seulement le sien',
    code: `function fusionner(cible, source) {
  for (const cle of Object.keys(source)) {
    const valeur = source[cle];
    if (valeur && typeof valeur === 'object') {
      cible[cle] = cible[cle] ?? {};
      fusionner(cible[cle], valeur);
    } else {
      cible[cle] = valeur;
    }
  }
  return cible;
}

fusionner({}, JSON.parse('{"__proto__": {"admin": true}}'));

const utilisateur = {};`,
    question: 'Que vaut `utilisateur.admin` ?',
    format: 'true ou false',
    reponses: ['true', 'vrai'],
    explication:
      '`cible["__proto__"]` ne crée pas une clé : il rend `Object.prototype`. La descente écrit donc `admin: true` sur l’ancêtre commun, et tout objet créé ensuite en hérite — y compris celui qui n’a jamais touché à la fusion. `Object.create(null)` pour la cible, ou le refus des clés `__proto__`, `constructor` et `prototype`, coupe le chemin.',
  },
  {
    id: 'xss-innerhtml',
    titre: 'La ligne qui annule la précédente',
    langage: 'js',
    geste: '`textContent` écrit du texte, `innerHTML` écrit du HTML — une seule ligne suffit à tout défaire',
    code: `function afficherCommentaire(zone, commentaire) {
  const bloc = document.createElement('div');
  bloc.className = 'commentaire';
  bloc.textContent = commentaire.auteur;
  bloc.innerHTML += ' : ' + commentaire.texte;
  zone.appendChild(bloc);
}`,
    question: 'Quelle ligne permet à un commentaire d’exécuter du script ?',
    format: 'un numéro de ligne',
    reponses: ['5', 'ligne 5', 'l5'],
    explication:
      'La ligne 4 échappe correctement l’auteur ; la ligne 5 relit tout le bloc comme du HTML et y colle le texte brut. Le `+=` est le pire des deux : il reconstruit aussi ce qui était déjà sûr. Le défaut est banal — on ajoute un séparateur, on prend `innerHTML` parce que `textContent` ne s’ajoute pas bien — et il ne se voit qu’en lisant les deux lignes ensemble.',
  },
  {
    id: 'secret-dans-la-couche',
    titre: 'Le secret effacé trop tard',
    langage: 'docker',
    geste: 'Chaque `RUN` fige une couche : effacer un fichier ajoute une couche, ça n’en retire aucune',
    code: `FROM node:22-alpine
WORKDIR /app
ARG NPM_TOKEN
RUN echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > .npmrc
RUN npm ci
RUN rm .npmrc
COPY . .`,
    question: 'Le jeton est-il récupérable dans l’image publiée ?',
    format: 'oui ou non',
    reponses: ['oui'],
    explication:
      'La ligne 6 crée une couche où `.npmrc` est absent — elle n’efface pas celle de la ligne 4, où il est présent. Les deux voyagent dans l’image, et `docker history` puis l’extraction de la couche rendent le jeton en clair. Le seul remède est de ne jamais l’écrire dans une couche : `RUN --mount=type=secret`, ou une étape de construction séparée dont on ne copie que le résultat.',
  },

  // --- Data -----------------------------------------------------------------
  // Écrire du SQL est servi partout — DataLemur, StrataScratch, LeetCode. Le
  // relire ne l'est nulle part, et c'est pourtant ce qu'on fait devant un
  // tableau de bord qui affiche un chiffre faux depuis trois mois. Le harnais
  // exécute chacune de ces requêtes : la réponse annoncée est calculée.
  {
    id: 'sql-not-in-null',
    titre: 'Le NOT IN qui ne rend rien',
    langage: 'sql',
    geste: 'Un seul NULL dans un `NOT IN` vide le résultat entier',
    code: `CREATE TABLE clients (id INTEGER, nom TEXT);
INSERT INTO clients VALUES (1, 'Ada'), (2, 'Grace'), (3, 'Linus');

CREATE TABLE commandes (id INTEGER, client_id INTEGER);
INSERT INTO commandes VALUES (1, 1), (2, NULL);

SELECT nom FROM clients
WHERE id NOT IN (SELECT client_id FROM commandes);`,
    question: 'Combien de lignes la requête rend-elle ?',
    format: 'un nombre',
    reponses: ['0', 'aucune', 'zero'],
    explication:
      '`id NOT IN (1, NULL)` se développe en `id <> 1 AND id <> NULL`, et `id <> NULL` ne vaut pas faux : il vaut INCONNU. Aucune ligne ne peut donc être vraie, pas même Grace et Linus qui n’ont rien commandé. C’est le piège le plus coûteux du SQL parce qu’il ne lève rien : la requête réussit, elle rend zéro ligne, et on cherche l’erreur dans les données. `NOT EXISTS` n’a pas ce comportement.',
  },
  {
    id: 'sql-jointure-qui-double',
    titre: 'Le chiffre d’affaires triplé',
    langage: 'sql',
    geste: 'Joindre vers le « plusieurs » duplique le « un » : agréger après, c’est compter plusieurs fois',
    code: `CREATE TABLE commandes (id INTEGER, total REAL);
INSERT INTO commandes VALUES (1, 100), (2, 50);

CREATE TABLE lignes (commande_id INTEGER, article TEXT);
INSERT INTO lignes VALUES
  (1, 'clavier'), (1, 'souris'), (1, 'ecran'), (2, 'cable');

SELECT SUM(c.total) AS chiffre
FROM commandes c
JOIN lignes l ON l.commande_id = c.id;`,
    question: 'Que vaut `chiffre` ?',
    format: 'un nombre',
    reponses: ['350'],
    explication:
      'La jointure rend quatre lignes, dont trois portent le total 100 : la somme compte la commande n°1 trois fois. Le vrai chiffre est 150. Le défaut ne se voit jamais sur le résultat — c’est un nombre plausible — et il grandit avec le panier moyen. On agrège avant de joindre, dans une sous-requête, ou on ne somme jamais une mesure du côté « un » après une jointure vers le côté « plusieurs ».',
  },
  {
    id: 'sql-moyenne-null',
    titre: 'La moyenne et l’effectif',
    langage: 'sql',
    geste: 'Les agrégats ignorent les NULL : le dénominateur d’`AVG` n’est pas `COUNT(*)`',
    code: `CREATE TABLE reponses (id INTEGER, note INTEGER);
INSERT INTO reponses VALUES (1, 10), (2, NULL), (3, 20), (4, NULL);

SELECT AVG(note) AS moyenne, COUNT(*) AS repondants
FROM reponses;`,
    question: 'Que vaut `moyenne` ?',
    format: 'un nombre',
    reponses: ['15'],
    explication:
      '`AVG` divise par le nombre de valeurs non nulles : 30 / 2, et non 30 / 4. La même requête annonce pourtant 4 répondants juste à côté. Le tableau de bord affiche donc une moyenne calculée sur deux personnes sous un effectif de quatre, et rien ne signale l’incohérence. `AVG(COALESCE(note, 0))` rendrait 7,5 — encore faut-il décider si un silence est un zéro.',
  },
  {
    id: 'sql-rang-avec-trous',
    titre: 'Le classement sans deuxième',
    langage: 'sql',
    geste: '`RANK` laisse un trou après une égalité, `DENSE_RANK` non',
    code: `CREATE TABLE scores (nom TEXT, points INTEGER);
INSERT INTO scores VALUES ('Ada', 90), ('Grace', 90), ('Linus', 80);

SELECT nom, RANK() OVER (ORDER BY points DESC) AS rang
FROM scores;`,
    question: 'Quel rang porte Linus ?',
    format: 'un nombre',
    reponses: ['3'],
    explication:
      'Ada et Grace sont premières ex æquo, et `RANK` saute la deuxième place : Linus est troisième sur trois. `DENSE_RANK` l’aurait mis deuxième. Aucun des deux n’est faux — mais un classement où personne n’est deuxième finit toujours par remonter comme un bug.',
  },
  {
    id: 'flottant-argent',
    titre: 'Le centime introuvable',
    langage: 'js',
    geste: 'Un prix n’est pas un flottant : on additionne des centimes entiers',
    code: `const panier = [19.99, 4.99, 0.02];
const total = panier.reduce((somme, prix) => somme + prix, 0);

total === 25;`,
    question: 'Que vaut la dernière expression ?',
    format: 'true ou false',
    reponses: ['false', 'faux'],
    explication:
      'Le total vaut 24.999999999999996 : la base binaire ne sait pas écrire 0,01, et l’erreur s’accumule à chaque addition. Le défaut ne se voit pas à l’affichage — `toFixed(2)` rend bien « 25.00 » — il se voit à la comparaison, au seuil de livraison gratuite, et au moment de rapprocher deux totaux calculés dans un ordre différent. En centimes entiers, 1999 + 499 + 2 est exact.',
  },
];
