/**
 * Le chronometre des epreuves a question compte-t-il le bon temps ?
 *
 * C'est le harnais qui aurait evite d'enregistrer 3 h 55 de « lecture » pour un
 * exercice de trente secondes. L'horloge est injectee : on fait avancer le temps
 * a la main plutot que d'attendre.
 */
import { armerChrono, lireChrono, _horloge, _activite, _INACTIVITE } from '../src/banc/chrono.ts';

let ok = 0, ko = 0;
const v = (nom, attendu, obtenu) => {
  const bon = JSON.stringify(attendu) === JSON.stringify(obtenu);
  bon ? ok++ : ko++;
  console.log(`  ${bon ? 'OK  ' : 'ECHEC'} ${nom}`);
  if (!bon) console.log(`        attendu ${JSON.stringify(attendu)}\n        obtenu  ${JSON.stringify(obtenu)}`);
};

let t = 0;
const s = (n) => n * 1000;
const poser = () => { t = s(1000); _horloge(() => t); armerChrono(); };

// --- le cas normal ----------------------------------------------------------
poser();
t += s(5);
v('cinq secondes comptent cinq secondes', s(5), lireChrono());

// --- lire sans rien toucher reste du travail --------------------------------
poser();
t += s(120);
v('deux minutes de lecture immobile comptent entierement', s(120), lireChrono());

// --- une absence est BORNEE, pas comptee ------------------------------------
poser();
t += s(4 * 3600); // quatre heures d'onglet abandonne
v('quatre heures d’absence sont bornees au seuil', _INACTIVITE, lireChrono());

// --- l'activite relance le compteur -----------------------------------------
poser();
t += s(60);
_activite();      // on tape quelque chose a 60 s
t += s(60);
v('l’activite prolonge la mesure', s(120), lireChrono());

// --- absence PUIS retour : la lacune n'est pas facturee ---------------------
poser();
t += s(30);
_activite();                 // derniere activite a 30 s
t += s(4 * 3600);            // on part quatre heures
_activite();                 // on revient
t += s(10);
v('le retour ne facture pas l’absence', _INACTIVITE + s(30) + s(10), lireChrono());

// --- deux epreuves ne se cumulent pas ---------------------------------------
poser();
t += s(20);
lireChrono();
armerChrono();
t += s(3);
v('armer remet a zero', s(3), lireChrono());

console.log(`\n  ${ok} verifications passees, ${ko} echec(s)`);
process.exit(ko ? 1 : 0);
