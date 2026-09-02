/**
 * Un kata = deux fichiers. La cible EST le test : pas de suite de tests à
 * écrire, pas de runner, pas de compilation. On compare deux chaînes.
 *
 * Chaque kata vise UN geste précis et un seul. Un kata qui n'enseigne aucun
 * geste particulier ne sert qu'à mesurer la vitesse de frappe — ce que fait déjà
 * Monkeytype, mieux.
 *
 * Ils sont volontairement courts : une séance en enchaîne cinq, et une séance
 * qui dépasse trois minutes ne se refait pas le lendemain.
 */
/** Une touche et ce qu'elle fait, dans l'ordre où on les enchaîne. */
export interface Etape {
  touche: string;
  effet: string;
}

export interface Kata {
  id: string;
  titre: string;
  /** Le geste que ce kata entraîne. Montré AVANT tant qu'il n'est pas acquis. */
  geste: string;
  /**
   * La suite de touches, quand le geste en demande plusieurs.
   *
   * Nommer la touche d'entrée ne suffit pas toujours. « Ctrl+H » ouvre un
   * panneau, et il fallait ensuite deviner comment atteindre le champ de
   * remplacement et le bouton « replace all » — sans quoi on finissait à la
   * souris, que le banc pénalise. Un geste qu'on ne sait pas terminer au clavier
   * n'est pas un geste appris.
   */
  etapes?: Etape[];
  depart: string;
  cible: string;
}

export const KATAS: Kata[] = [
  {
    id: 'renommer',
    titre: 'Renommer partout',
    geste: 'Ctrl+D — sélectionne l’occurrence suivante et pose un curseur',
    depart: `function total(panier) {
  let res = 0;
  for (const article of panier) {
    res += article.prix * article.quantite;
  }
  if (res > 100) res *= 0.9;
  return res;
}`,
    cible: `function total(panier) {
  let somme = 0;
  for (const article of panier) {
    somme += article.prix * article.quantite;
  }
  if (somme > 100) somme *= 0.9;
  return somme;
}`,
  },
  {
    id: 'nettoyer',
    titre: 'Retirer les traces',
    geste: 'Ctrl+Maj+K — supprime la ligne entière, sans la sélectionner',
    depart: `export function charger(id) {
  console.log('charger', id);
  const brut = lire(id);
  console.log('brut', brut);
  if (!brut) return null;
  console.debug('parsing…');
  const objet = JSON.parse(brut);
  console.log('ok', objet);
  return objet;
}`,
    cible: `export function charger(id) {
  const brut = lire(id);
  if (!brut) return null;
  const objet = JSON.parse(brut);
  return objet;
}`,
  },
  {
    id: 'etendre',
    titre: 'Vider la configuration',
    geste: 'Maj+Alt+→ — étend la sélection au bloc syntaxique qui englobe le curseur',
    depart: `const config = {
  cache: { actif: true, duree: 3600, taille: 500 },
  trace: { actif: false, niveau: 'debug' },
};`,
    cible: `const config = {
  cache: null,
  trace: null,
};`,
  },
  {
    id: 'deplacer',
    titre: 'Remettre dans l’ordre',
    geste: 'Alt+↓ — déplace la ligne entière, sans la couper ni la recoller',
    depart: `function prix(article) {
  const tva = ht * 0.2;
  const ht = article.prixHT;
  return ht + tva;
}`,
    cible: `function prix(article) {
  const ht = article.prixHT;
  const tva = ht * 0.2;
  return ht + tva;
}`,
  },
  {
    id: 'dupliquer',
    titre: 'Trois routes au lieu d’une',
    geste: 'Maj+Alt+↓ — duplique la ligne vers le bas, prête à être modifiée',
    depart: `const routes = [
  { chemin: '/', vue: Accueil },
];`,
    cible: `const routes = [
  { chemin: '/', vue: Accueil },
  { chemin: '/profil', vue: Profil },
  { chemin: '/reglages', vue: Reglages },
];`,
  },
  {
    id: 'curseurs-colonne',
    titre: 'Trois lignes, une frappe',
    geste: 'Ctrl+Alt+↓ — pose un curseur sur la ligne du dessous, puis tu tapes une fois pour trois',
    depart: `const a = lire('a');
const b = lire('b');
const c = lire('c');`,
    cible: `const a = await lire('a');
const b = await lire('b');
const c = await lire('c');`,
  },
  {
    id: 'joindre',
    titre: 'Tout sur une ligne',
    geste: 'Ctrl+J — réunit la ligne suivante à la courante, indentation comprise',
    depart: `const message =
  'bonjour '
  + nom;`,
    cible: `const message = 'bonjour ' + nom;`,
  },
  {
    id: 'indenter',
    titre: 'Réindenter le bloc',
    geste: 'Tab sur une sélection décale tout le bloc — inutile de viser chaque ligne',
    depart: `function verifier(x) {
if (!x) return false;
if (x < 0) return false;
return true;
}`,
    cible: `function verifier(x) {
  if (!x) return false;
  if (x < 0) return false;
  return true;
}`,
  },
  {
    id: 'mot-arriere',
    titre: 'Raccourcir le chemin',
    geste: 'Ctrl+Retour arrière — efface un mot entier par appui, pas une lettre',
    depart: `const chemin = dossier + '/' + sous + '/' + nom + '.' + extension;`,
    cible: `const chemin = dossier + '/' + nom;`,
  },
  {
    id: 'fin-de-ligne',
    titre: 'Couper les TODO',
    geste: 'Maj+Fin — sélectionne jusqu’au bout de la ligne, sans toucher la souris',
    depart: `function nom() { return 'a'; } // TODO: renommer, voir ticket #412
function age() { return 12; } // TODO: renommer, voir ticket #413`,
    cible: `function nom() { return 'a'; }
function age() { return 12; }`,
  },
  {
    id: 'entourer',
    titre: 'Mettre entre guillemets',
    geste: 'Sélectionne puis tape le guillemet : l’éditeur entoure, il ne remplace pas',
    depart: `const cles = [nom, age, ville];`,
    cible: `const cles = ['nom', 'age', 'ville'];`,
  },
  {
    id: 'remplacer',
    titre: 'Changer de domaine',
    geste: 'Ctrl+H — remplace dans tout le fichier, une fois pour toutes',
    etapes: [
      { touche: 'Ctrl+H', effet: 'ouvre le panneau, curseur déjà dans « Find »' },
      { touche: 'Tab', effet: 'passe au champ « Replace »' },
      { touche: 'Ctrl+Alt+Entrée', effet: 'remplace TOUT — Entrée seule n’en fait qu’un' },
      { touche: 'Échap', effet: 'referme le panneau' },
    ],
    depart: `const API = 'https://old.example.com';
fetch(API + '/users');
fetch(API + '/posts');
// doc : https://old.example.com/docs
// statut : https://old.example.com/status`,
    cible: `const API = 'https://api.example.com';
fetch(API + '/users');
fetch(API + '/posts');
// doc : https://api.example.com/docs
// statut : https://api.example.com/status`,
  },
];
