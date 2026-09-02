/**
 * Les bugs annonces existent-ils vraiment ?
 *
 * Un banc de debogage dont le symptome est faux enseigne l'erreur, et il est
 * bien plus facile d'ecrire un bug plausible qu'un bug reel. Chaque extrait est
 * donc execute, et le symptome verifie.
 */
import vm from 'node:vm';
import { DEBOGAGES } from '../src/debogages/index.ts';
import { reponseJuste } from '../src/banc/epreuves.ts';

let ok = 0, ko = 0;
const v = (nom, attendu, obtenu) => {
  const bon = JSON.stringify(attendu) === JSON.stringify(obtenu);
  bon ? ok++ : ko++;
  console.log(`  ${bon ? 'OK  ' : 'ECHEC'} ${nom}`);
  if (!bon) console.log(`        attendu ${JSON.stringify(attendu)}\n        obtenu  ${JSON.stringify(obtenu)}`);
};

const deb = (id) => DEBOGAGES.find((d) => d.id === id);
const executer = (id, expression, contexte = {}) => {
  const code = deb(id).code.replace(/^export /gm, '');
  return vm.runInNewContext(`${code}\n;(${expression})`, contexte);
};
/**
 * Meme chose, mais sur la version reparee.
 *
 * `structuredClone` est fourni au contexte : il existe dans tout navigateur et
 * dans Node, mais pas dans un contexte vm neuf. C'est une limite du harnais, pas
 * de la correction -- et la corriger ici vaut mieux que de deformer l'exercice
 * pour arranger le test.
 */
const reparer = (id, expression, contexte = {}) => {
  const code = deb(id).correction.replace(/^export /gm, '');
  return vm.runInNewContext(`${code}\n;(${expression})`, { structuredClone, ...contexte });
};
const ligne = (id, n) => deb(id).code.split('\n')[n - 1];
/** Le numero de ligne que l'epreuve donne pour bonne reponse. */
const reponse = (id) => Number(deb(id).reponses[0]);

// --- chaque bug se produit-il pour de vrai ? --------------------------------
{
  let leve = '';
  try { executer('reduce-vide', 'moyenne([])'); } catch (e) { leve = e.message; }
  v('« La liste vide » : reduce sur [] lève bien', true, /empty array/i.test(leve));
}
v('« La comparaison qui ment » : trouve un objet là où on attend null',
  true, executer('egalite-lache', "trouver([{ id: '01' }], 1)") !== null);
{
  const r = executer('sort-en-place', '(() => { const o = [3,1,2]; trier(o); return o; })()');
  v('« Le tri qui salit » : l’argument est bien modifié', [1, 2, 3], r);
}
v('« Le cas de la borne » : une chaîne de longueur max est coupée à tort',
  'ab...', executer('borne-exacte', "tronquer('abcde', 5)"));
{
  const r = executer('falsy', '(() => { let n = 0; const f = () => { n++; return 0; }; memoriser("k", f); memoriser("k", f); return n; })()');
  v('« Le zéro qui disparaît » : le calcul est bien refait', 2, r);
}
{
  const r = executer('spread-superficiel', '(() => { options().limites.max = 99; return DEFAUT.limites.max; })()');
  v('« La copie qui n’en est pas une » : DEFAUT est bien corrompu', 99, r);
}
v('« La garde arrivée trop tard » : decrire(null) rend bien objet',
  'objet', executer('ordre-des-gardes', 'decrire(null)'));
// Celui-la ne se prouve pas par execution : on verifie la structure.
v('« La promesse que personne n’attend » : la fonction est async et l’appel sans await',
  true, /async function/.test(deb('await-oublie').code) && !/await/.test(ligne('await-oublie', 4)));

// --- la correction fait-elle disparaitre le bug ? --------------------------
// C'est l'autre moitie du contrat : une reparation qui ne repare pas enseigne
// un faux geste, et l'utilisateur la recopie sans que rien ne proteste.
{
  let leve = '';
  try { reparer('reduce-vide', 'moyenne([])'); } catch (e) { leve = e.message; }
  v('reparation « La liste vide » : ne leve plus', '', leve);
}
v('reparation « La comparaison qui ment » : rend null',
  null, reparer('egalite-lache', "trouver([{ id: '01' }], 1)"));
v('reparation « Le tri qui salit » : l’argument est intact',
  [3, 1, 2], reparer('sort-en-place', '(() => { const o = [3,1,2]; trier(o); return o; })()'));
v('reparation « Le cas de la borne » : la chaine passe entiere',
  'abcde', reparer('borne-exacte', "tronquer('abcde', 5)"));
v('reparation « Le zero qui disparait » : le calcul n’est fait qu’une fois', 1,
  reparer('falsy', '(() => { let n = 0; const f = () => { n++; return 0; }; memoriser("k", f); memoriser("k", f); return n; })()'));
v('reparation « La copie qui n’en est pas une » : DEFAUT est protege', 10,
  reparer('spread-superficiel', '(() => { options().limites.max = 99; return DEFAUT.limites.max; })()'));
v('reparation « La garde arrivee trop tard » : rend nul',
  'nul', reparer('ordre-des-gardes', 'decrire(null)'));
v('reparation « La promesse que personne n’attend » : l’appel est attendu', true,
  /await ecrire\(/.test(deb('await-oublie').correction));

// Une reparation est une REPARATION, pas une reecriture. On compte les LIGNES
// qui changent, pas les caracteres : echanger deux lignes coute 54 caracteres
// de distance d'edition alors que le geste est un seul Alt+bas. La distance en
// caracteres reste juste pour le score -- elle est simplement le mauvais outil
// pour dire « est-ce encore une correction ».
const lignesChangees = (a, b) => {
  const la = a.split('\n'), lb = b.split('\n');
  let n = Math.abs(la.length - lb.length);
  for (let i = 0; i < Math.min(la.length, lb.length); i++) if (la[i] !== lb[i]) n++;
  return n;
};
for (const d of DEBOGAGES) {
  const n = lignesChangees(d.code, d.correction);
  v(`« ${d.titre} » : réparation localisée (${n} ligne${n > 1 ? 's' : ''})`, true, n > 0 && n <= 3);
}

// --- la ligne designee est-elle la bonne ? ---------------------------------
const motif = {
  'reduce-vide': /reduce\(/,
  'egalite-lache': /[^=!]==[^=]/,
  'sort-en-place': /\.sort\(/,
  'await-oublie': /ecrire\(/,
  'borne-exacte': /length < max/,
  falsy: /if \(cache\[cle\]\)/,
  'spread-superficiel': /\.\.\.DEFAUT/,
  'ordre-des-gardes': /typeof valeur === 'object'/,
};
for (const d of DEBOGAGES) {
  v(`« ${d.titre} » : la ligne ${reponse(d.id)} porte bien la cause`,
    true, motif[d.id].test(ligne(d.id, reponse(d.id))));
}

// --- l'hygiene du contenu ---------------------------------------------------
v('8 débogages', 8, DEBOGAGES.length);
v('aucun id en double', DEBOGAGES.length, new Set(DEBOGAGES.map((d) => d.id)).size);
v('chaque débogage a un symptôme concret', true,
  DEBOGAGES.every((d) => d.symptome.length > 25 && d.explication.length > 40));
v('« ligne 4 » est accepté pour 4', true, reponseJuste('ligne 4', deb('falsy').reponses));
v('une mauvaise ligne est refusée', false, reponseJuste('5', deb('falsy').reponses));

// Sans format annonce, on perd des tentatives a deviner ce qu'il faut taper.
v('chaque epreuve annonce le format attendu', true,
  DEBOGAGES.every((e) => typeof e.format === 'string' && e.format.length > 5));

console.log(`\n  ${ok} verifications passees, ${ko} echec(s)`);
process.exit(ko ? 1 : 0);
