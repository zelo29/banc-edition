/**
 * Les touches du depot font-elles ce qu'elles annoncent ?
 *
 * Ce harnais protege surtout des COLLISIONS. Le banc tourne dans un onglet,
 * l'editeur a ses propres liaisons, et l'application en a trois : chaque touche
 * ajoutee ici peut en voler une ailleurs sans que rien ne le signale. Les
 * assertions negatives — « ceci ne declenche RIEN » — sont donc la moitie
 * interessante du fichier.
 */
import { actionDepot, suivant } from '../src/banc/depot-clavier.ts';

let ok = 0, ko = 0;
const v = (nom, attendu, obtenu) => {
  const bon = JSON.stringify(attendu) === JSON.stringify(obtenu);
  bon ? ok++ : ko++;
  console.log(`  ${bon ? 'OK  ' : 'ECHEC'} ${nom}`);
  if (!bon) console.log(`        attendu ${JSON.stringify(attendu)}\n        obtenu  ${JSON.stringify(obtenu)}`);
};
const a = (t, nombre = 5, dansRecherche = false) => actionDepot(t, nombre, dansRecherche);

// --- ouvrir un fichier par son rang -----------------------------------------
v('Alt+1 ouvre le premier fichier', { quoi: 'ouvrir', index: 0 }, a({ key: '1', altKey: true }));
v('Alt+5 ouvre le cinquieme', { quoi: 'ouvrir', index: 4 }, a({ key: '5', altKey: true }));
// Hors plage : rien. Ouvrir « le plus proche » apprendrait un decompte faux —
// on croirait avoir vise le septieme.
v('Alt+7 sur trois fichiers ne fait rien', null, a({ key: '7', altKey: true }, 3));
v('Alt+9 sur neuf fichiers ouvre le dernier', { quoi: 'ouvrir', index: 8 }, a({ key: '9', altKey: true }, 9));
v('Alt+0 n’est pas une touche du depot', null, a({ key: '0', altKey: true }));
v('un chiffre seul est une frappe, pas un raccourci', null, a({ key: '3' }));

// --- se deplacer ------------------------------------------------------------
v('Alt+Bas passe au suivant', { quoi: 'deplacer', pas: 1 }, a({ key: 'ArrowDown', altKey: true }));
v('Alt+Haut passe au precedent', { quoi: 'deplacer', pas: -1 }, a({ key: 'ArrowUp', altKey: true }));
v('les fleches seules ne bougent pas de fichier', null, a({ key: 'ArrowDown' }));
v('le deplacement boucle vers l’avant', 0, suivant(4, 1, 5));
v('et vers l’arriere', 4, suivant(0, -1, 5));
v('un arbre vide ne casse rien', 0, suivant(0, 1, 0));

// --- chercher, puis revenir ecrire ------------------------------------------
v('Ctrl+P ouvre la recherche', { quoi: 'chercher' }, a({ key: 'p', ctrlKey: true }));
v('Cmd+P aussi, pour le meme geste sur Mac', { quoi: 'chercher' }, a({ key: 'p', metaKey: true }));
v('P majuscule passe aussi', { quoi: 'chercher' }, a({ key: 'P', ctrlKey: true }));
// Echap ne veut pas dire la meme chose partout : dans la recherche il ramene au
// champ de reponse, ailleurs il appartient a l'application qui recommence.
v('Echap dans la recherche rend la main au champ de reponse',
  { quoi: 'repondre' }, a({ key: 'Escape' }, 5, true));
v('Echap ailleurs reste a l’application', null, a({ key: 'Escape' }, 5, false));

// --- les collisions ---------------------------------------------------------
// Ctrl+Entree recommence l'epreuve, Entree passe a la suivante, Espace retient
// l'enchainement : le depot ne doit toucher a aucune des trois.
v('Ctrl+Entree reste a l’application', null, a({ key: 'Enter', ctrlKey: true }));
v('Entree reste a l’application', null, a({ key: 'Enter' }));
v('Espace reste a l’application', null, a({ key: ' ' }));
// Ctrl+Maj+P est la palette de commandes d'un vrai editeur : on ne la detourne
// pas pour ouvrir un fichier, sinon on enseigne le mauvais geste.
v('Ctrl+Maj+P n’est pas la recherche de fichier', null,
  a({ key: 'p', ctrlKey: true, shiftKey: true }));
v('Alt+Ctrl+1 n’est pas un raccourci du depot', null,
  a({ key: '1', altKey: true, ctrlKey: true }));
// Ctrl+D, Ctrl+J, Ctrl+H sont des gestes de kata : le depot n'y touche pas.
v('Ctrl+D reste un geste de kata', null, a({ key: 'd', ctrlKey: true }));
v('Ctrl+J reste un geste de kata', null, a({ key: 'j', ctrlKey: true }));

console.log(`\n  ${ok} verifications passees, ${ko} echec(s)`);
process.exit(ko ? 1 : 0);
