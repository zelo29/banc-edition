/**
 * Le resume garde-t-il ce que le coach devra lire ?
 *
 * Ce harnais protege un choix, pas un calcul : ce qui n'est pas resume
 * aujourd'hui n'existera jamais, puisqu'on ne peut pas rejouer hier. Chaque
 * assertion correspond donc a une phrase que le coach doit pouvoir prononcer,
 * et elle echouera le jour ou quelqu'un allegera la structure sans savoir ce
 * qu'elle portait.
 */
import { PLAFOND, ajouter, resumer } from '../src/banc/traces.ts';

let ok = 0, ko = 0;
const v = (nom, attendu, obtenu) => {
  const bon = JSON.stringify(attendu) === JSON.stringify(obtenu);
  bon ? ok++ : ko++;
  console.log(`  ${bon ? 'OK  ' : 'ECHEC'} ${nom}`);
  if (!bon) console.log(`        attendu ${JSON.stringify(attendu)}\n        obtenu  ${JSON.stringify(obtenu)}`);
};

/** Des mesures comme le journal les rend, a partir d'une suite d'evenements. */
const mesures = (evenements, duree = 12000) => ({
  enCours: false, duree, frappes: 0, suppressions: 0, souris: 0, collages: 0,
  annulations: 0, editions: evenements.length, caracteres: 0,
  gestes: evenements.map((evenement, t) => ({ t, evenement, inserees: 0, supprimees: 0 })),
});
const KATA = { id: 'k1', banc: 'edition' };

// --- les comptes par evenement ----------------------------------------------
{
  const t = resumer(KATA, mesures([
    'input.type', 'input.type', 'delete.backward', 'select.pointer', 'input.type',
  ]), { minimum: 8, reel: 60 }, 1000);
  v('chaque annotation est comptee', { 'input.type': 3, 'delete.backward': 1, 'select.pointer': 1 },
    t.evenements);
  v('le minimum et le reel viennent du score, pas des mesures', [8, 60], [t.minimum, t.reel]);
  v('l’epreuve et son banc sont conserves', ['k1', 'edition'], [t.id, t.banc]);
  v('la duree aussi', 12000, t.duree);
  v('et l’instant, pour ranger les traces dans le temps', 1000, t.quand);
}
// Une selection au clavier porte `select`, celle a la souris `select.pointer` :
// toute la distinction du banc tient sur ces deux chaines. `verif/journal-reel.mjs`
// verifie que ce sont bien celles que CodeMirror emet.
{
  const t = resumer(KATA, mesures(['select', 'select', 'select.pointer']), { minimum: 1, reel: 1 });
  v('la selection au clavier est comptee a part', 2, t.evenements.select);
  v('et reste distincte de la souris', 1, t.evenements['select.pointer']);
}

// --- la rafale de retours arriere -------------------------------------------
// Le SEUL motif de sequence retenu, parce que c'est le seul qu'aucun total ne
// permet de reconstruire : quarante retours arriere d'affilee et quarante
// repartis dans l'epreuve donnent le meme compteur.
{
  const groupee = resumer(KATA, mesures(
    ['input.type', ...Array(6).fill('delete.backward'), 'input.type']), { minimum: 1, reel: 1 });
  const eparse = resumer(KATA, mesures(
    ['delete.backward', 'input.type', 'delete.backward', 'input.type',
     'delete.backward', 'input.type', 'delete.backward', 'input.type',
     'delete.backward', 'input.type', 'delete.backward']), { minimum: 1, reel: 1 });
  v('six retours arriere d’affilee font une rafale de six', 6, groupee.rafaleArriere);
  v('six retours arriere epars n’en font qu’une de un', 1, eparse.rafaleArriere);
  v('et pourtant le compteur brut est le meme', groupee.evenements['delete.backward'],
    eparse.evenements['delete.backward']);
}
v('une rafale qui finit l’epreuve est comptee', 3,
  resumer(KATA, mesures(['input.type', 'delete.backward', 'delete.backward', 'delete.backward']),
    { minimum: 1, reel: 1 }).rafaleArriere);
v('aucun retour arriere : rafale nulle', 0,
  resumer(KATA, mesures(['input.type', 'input.type']), { minimum: 1, reel: 1 }).rafaleArriere);
v('une epreuve sans aucun geste ne casse rien',
  [{}, 0], (() => { const t = resumer(KATA, mesures([]), { minimum: 0, reel: 0 });
    return [t.evenements, t.rafaleArriere]; })());

// --- le plafond -------------------------------------------------------------
// On jette les plus VIEILLES : un coach qui decrit comment tu travaillais il y
// a un an decrit quelqu'un d'autre.
{
  let traces = [];
  for (let i = 0; i < PLAFOND + 30; i++) {
    traces = ajouter(traces, resumer({ id: `k${i}`, banc: 'edition' }, mesures([]), { minimum: 1, reel: 1 }, i));
  }
  v('le plafond tient', PLAFOND, traces.length);
  v('ce sont les plus anciennes qui partent', 'k30', traces[0].id);
  v('et la derniere ajoutee est bien la derniere', `k${PLAFOND + 29}`, traces[traces.length - 1].id);
}
v('sous le plafond, rien n’est jete', 3,
  [1, 2, 3].reduce((t, i) => ajouter(t, resumer(KATA, mesures([]), { minimum: 1, reel: 1 }, i)), []).length);

// --- ce que le coach doit pouvoir dire --------------------------------------
// Chaque assertion ci-dessous est une phrase de la roadmap. Si l'une echoue, ce
// n'est pas un test qui casse : c'est un motif que le coach ne pourra plus
// nommer.
{
  const retape = resumer(KATA, mesures([
    ...Array(40).fill('delete.backward'), ...Array(58).fill('input.type'),
  ]), { minimum: 8, reel: 98 });
  v('« tu retapes des lignes entieres » : l’ecart minimum/reel est la',
    true, retape.reel / retape.minimum > 10);
  v('« tu effaces caractere par caractere » : la rafale est la', 40, retape.rafaleArriere);

  const souris = resumer(KATA, mesures([
    'select.pointer', 'select.pointer', 'select.pointer', 'select', 'input.type',
  ]), { minimum: 5, reel: 5 });
  v('« tu prends la souris » : le rapport souris/clavier est la',
    [3, 1], [souris.evenements['select.pointer'], souris.evenements.select]);

  const hesite = resumer(KATA, mesures(['input.type', 'undo', 'redo', 'undo']), { minimum: 3, reel: 9 });
  v('« tu hesites » : les annulations sont la', [2, 1],
    [hesite.evenements.undo, hesite.evenements.redo]);

  const colle = resumer(KATA, mesures(['input.paste', 'input.type']), { minimum: 20, reel: 22 });
  v('« tu colles au lieu de taper » : le collage reste compte a part',
    1, colle.evenements['input.paste']);
}

console.log(`\n  ${ok} verifications passees, ${ko} echec(s)`);
process.exit(ko ? 1 : 0);
