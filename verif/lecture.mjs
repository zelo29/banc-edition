/**
 * Les reponses annoncees sont-elles VRAIES ?
 *
 * Un banc de lecture qui corrige faux est pire qu'inutile : il enseigne
 * l'erreur. Chaque extrait executable est donc reellement execute, et sa
 * reponse comparee a celle du fichier. Les questions qui portent sur un numero
 * de ligne sont verifiees sur le contenu de la ligne.
 *
 * Le SQL s'execute aussi, depuis que `node:sqlite` est dans Node : chaque
 * lecture SQL porte son propre jeu de donnees, le harnais monte la base en
 * memoire et joue la requete. C'est ce qui autorise le banc a toucher au
 * domaine data -- une requete dont le resultat est AFFIRME plutot que calcule
 * n'aurait pas passe le filtre du projet. L'injection SQL, elle, est vraiment
 * jouee : c'est la base qui rend trois jetons, pas le fichier qui le pretend.
 */
import vm from 'node:vm';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
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

/**
 * Monte la base en memoire et joue la DERNIERE instruction de l'extrait.
 *
 * Tout ce qui precede est le jeu de donnees, et il est dans l'extrait plutot
 * que dans ce fichier : une question comme « combien de lignes ? » n'a de
 * reponse que si le lecteur voit les donnees. L'extrait est donc un script
 * complet, ce qui le rend lisible ET verifiable par la meme occasion.
 */
const executerSql = (id, autre) => {
  const parties = lec(id).code.split(';').map((p) => p.trim()).filter(Boolean);
  const requete = parties.pop();
  const db = new DatabaseSync(':memory:');
  for (const p of parties) db.exec(p);
  return db.prepare(autre ?? requete).all();
};
/** La reponse annoncee est-elle celle que la base rend ? */
const vSql = (nom, id, valeur) =>
  v(nom, true, reponseJuste(String(valeur(executerSql(id))), lec(id).reponses));

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

// --- data : chaque requete est jouee sur une vraie base ----------------------
vSql('« Le NOT IN qui ne rend rien » : la base rend bien zéro ligne',
  'sql-not-in-null', (r) => r.length);
vSql('« Le chiffre d’affaires triplé » : la somme gonflée est bien celle annoncée',
  'sql-jointure-qui-double', (r) => r[0].chiffre);
vSql('« La moyenne et l’effectif » : AVG rend bien la moyenne annoncée',
  'sql-moyenne-null', (r) => r[0].moyenne);
vSql('« Le classement sans deuxième » : Linus porte bien le rang annoncé',
  'sql-rang-avec-trous', (r) => r.find((l) => l.nom === 'Linus').rang);
// Le vrai defaut est ailleurs : la meme requete annonce un effectif de 4 a cote
// d'une moyenne calculee sur 2. Sans ca, l'explication serait une opinion.
v('« La moyenne et l’effectif » : l’effectif annoncé à côté est bien 4',
  4, executerSql('sql-moyenne-null')[0].repondants);
// Le LEFT JOIN annule : on prouve l'absence, puisque c'est elle qu'on affirme.
{
  const noms = executerSql('sql-left-join').map((l) => l.nom);
  v('« Le LEFT JOIN annulé » : la cliente sans commande est bien absente',
    [true, false], [noms.includes('Ada'), noms.includes('Grace')]);
}
// L'argent en flottant : c'est l'arithmetique de la machine qui repond.
v('« Le centime introuvable » : la comparaison est bien fausse',
  true, reponseJuste(String(executer('flottant-argent', 'total === 25')),
                     lec('flottant-argent').reponses));

// --- securite : l'attaque est jouee, pas racontee ---------------------------
// L'injection est reellement executee sur la base : trois jetons sortent parce
// que la table entiere sort, pas parce que le fichier l'affirme.
vSql('« La frontière effacée » : l’injection rend bien tous les jetons',
  'injection-sql', (r) => r.length);
// Et « tous » veut dire quelque chose : on recompte la table SANS l'injection,
// sur le meme jeu de donnees. Rejouer la requete injectee pour la verifier
// n'aurait rien prouve du tout.
v('« La frontière effacée » : et « tous » veut bien dire la table entière',
  executerSql('injection-sql', 'SELECT jeton FROM comptes').length,
  executerSql('injection-sql').length);
// La traversee de chemin se calcule : c'est `path.join` qui repond.
v('« La racine qui ne retient rien » : join sort bien de la racine',
  true, reponseJuste(executer('traversee-chemin', 'cheminDe("../../../etc/passwd")',
                              { require: createRequire(import.meta.url) }),
                     lec('traversee-chemin').reponses));
// La pollution de prototype se constate : le contexte `vm` a son propre realm,
// donc on peut la jouer sans salir celui du harnais.
v('« La clé qui n’en est pas une » : un objet neuf hérite bien de admin',
  true, reponseJuste(String(executer('pollution-prototype', 'utilisateur.admin')),
                     lec('pollution-prototype').reponses));
v('« La clé qui n’en est pas une » : le realm du harnais est resté propre',
  undefined, ({}).admin);
// La ligne fautive est-elle bien la seule ? Sinon la question a deux reponses.
{
  const lignes = lec('xss-innerhtml').code.split('\n');
  v('« La ligne qui annule la précédente » : la ligne 5 est bien celle du innerHTML',
    true, lignes[4].includes('innerHTML'));
  v('« La ligne qui annule la précédente » : une seule ligne écrit du HTML', 1,
    lignes.filter((l) => l.includes('innerHTML')).length);
}
// Le secret Docker : on verifie au moins que le `rm` vient APRES l'ecriture,
// puisque c'est tout l'argument de l'explication.
{
  const lignes = lec('secret-dans-la-couche').code.split('\n');
  const ecrit = lignes.findIndex((l) => l.includes('.npmrc') && l.includes('>'));
  const efface = lignes.findIndex((l) => l.includes('rm .npmrc'));
  v('« Le secret effacé trop tard » : l’effacement est bien dans une couche postérieure',
    true, ecrit !== -1 && efface > ecrit);
}

// Le reste -- Dockerfile, CI, types, HTTP -- ne s'execute pas ici. On le dit
// plutot que de faire croire a une verification.
const NON_EXECUTES = ['docker-cache', 'ci-declencheur', 'ts-type-large', 'http-no-cache'];
v('les épreuves non exécutables sont recensées', true,
  NON_EXECUTES.every((id) => lec(id) !== undefined));
// Le SQL en faisait partie : il n'en fait plus.
v('plus aucune lecture SQL n’échappe à l’exécution', true,
  LECTURES.filter((l) => l.langage === 'sql').every((l) => !NON_EXECUTES.includes(l.id)));

// --- l'hygiene du contenu ---------------------------------------------------
v('26 lectures', 26, LECTURES.length);
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
