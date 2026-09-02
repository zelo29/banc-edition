import { distance, score, progression } from '../src/banc/score.ts';
import { KATAS } from '../src/katas/index.ts';

let ok = 0, ko = 0;
const v = (nom, attendu, obtenu) => {
  const bon = JSON.stringify(attendu) === JSON.stringify(obtenu);
  bon ? ok++ : ko++;
  console.log(`  ${bon ? 'OK  ' : 'ECHEC'} ${nom}${bon ? '' : `  attendu ${JSON.stringify(attendu)}, obtenu ${JSON.stringify(obtenu)}`}`);
};

v('identique = 0',            0, distance('abc', 'abc'));
v('vide vers abc = 3',        3, distance('', 'abc'));
v('abc vers vide = 3',        3, distance('abc', ''));
v('un caractere change = 2',  2, distance('abc', 'abd'));
v('kitten/sitting = 5',       5, distance('kitten', 'sitting'));
v('insertion pure = 2',       2, distance('ac', 'abcc'.slice(0,3) + 'c'));
v('symetrique',               distance('foo(bar)', 'foo(baz)'), distance('foo(baz)', 'foo(bar)'));

// Le cas pédagogique : retaper une ligne pour changer un mot
const avant = 'const total = prix * quantite;';
const apres = 'const somme = prix * quantite;';
const mini = distance(avant, apres);
// 8 et non 10 : le « o » de total est aussi dans somme, la distance le garde.
// C'est bien 8 le minimum qu'un editeur peut atteindre.
v('changer « total » en « somme » coute 8 caracteres', 8, mini);
const bon = score(avant, apres, mini);
const mauvais = score(avant, apres, avant.length + apres.length); // tout retape
v('parcours parfait -> efficacite 1', 1, bon.efficacite);
v('ligne entiere retapee -> efficacite < 0.2', true, mauvais.efficacite < 0.2);
v('gaspilles comptes',                true, mauvais.gaspilles > 40);

// Progression bornee et monotone sur un vrai kata
const k = KATAS[0];
v('progression au depart = 0',  0, progression(k.depart, k.depart, k.cible));
v('progression a la cible = 1', 1, progression(k.cible, k.depart, k.cible));
const milieu = k.depart.replace('let res = 0;', 'let somme = 0;');
const p = progression(milieu, k.depart, k.cible);
v('progression intermediaire strictement entre 0 et 1', true, p > 0 && p < 1);

// L'ancien calcul par prefixe commun SURESTIME : des que la premiere occurrence
// est corrigee, le prefixe commun saute jusqu'a la suivante et annonce presque
// la moitie du travail fait, alors qu'il reste trois occurrences sur quatre.
const prefixeCommun = (a, b) => { let n = 0; while (n < a.length && n < b.length && a[n] === b[n]) n++; return n / b.length; };
console.log(`\n  pour comparaison, sur cette meme edition :`);
console.log(`    distance     -> ${(p * 100).toFixed(0)} % (avance)`);
console.log(`    prefixe      -> ${(prefixeCommun(milieu, k.cible) * 100).toFixed(0)} % (l'ancien calcul, trop optimiste)`);

// Les trois katas sont bien resolubles et non triviaux
for (const kata of KATAS) {
  const d = distance(kata.depart, kata.cible);
  v(`kata « ${kata.titre} » : distance non nulle`, true, d > 0 && d < 400);
}

console.log(`\n  ${ok} verifications passees, ${ko} echec(s)`);
process.exit(ko ? 1 : 0);
