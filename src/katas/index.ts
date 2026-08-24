/**
 * Un kata = deux fichiers. La cible EST le test : pas de suite de tests à
 * écrire, pas de runner, pas de compilation. On compare deux chaînes.
 *
 * Chaque kata vise un geste précis, celui que le coach saura reconnaître plus
 * tard dans le journal. Un kata qui n'enseigne aucun geste particulier ne sert
 * qu'à mesurer la vitesse de frappe — ce que fait déjà Monkeytype, mieux.
 */
export interface Kata {
  id: string;
  titre: string;
  /** Le geste que ce kata entraîne, affiché seulement APRÈS la réussite. */
  geste: string;
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
    geste: 'Ctrl+Shift+K — supprime la ligne entière, sans la sélectionner',
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
    id: 'flechees',
    titre: 'Passer en fléchées',
    geste: 'Shift+Alt+→ — étend la sélection au bloc syntaxique suivant',
    depart: `const doubler = function (n) {
  return n * 2;
};

const trier = function (liste) {
  return [...liste].sort();
};`,
    cible: `const doubler = (n) => n * 2;

const trier = (liste) => [...liste].sort();`,
  },
];
