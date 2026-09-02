/**
 * La repetition tient-elle ses trois promesses ?
 *
 * Ce harnais ne verifie pas du code : il verifie des DECISIONS. Chacune des
 * assertions ci-dessous correspond a une facon de se tromper qu'on aurait prise
 * naturellement, et le jour ou quelqu'un « simplifiera » le module, c'est ici
 * que ca se verra.
 */
import { EPREUVES } from '../src/banc/epreuves.ts';
import { bilan, SEUIL_ACQUIS } from '../src/banc/seance.ts';
import {
  MAX_ESSAIS,
  MAX_REPRISES_SEANCE,
  derniersEssais,
  montrerIndice,
  progres,
  refaire,
  repetable,
  reprisesFaites,
} from '../src/banc/repetition.ts';

let ok = 0, ko = 0;
const v = (nom, attendu, obtenu) => {
  const bon = JSON.stringify(attendu) === JSON.stringify(obtenu);
  bon ? ok++ : ko++;
  console.log(`  ${bon ? 'OK  ' : 'ECHEC'} ${nom}`);
  if (!bon) console.log(`        attendu ${JSON.stringify(attendu)}\n        obtenu  ${JSON.stringify(obtenu)}`);
};

const uneDe = (banc) => EPREUVES.find((e) => e.banc === banc);
const KATA = uneDe('edition');
const LECTURE = uneDe('lecture');
const DEBOGAGE = uneDe('debogage');
const RATE = SEUIL_ACQUIS - 0.4;
const TENU = SEUIL_ACQUIS + 0.1;

// --- 1. on ne repete que le banc d'edition ----------------------------------
// Une lecture qu'on vient de resoudre a livre sa reponse : la refaire mesure la
// memoire, pas la lecture, et la courbe monterait toute seule.
v('un kata est répétable', true, repetable(KATA));
v('une lecture ne l’est pas', false, repetable(LECTURE));
v('un débogage non plus', false, repetable(DEBOGAGE));
v('une lecture ratée n’est PAS reprise', false, refaire(LECTURE, [RATE], 4));
v('un débogage raté non plus', false, refaire(DEBOGAGE, [RATE], 4));
v('un kata raté, lui, est repris', true, refaire(KATA, [RATE], 4));

// --- 2. on ne repete que ce qu'on n'a pas tenu ------------------------------
v('un kata tenu du premier coup n’est pas repris', false, refaire(KATA, [TENU], 4));
v('un kata tenu à la reprise s’arrête là', false, refaire(KATA, [RATE, TENU], 4));
v('un kata encore raté est repris une seconde fois', true, refaire(KATA, [RATE, RATE], 4));
v(`au ${MAX_ESSAIS}e essai, la série s’arrête même si c’est toujours raté`,
  false, refaire(KATA, [RATE, RATE, RATE], 4));

// --- le budget de la seance -------------------------------------------------
// La taille connue d'avance est ce qui permet de relancer demain : le mecanisme
// cense faire revenir ne doit pas etre ce qui fait fuir.
v('sans budget restant, plus aucune reprise', false, refaire(KATA, [RATE], 0));
v('avec une seule reprise restante, elle est accordée', true, refaire(KATA, [RATE], 1));
v('une séance ne peut pas dépasser son budget de reprises', true, MAX_REPRISES_SEANCE < 5 * (MAX_ESSAIS - 1));

// --- 3. l'indice ne parait qu'au premier essai ------------------------------
// C'est ce qui fait de la reprise un TEST, et non une seconde lecon.
v('geste neuf, premier essai : l’indice est montré', true, montrerIndice(false, 0));
v('geste neuf, première reprise : l’indice a disparu', false, montrerIndice(false, 1));
v('geste déjà acquis : jamais d’indice', false, montrerIndice(true, 0));

// --- la courbe --------------------------------------------------------------
v('une série vide n’a pas de courbe', null, progres([]));
{
  const p = progres([0.2, 0.5, 0.8]);
  v('la courbe retient le premier et le dernier', [0.2, 0.8], [p.premier, p.dernier]);
  v('le gain est la différence, arrondie comme on l’affiche', '0.60', p.gain.toFixed(2));
  v('un dernier essai au-dessus du seuil est tenu', true, p.tenu);
}
{
  // On retient le DERNIER, pas le meilleur : la question est « que sais-tu faire
  // maintenant », pas « qu'as-tu reussi une fois ». Garder le meilleur ferait de
  // la reprise une machine a tirer au sort une bonne note.
  const p = progres([0.9, 0.3]);
  v('un essai réussi puis raté n’est PAS tenu', false, p.tenu);
  v('et le meilleur essai n’est pas celui qu’on garde', 0.3, p.dernier);
  v('le recul est annoncé tel quel, sans être caché', true, p.gain < 0);
}

// --- le bilan ne doit pas punir celui qui répète ----------------------------
// L'efficacite d'une seance est somme(minimum) / somme(reel). Trois essais sur
// le meme kata ajoutent trois fois le reel : sans filtrage, le score s'effondre
// pour avoir fait exactement ce que l'outil venait de demander.
const etape = (kataId, efficacite, reel) => ({
  banc: 'edition', kataId, titre: kataId, geste: 'g',
  duree: 1000, frappes: 10, souris: 0,
  efficacite, minimum: 10, reel, enseigne: false,
});
{
  const serie = [etape('k1', 0.2, 50), etape('k1', 0.5, 20), etape('k1', 0.8, 12)];
  const avecTout = bilan(serie);
  const avecFiltre = bilan(derniersEssais(serie));
  v('sans filtrage, la séance qui répète est punie', true, avecTout.efficacite < 0.5);
  v('le bilan ne compte que le dernier essai de chaque épreuve',
    true, avecFiltre.efficacite > avecTout.efficacite);
  v('et il compte exactement celui-là', '0.83', avecFiltre.efficacite.toFixed(2));
  v('une seule étape reste pour le bilan', 1, derniersEssais(serie).length);
  v('c’est bien la dernière', 0.8, derniersEssais(serie)[0].efficacite);
}
{
  // Le cas qui compte vraiment : une reprise tenue vaut un geste TENU, alors que
  // le premier essai etait enseigne. C'est le rendement du mecanisme.
  const serie = [
    { ...etape('k1', 0.3, 40), enseigne: true },
    { ...etape('k1', 0.85, 12), enseigne: false },
  ];
  v('la reprise tenue compte comme un geste tenu', ['k1'],
    bilan(derniersEssais(serie)).tenus.map((e) => e.kataId));
  v('alors que le premier essai, enseigné, ne l’aurait pas fait', [],
    bilan([serie[0]]).tenus.map((e) => e.kataId));
}
{
  // L'ordre est preserve : le bilan garde les epreuves dans l'ordre de la seance.
  const serie = [etape('k1', 0.2, 50), etape('k2', 0.9, 11), etape('k1', 0.8, 12)];
  v('l’ordre des épreuves est préservé', ['k1', 'k2'],
    derniersEssais(serie).map((e) => e.kataId));
  v('les reprises sont comptées, l’original non', 1, reprisesFaites(serie));
}
v('une séance sans reprise en compte zéro', 0,
  reprisesFaites([etape('k1', 0.9, 11), etape('k2', 0.9, 11)]));

// --- le geste le plus coûteux reste celui qu'on retient ---------------------
// Le bilan ne nomme qu'UN geste. Il doit nommer celui qu'on rate ENCORE apres
// les reprises, pas celui qu'on ratait au debut et qu'on vient de corriger.
{
  const serie = [
    etape('corrige', 0.1, 100), etape('corrige', 0.9, 11),
    etape('toujours-rate', 0.4, 25),
  ];
  v('le geste à travailler est celui qu’on rate encore après les reprises',
    'toujours-rate', bilan(derniersEssais(serie)).aTravailler.kataId);
}

// --- une seance entiere se termine, et ne double pas de longueur ------------
// C'est l'algorithme que App.tsx execute, rejoue ici sans React : la boucle
// « refaire ou avancer » est le seul endroit ou une erreur bloquerait le banc
// pour de bon, ecran fige sur le meme kata.
function jouer(epreuves, note) {
  let etape = 0, serie = [], reprises = 0, etapes = 0;
  const garde = 200;
  while (etape < epreuves.length && etapes < garde) {
    etapes++;
    serie = [...serie, note(epreuves[etape], serie.length)];
    if (refaire(epreuves[etape], serie, MAX_REPRISES_SEANCE - reprises)) { reprises++; continue; }
    serie = [];
    etape++;
  }
  return { etapes, reprises, fini: etape === epreuves.length };
}
const CINQ_KATAS = Array.from({ length: 5 }, () => KATA);
{
  const r = jouer(CINQ_KATAS, () => RATE);
  v('cinq katas tous ratés : la séance se termine quand même', true, r.fini);
  v('et elle consomme exactement le budget de reprises', MAX_REPRISES_SEANCE, r.reprises);
  v('soit cinq épreuves plus le budget, jamais quinze étapes',
    5 + MAX_REPRISES_SEANCE, r.etapes);
}
{
  const r = jouer(CINQ_KATAS, () => TENU);
  v('cinq katas tenus du premier coup : aucune reprise', 0, r.reprises);
  v('la séance fait exactement cinq étapes', 5, r.etapes);
}
{
  // Le cas nominal : on rate, on reprend, on tient. Une reprise par kata.
  const r = jouer(CINQ_KATAS, (_, numero) => (numero === 0 ? RATE : TENU));
  v('rater puis tenir à la reprise coûte une reprise par kata',
    MAX_REPRISES_SEANCE, r.reprises);
  v('et la séance se termine', true, r.fini);
}
{
  const r = jouer(Array.from({ length: 5 }, () => LECTURE), () => RATE);
  v('cinq lectures ratées ne déclenchent aucune reprise', 0, r.reprises);
  v('la séance de lecture fait exactement cinq étapes', 5, r.etapes);
}

console.log(`\n  ${ok} verifications passees, ${ko} echec(s)`);
process.exit(ko ? 1 : 0);
