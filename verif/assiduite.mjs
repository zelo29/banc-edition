/**
 * L'assiduite compte-t-elle les bons jours ?
 *
 * Deux pieges reels, et ce sont eux qui justifient ce fichier : le fuseau
 * horaire, qui decale un jour entier, et le changement d'heure, qui fait de la
 * veille du 30 mars le 30 mars. Aucun des deux ne se voit en relisant, et aucun
 * ne se rattrape : on ne peut pas refaire hier.
 */
import { execFileSync } from 'node:child_process';
import { assiduite, jourLocal, marquer, veille } from '../src/banc/assiduite.ts';

let ok = 0, ko = 0;
const v = (nom, attendu, obtenu) => {
  const bon = JSON.stringify(attendu) === JSON.stringify(obtenu);
  bon ? ok++ : ko++;
  console.log(`  ${bon ? 'OK  ' : 'ECHEC'} ${nom}`);
  if (!bon) console.log(`        attendu ${JSON.stringify(attendu)}\n        obtenu  ${JSON.stringify(obtenu)}`);
};

// --- le jour est LOCAL, pas UTC ---------------------------------------------
v('minuit et demi compte pour le jour qui commence',
  '2026-01-01', jourLocal(new Date(2026, 0, 1, 0, 30)));
v('vingt-trois heures compte encore pour le jour en cours',
  '2026-01-01', jourLocal(new Date(2026, 0, 1, 23, 0)));

// La preuve du piege : sous un fuseau tres a l'est, `toISOString` rend la
// VEILLE pour la meme date locale. On relance donc le calcul dans un processus
// a l'autre bout du monde, ou le reflexe habituel se serait trompe d'un jour.
{
  const script = `
    import { jourLocal } from '${new URL('../src/banc/assiduite.ts', import.meta.url).pathname}';
    const d = new Date(2026, 0, 1, 0, 30);
    console.log(JSON.stringify([jourLocal(d), d.toISOString().slice(0, 10)]));
  `;
  const sortie = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    env: { ...process.env, TZ: 'Pacific/Auckland' },
  }).toString();
  const [local, utc] = JSON.parse(sortie);
  v('a Auckland, le jour local est bien le 1er janvier', '2026-01-01', local);
  v('la ou le reflexe `toISOString` se serait trompe d’un jour', '2025-12-31', utc);
}

// --- la veille resiste au changement d'heure --------------------------------
{
  const script = `
    import { veille } from '${new URL('../src/banc/assiduite.ts', import.meta.url).pathname}';
    // 29 mars 2026 : passage a l'heure d'ete en Europe, 2 h devient 3 h.
    console.log(JSON.stringify([veille('2026-03-30'), veille('2026-03-29'), veille('2026-10-26')]));
  `;
  const sortie = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    env: { ...process.env, TZ: 'Europe/Paris' },
  }).toString();
  v('la veille traverse le passage a l’heure d’ete',
    ['2026-03-29', '2026-03-28', '2026-10-25'], JSON.parse(sortie));
}
v('la veille traverse un changement de mois', '2026-01-31', veille('2026-02-01'));
v('et une annee bissextile', '2028-02-29', veille('2028-03-01'));

// --- marquer ----------------------------------------------------------------
v('deux seances le meme jour ne comptent qu’une fois',
  ['2026-09-06'], marquer(marquer([], '2026-09-06'), '2026-09-06'));
v('les jours restent tries', ['2026-09-04', '2026-09-05', '2026-09-06'],
  marquer(marquer(['2026-09-05'], '2026-09-06'), '2026-09-04'));

// --- la serie ---------------------------------------------------------------
const A = '2026-09-06';
v('aucune seance : etat « jamais »', 'jamais', assiduite([], A).etat);
v('et une serie a zero, sans drame', 0, assiduite([], A).serie);
{
  const a = assiduite(['2026-09-04', '2026-09-05', '2026-09-06'], A);
  v('trois jours d’affilee jusqu’a aujourd’hui', 3, a.serie);
  v('l’etat dit que c’est fait', 'aujourdhui', a.etat);
}
{
  // La serie reste VIVANTE tout le lendemain : elle se sauve encore. Annoncer
  // zero des minuit est ce qui fait abandonner.
  const a = assiduite(['2026-09-04', '2026-09-05'], A);
  v('faite hier, pas encore aujourd’hui : la serie tient', 2, a.serie);
  v('et l’etat le dit', 'a-sauver', a.etat);
}
{
  const a = assiduite(['2026-09-01', '2026-09-02'], A);
  v('plus vieux qu’hier : la serie est rompue', 0, a.serie);
  v('et l’etat le dit', 'rompue', a.etat);
  // Mais on a de quoi montrer autre chose qu’un zero.
  v('les jours sur sept restent la pour ne pas afficher que du vide', 2, a.surSept);
}
{
  // Un trou coupe la serie meme si le total est gros.
  const jours = ['2026-08-30', '2026-08-31', '2026-09-01', '2026-09-05', '2026-09-06'];
  const a = assiduite(jours, A);
  v('un trou coupe la serie en cours', 2, a.serie);
  // Le record n'est pas la serie en cours : c'est la plus longue jamais tenue.
  v('le record retient la plus longue suite, ou qu’elle soit', 3, a.record);
  v('le total compte tous les jours', 5, a.total);
  // Sept jours en arriere depuis le 6 : du 31 aout au 6 septembre. Le 30 aout
  // tombe hors fenetre, les quatre autres y sont.
  v('la fenetre de sept jours s’arrete pile', 4, a.surSept);
}
v('un seul jour fait une serie de un', 1, assiduite([A], A).serie);
v('le record d’une serie unique vaut cette serie', 1, assiduite([A], A).record);
// L'ordre d'arrivee ne change rien : la liste est un ensemble de dates.
v('l’ordre d’enregistrement n’influe pas', assiduite(['2026-09-04','2026-09-05','2026-09-06'], A),
  assiduite(['2026-09-06','2026-09-04','2026-09-05'], A));

console.log(`\n  ${ok} verifications passees, ${ko} echec(s)`);
process.exit(ko ? 1 : 0);
