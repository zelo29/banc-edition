import { acquis, bilan, carte, tirer, SEUIL_ACQUIS, TAILLE_SEANCE } from '../src/banc/seance.ts';
import { EPREUVES as KATAS } from '../src/banc/epreuves.ts';

let ok = 0, ko = 0;
const v = (nom, attendu, obtenu) => {
  const bon = JSON.stringify(attendu) === JSON.stringify(obtenu);
  bon ? ok++ : ko++;
  console.log(`  ${bon ? 'OK  ' : 'ECHEC'} ${nom}${bon ? '' : `  attendu ${JSON.stringify(attendu)}, obtenu ${JSON.stringify(obtenu)}`}`);
};

const essai = (efficacite, quand = 1) => ({ quand, duree: 1000, frappes: 10, souris: 0, efficacite });

// --- acquis -----------------------------------------------------------------
v('jamais fait -> pas acquis',        false, acquis(undefined));
v('liste vide -> pas acquis',         false, acquis([]));
v('sous le seuil -> pas acquis',      false, acquis([essai(0.5)]));
v('au seuil pile -> acquis',          true,  acquis([essai(SEUIL_ACQUIS)]));
// Un geste tenu une fois il y a longtemps n'est pas un geste tenu : seuls les
// trois derniers essais comptent, sinon un coup de chance vaut acquisition a vie.
v('bon essai trop ancien -> pas acquis', false,
  acquis([essai(0.95), essai(0.2), essai(0.3), essai(0.1)]));

// --- tirer ------------------------------------------------------------------
v(`une seance fait ${TAILLE_SEANCE} katas`, TAILLE_SEANCE, tirer(KATAS, TAILLE_SEANCE, {}).length);
v('aucun kata en double', TAILLE_SEANCE, new Set(tirer(KATAS, TAILLE_SEANCE, {}).map((k) => k.id)).size);

// Priorite 1 : ce qui n'a jamais ete vu passe devant tout le reste.
const toutAcquisSaufUn = Object.fromEntries(
  KATAS.map((k) => [k.id, [essai(0.9, 100)]]),
);
delete toutAcquisSaufUn[KATAS[7].id]; // celui-la n'a jamais ete vu
v('le kata jamais vu passe en premier', KATAS[7].id, tirer(KATAS, 5, toutAcquisSaufUn)[0].id);

// Priorite 2 : la dette (vu mais pas acquis) passe devant l'entretien.
const dette = Object.fromEntries(KATAS.map((k) => [k.id, [essai(0.9, 100)]]));
dette[KATAS[9].id] = [essai(0.2, 100)];
v('le kata rate passe devant les acquis', KATAS[9].id, tirer(KATAS, 5, dette)[0].id);

// Priorite 3 : a egalite, le plus ancien d'abord -- personne n'est oublie.
const anciennete = Object.fromEntries(
  KATAS.map((k, i) => [k.id, [essai(0.9, 1000 - i)]]),
);
v('a egalite, le plus ancien passe en premier',
  KATAS[KATAS.length - 1].id, tirer(KATAS, 5, anciennete)[0].id);

// La rotation couvre tout : trois seances enchainees doivent avoir fait le tour
// des 12 katas, sinon un geste peut n'etre jamais travaille.
let hist = {};
const vus = new Set();
for (let s = 0; s < Math.ceil(KATAS.length / TAILLE_SEANCE); s++) {
  for (const k of tirer(KATAS, TAILLE_SEANCE, hist)) {
    vus.add(k.id);
    hist = { ...hist, [k.id]: [...(hist[k.id] ?? []), essai(0.9, 1000 + s)] };
  }
}
v('assez de seances couvrent toutes les epreuves', KATAS.length, vus.size);

// --- bilan ------------------------------------------------------------------
const etape = (id, efficacite, minimum, reel, enseigne = false) => ({
  kataId: id, titre: id, geste: `geste ${id}`,
  duree: 2000, frappes: 20, souris: 0, efficacite, minimum, reel, enseigne,
});

const b = bilan([
  etape('a', 1, 10, 10),
  etape('b', 0.25, 10, 40),
  etape('c', 0.8, 80, 100),
]);
// Sur les totaux (100/150) et non la moyenne des trois taux (0,68) : sinon un
// kata minuscule pese autant qu'un kata de trente lignes.
v('efficacite calculee sur les totaux', 67, Math.round(b.efficacite * 100));
v('un seul geste retenu, le pire', 'b', b.aTravailler.kataId);
v('duree = somme des etapes', 6000, b.duree);

const propre = bilan([etape('a', 0.9, 10, 11), etape('b', 0.85, 10, 12)]);
v('seance propre -> aucun geste a travailler', null, propre.aTravailler);
v('les deux gestes comptent comme tenus', ['a', 'b'], propre.tenus.map((e) => e.kataId));

// Une reussite obtenue avec l'indice affiche ne compte pas comme un geste tenu.
const avecIndice = bilan([etape('a', 0.95, 10, 10, true), etape('b', 0.9, 10, 11, false)]);
v('un geste montre ne compte pas comme tenu', ['b'], avecIndice.tenus.map((e) => e.kataId));

// Une epreuve revelee ne compte jamais comme tenue : sinon demander la reponse
// suffirait a faire disparaitre un geste de la dette.
{
  const revele = { ...etape('a', 1, 1, 1), revele: true };
  const b2 = bilan([revele, etape('b', 1, 1, 1)]);
  v('une epreuve revelee ne compte pas comme tenue', ['b'], b2.tenus.map((e) => e.kataId));
}

// --- carte ------------------------------------------------------------------
{
  const h = {
    [KATAS[0].id]: [essai(0.9, 10)],   // tenu
    [KATAS[1].id]: [essai(0.2, 10)],   // dette
  };                                   // les autres : jamais vus
  const c = carte(KATAS, h);
  v('la dette passe en tete', 'dette', c[0].etat);
  v('le kata tenu passe en dernier', 'tenu', c[c.length - 1].etat);
  v('la carte couvre tous les katas', KATAS.length, c.length);
  v('un kata jamais vu n a pas de meilleur score', null, c.find((l) => l.etat === 'neuf').meilleur);
  v('le meilleur est le MAXIMUM, pas le dernier', 0.9,
    carte(KATAS, { [KATAS[0].id]: [essai(0.9, 1), essai(0.4, 2)] })
      .find((l) => l.id === KATAS[0].id).meilleur);
}

// --- le contenu -------------------------------------------------------------
// Le compte par banc plutot qu'un total en dur : il reste juste quand on ajoute
// du contenu, et il attrape quand meme la perte d'un banc entier.
const parBanc = (b) => KATAS.filter((k) => k.banc === b).length;
v('les trois bancs sont peuples', true,
  parBanc('edition') >= 8 && parBanc('lecture') >= 6 && parBanc('debogage') >= 6);
v('le total est la somme des bancs', KATAS.length,
  parBanc('edition') + parBanc('lecture') + parBanc('debogage'));
v('aucun id en double', KATAS.length, new Set(KATAS.map((k) => k.id)).size);
v('chaque epreuve enseigne un geste nomme', true, KATAS.every((k) => k.geste.length > 10));
v('les katas ont depart != cible', true,
  KATAS.filter((k) => k.banc === 'edition').every((k) => k.depart !== k.cible));

console.log(`\n  ${ok} verifications passees, ${ko} echec(s)`);
process.exit(ko ? 1 : 0);
