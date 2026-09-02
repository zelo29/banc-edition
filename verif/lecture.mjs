/**
 * Les reponses annoncees sont-elles VRAIES ?
 *
 * Un banc de lecture qui corrige faux est pire qu'inutile : il enseigne
 * l'erreur. Chaque extrait executable est donc reellement execute, et sa
 * reponse comparee a celle du fichier. Les questions qui portent sur un numero
 * de ligne sont verifiees sur le contenu de la ligne.
 */
import vm from 'node:vm';
import { execSync } from 'node:child_process';
import { LECTURES } from '../src/lectures/index.ts';
import { reponseJuste } from '../src/banc/epreuves.ts';

let ok = 0, ko = 0;
const v = (nom, attendu, obtenu) => {
  const bon = JSON.stringify(attendu) === JSON.stringify(obtenu);
  bon ? ok++ : ko++;
  console.log(`  ${bon ? 'OK  ' : 'ECHEC'} ${nom}`);
  if (!bon) console.log(`        attendu ${JSON.stringify(attendu)}\n        obtenu  ${JSON.stringify(obtenu)}`);
};

const lec = (id) => LECTURES.find((l) => l.id === id);
/** Execute l'extrait et rend la valeur de l'expression demandee. */
const executer = (id, expression, contexte = {}) => {
  const code = lec(id).code.replace(/^export /gm, '');
  return vm.runInNewContext(`${code}\n;(${expression})`, contexte);
};
const ligne = (id, n) => lec(id).code.split('\n')[n - 1];

// --- les reponses sont-elles justes ? ---------------------------------------
v('« La garde qui décide » : r.y vaut bien 2', 2, executer('garde', 'r.y'));
v('« Le const qui ne protège rien » : defauts.tentatives vaut bien 5',
  5, executer('reference', 'defauts.tentatives'));
v('« Trois fermetures » : r vaut bien 3', 3, executer('fermeture', 'r'));
v('« La carte des sorties » : valider("   ") rend bien "vide"',
  'vide', executer('retours', "valider('   ')"));
{
  let n = 0;
  executer('recursion', 'n', { visiter: () => { n++; }, get n() { return n; } });
  v('« Compter sans dérouler » : visiter appelé bien 3 fois', 3, n);
}

// --- les questions sur une ligne visent-elles la bonne ? --------------------
v('« La borne de trop » : la ligne 3 contient bien le <=', true, ligne('borne', 3).includes('<='));
v('« Où l’argument est écrit » : la ligne 9 écrit bien dans panier', true,
  /panier\.\w+\s*=/.test(ligne('effet-de-bord', 9)));
// et aucune AUTRE ligne n'ecrit dans panier : sinon la question a deux reponses
v('« Où l’argument est écrit » : une seule ligne écrit dans panier', 1,
  lec('effet-de-bord').code.split('\n').filter((l) => /panier\.\w+\s*=[^=]/.test(l)).length);

// --- le correcteur ----------------------------------------------------------
v('chaque réponse déclarée est acceptée', true,
  LECTURES.every((l) => l.reponses.every((r) => reponseJuste(r, l.reponses))));
v('une réponse vide est refusée', false, reponseJuste('   ', ['3']));
v('la casse et les accents sont ignorés', true, reponseJuste('SÉQUENCE', ['sequence']));
v('les guillemets sont ignorés', true, reponseJuste('"vide"', ['vide']));
v('« ligne 3 » est accepté pour 3', true, reponseJuste('Ligne 3', lec('borne').reponses));
v('une mauvaise réponse est refusée', false, reponseJuste('4', lec('borne').reponses));

// --- les technos : verifier ce qui s'execute, declarer ce qui ne s'execute pas
// Une regex JavaScript s'execute : la reponse annoncee est donc calculee, pas
// affirmee.
{
  const src = lec('regex-gourmand').code;
  const capture = vm.runInNewContext(src.replace(/;\s*$/, ''), {});
  v('« L’étoile trop gourmande » : la capture annoncée est la vraie',
    lec('regex-gourmand').reponses[0], capture);
}
// L'expansion d'une variable shell s'execute aussi -- sans le `rm`, evidemment.
{
  const sortie = execSync('dossier=$1; echo "$dossier/cache"', { shell: '/bin/bash' })
    .toString().trim();
  v('« La variable nue » : bash produit bien le chemin annoncé',
    lec('bash-non-protege').reponses[0], sortie);
}
// La specificite CSS se calcule : (classes, elements) pour chaque selecteur.
{
  const code = lec('css-specificite').code;
  const poids = (sel) => [(sel.match(/\./g) || []).length, (sel.match(/(^|\s)[a-z]+/g) || []).length];
  const [a, b] = [...code.matchAll(/^([^/{\n][^{\n]*)\{/gm)].map((m) => poids(m[1].trim()));
  v('« À spécificité égale » : les deux sélecteurs pèsent bien pareil', a, b);
}
// Le reste — SQL, Dockerfile, CI, types, HTTP — ne s'execute pas ici. On le dit
// plutot que de faire croire a une verification.
const NON_EXECUTES = ['sql-left-join', 'docker-cache', 'ci-declencheur', 'ts-type-large', 'http-no-cache'];
v('les épreuves non exécutables sont recensées', true,
  NON_EXECUTES.every((id) => lec(id) !== undefined));

// --- l'hygiene du contenu ---------------------------------------------------
v('16 lectures', 16, LECTURES.length);
v('au moins six technologies couvertes', true,
  new Set(LECTURES.map((l) => l.langage)).size >= 6);
v('aucun id en double', LECTURES.length, new Set(LECTURES.map((l) => l.id)).size);
v('chaque lecture a une question et une explication', true,
  LECTURES.every((l) => l.question.length > 8 && l.explication.length > 20));
v('aucune réponse vide', true, LECTURES.every((l) => l.reponses.length > 0 && l.reponses.every(Boolean)));
// Les reponses sont deja normalisees dans le fichier : sinon le correcteur
// accepterait des formes que l'auteur croit refuser.
v('les réponses déclarées sont en minuscules sans accent', true,
  LECTURES.every((l) => l.reponses.every((r) => r === r.toLowerCase() && !/[̀-ͯ]/.test(r.normalize('NFD')))));

// Sans format annonce, on perd des tentatives a deviner ce qu'il faut taper.
v('chaque epreuve annonce le format attendu', true,
  LECTURES.every((e) => typeof e.format === 'string' && e.format.length > 5));

console.log('\n  epreuves non verifiables par execution :');
console.log('    ' + NON_EXECUTES.join(', '));

console.log(`\n  ${ok} verifications passees, ${ko} echec(s)`);
process.exit(ko ? 1 : 0);
