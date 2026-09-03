/**
 * Le banc de navigation.
 *
 * Lire un fichier et chercher dans un arbre sont deux gestes différents, et le
 * second décide de tes deux premières semaines dans une équipe. On ne te
 * demandera pas de comprendre `paiement.js` : on te demandera de trouver *où*
 * le montant est arrondi, dans quatre cents fichiers que personne n'a le temps
 * de t'expliquer.
 *
 * La mesure est celle des autres bancs à question : le minimum est UNE réponse,
 * le réel est le nombre de réponses données, et le temps compte. Ce qui change,
 * c'est le matériau — plusieurs fichiers, et une question dont la réponse n'est
 * dans aucun d'eux en particulier.
 *
 * LE CHAMP `preuve` EST CE QUI FAIT TENIR CE BANC.
 *
 * Une lecture s'exécute, un débogage se reproduit. Une navigation, elle, n'a
 * rien à exécuter : sa réponse est un fait sur l'arbre. Chaque épreuve déclare
 * donc COMMENT sa réponse se recalcule — quel symbole, quel genre de recherche
 * — et `verif/navigation.mjs` la recalcule vraiment, puis la compare à celle
 * qui est écrite ici. Une épreuve dont la réponse est seulement affirmée ne
 * passe pas.
 *
 * C'est aussi ce qui rendra le générateur d'épreuves possible : un lot produit
 * par un agent se valide tout seul, sans qu'un humain relise quatre cents
 * fichiers pour vérifier qu'il n'y a bien qu'un seul appel.
 */
import type { Langage } from '../banc/langages';

export interface Fichier {
  chemin: string;
  langage: Langage;
  code: string;
}

/**
 * Comment le harnais recalcule la réponse.
 *
 * Un genre par question qu'on sait poser sur un arbre. En ajouter un se voit :
 * il faut l'écrire dans `verif/navigation.mjs`, sinon l'épreuve est refusée.
 */
export type Preuve =
  /** où le symbole est-il DÉFINI ? — et il ne doit l'être qu'une fois */
  | { genre: 'definition'; symbole: string }
  /** quelle fonction l'appelle ? — un import et un commentaire n'appellent pas */
  | { genre: 'appelant'; symbole: string }
  /** combien de fichiers importent ce module ? */
  | { genre: 'importateurs'; module: string }
  /** quel fichier ce fichier-là importe-t-il pour ce symbole ? */
  | { genre: 'import'; symbole: string; depuis: string }
  /** lequel des exports de ce module n'est importé nulle part ? */
  | { genre: 'exportInutilise'; module: string };

export interface Navigation {
  id: string;
  titre: string;
  /** La technique de navigation entraînée. Montrée AVANT tant qu'elle n'est pas acquise. */
  geste: string;
  fichiers: Fichier[];
  question: string;
  format: string;
  /** Toutes les formes acceptées, déjà en minuscules et sans accent. */
  reponses: string[];
  explication: string;
  preuve: Preuve;
}

const js = (chemin: string, code: string): Fichier => ({ chemin, langage: 'js', code });

export const NAVIGATIONS: Navigation[] = [
  {
    id: 'ou-est-defini',
    titre: 'Trois usages, une déclaration',
    geste: 'Cherche la déclaration (`const`, `function`), pas les occurrences — elles sont partout',
    fichiers: [
      js('src/config.js', `export const DELAI_MAX = 30_000;
export const TAILLE_LOT = 50;`),
      js('src/client.js', `import { DELAI_MAX } from './config.js';

export async function appeler(url) {
  return fetch(url, { signal: AbortSignal.timeout(DELAI_MAX) });
}`),
      js('src/file.js', `import { DELAI_MAX, TAILLE_LOT } from './config.js';

export function decouper(taches) {
  const lots = [];
  for (let i = 0; i < taches.length; i += TAILLE_LOT) {
    lots.push({ taches: taches.slice(i, i + TAILLE_LOT), delai: DELAI_MAX });
  }
  return lots;
}`),
      js('src/reprise.js', `import { DELAI_MAX } from './config.js';

// Au-delà de DELAI_MAX cumulé, on abandonne la tâche.
export function reessayer(tentative) {
  return Math.min(2 ** tentative * 100, DELAI_MAX);
}`),
    ],
    question: 'Dans quel fichier `DELAI_MAX` est-il défini ?',
    format: 'un chemin de fichier',
    reponses: ['src/config.js', 'config.js', 'config'],
    explication:
      'Quatre fichiers contiennent `DELAI_MAX`, un seul le déclare. Une recherche brute rend les quatre et te fait ouvrir le plus gros en premier — c’est le réflexe qui coûte le plus de temps en arrivant dans un dépôt. Cherche la forme de la déclaration, pas le nom seul : `const DELAI_MAX`, ou l’outil qui sait le faire (« aller à la définition »).',
    preuve: { genre: 'definition', symbole: 'DELAI_MAX' },
  },
  {
    id: 'qui-appelle',
    titre: 'L’appel et ses sosies',
    geste: 'Un import et un commentaire ne sont pas des appels : cherche le nom SUIVI d’une parenthèse',
    fichiers: [
      js('src/cache.js', `const entrees = new Map();

export function poser(cle, valeur) {
  entrees.set(cle, valeur);
}

export function purger(cle) {
  entrees.delete(cle);
}`),
      js('src/session.js', `import { purger } from './cache.js';

export function ouvrir(id) {
  return { id, debut: Date.now() };
}

export function fermer(id) {
  purger(\`session:\${id}\`);
  return true;
}`),
      js('src/admin.js', `// TODO : purger le cache ici aussi, sinon les droits restent chauds.
export function reinitialiser(compte) {
  compte.droits = [];
  return compte;
}`),
    ],
    question: 'Quelle fonction appelle `purger` ?',
    format: 'un nom de fonction',
    reponses: ['fermer'],
    explication:
      '`purger` apparaît quatre fois : sa déclaration, un import, un commentaire, et un seul vrai appel. La recherche textuelle les rend tous ; c’est à toi de savoir que seule la forme `purger(` est un appel. Le commentaire d’`admin.js` est le piège habituel — il dit ce que le code devrait faire, pas ce qu’il fait.',
    preuve: { genre: 'appelant', symbole: 'purger' },
  },
  {
    id: 'rayon-d-impact',
    titre: 'Avant de changer la signature',
    geste: 'Compte les importateurs avant de toucher à une fonction : c’est ça, le coût du changement',
    fichiers: [
      js('src/journal.js', `export function noter(niveau, message) {
  console.log(\`[\${niveau}] \${message}\`);
}`),
      js('src/api.js', `import { noter } from './journal.js';

export async function servir(requete) {
  noter('info', requete.url);
  return { statut: 200 };
}`),
      js('src/tache.js', `import { noter } from './journal.js';

export function lancer(nom) {
  noter('debug', \`démarrage \${nom}\`);
}`),
      js('src/format.js', `export function enDate(t) {
  return new Date(t).toISOString();
}`),
      js('src/vue.js', `import { enDate } from './format.js';

export function rendre(evenement) {
  return \`\${enDate(evenement.t)} — \${evenement.nom}\`;
}`),
    ],
    question: 'Combien de fichiers importent `journal.js` ?',
    format: 'un nombre',
    reponses: ['2', 'deux'],
    explication:
      'Deux : `api.js` et `tache.js`. C’est la première question à se poser avant de changer une signature, et la seule qui donne le vrai coût du changement. `format.js` est là pour que compter les fichiers ne revienne pas à compter les fichiers du dossier.',
    preuve: { genre: 'importateurs', module: 'journal.js' },
  },
  {
    id: 'le-baril',
    titre: 'Le baril qui ne définit rien',
    geste: 'Un `export … from` réexporte sans définir : suis la chaîne jusqu’au fichier qui contient le corps',
    fichiers: [
      js('src/outils/index.js', `export { formater } from './date.js';
export { arrondir } from './nombre.js';`),
      js('src/outils/date.js', `export function formater(d) {
  return new Intl.DateTimeFormat('fr-FR').format(d);
}`),
      js('src/outils/nombre.js', `export function arrondir(n, decimales = 2) {
  const f = 10 ** decimales;
  return Math.round(n * f) / f;
}`),
      js('src/rapport.js', `import { formater, arrondir } from './outils/index.js';

export function ligne(vente) {
  return \`\${formater(vente.date)} : \${arrondir(vente.montant)} €\`;
}`),
    ],
    question: 'Dans quel fichier le corps de `formater` est-il écrit ?',
    format: 'un chemin de fichier',
    reponses: ['src/outils/date.js', 'outils/date.js', 'date.js'],
    explication:
      '`index.js` contient bien le mot `formater`, et c’est ce que ton import désigne — mais il ne fait que le faire suivre. Le baril est commode et il coûte exactement ça : un saut de plus entre l’usage et le code, et une recherche de définition qui s’arrête au mauvais endroit. Le corps est dans `date.js`.',
    preuve: { genre: 'definition', symbole: 'formater' },
  },
  {
    id: 'l-homonyme',
    titre: 'Deux fonctions, un seul nom',
    geste: 'À noms égaux, c’est l’import qui tranche — jamais la recherche globale',
    fichiers: [
      js('src/paiement/valider.js', `export function valider(montant) {
  return typeof montant === 'number' && montant > 0;
}`),
      js('src/formulaire/valider.js', `export function valider(champs) {
  return Object.values(champs).every(Boolean);
}`),
      js('src/commande.js', `import { valider } from './paiement/valider.js';

export function passer(commande) {
  if (!valider(commande.montant)) return null;
  return { ...commande, etat: 'passee' };
}`),
    ],
    question: 'Quel fichier `commande.js` utilise-t-il pour `valider` ?',
    format: 'un chemin de fichier',
    reponses: ['src/paiement/valider.js', 'paiement/valider.js'],
    explication:
      'Les deux `valider` ne prennent même pas le même genre d’argument — sauter dans le mauvais fait perdre un quart d’heure à comprendre pourquoi le code « ne peut pas marcher ». La recherche globale rend les deux à égalité ; seule la ligne d’import en haut de `commande.js` répond. C’est le premier endroit à lire dans un fichier inconnu, avant même la première fonction.',
    preuve: { genre: 'import', symbole: 'valider', depuis: 'src/commande.js' },
  },
  {
    id: 'le-code-mort',
    titre: 'Chercher une absence',
    geste: 'Le code mort se trouve à l’envers : liste les exports, retire ceux qui sont importés',
    fichiers: [
      js('src/format.js', `export function enDate(t) {
  return new Date(t).toISOString().slice(0, 10);
}

export function enDuree(ms) {
  return \`\${(ms / 1000).toFixed(1)} s\`;
}

export function enOctets(n) {
  return \`\${(n / 1024).toFixed(1)} Ko\`;
}`),
      js('src/rapport.js', `import { enDate, enDuree } from './format.js';

export function resumer(seance) {
  return \`\${enDate(seance.debut)} — \${enDuree(seance.duree)}\`;
}`),
      js('src/console.js', `import { enDate } from './format.js';

export function afficher(evenements) {
  for (const e of evenements) console.log(enDate(e.t), e.nom);
}`),
    ],
    question: 'Quelle fonction exportée par `format.js` n’est importée nulle part ?',
    format: 'un nom de fonction',
    reponses: ['enoctets'],
    explication:
      'Chercher ce qui manque est le seul geste de navigation qui ne se fait pas avec une recherche : aucune requête ne rend une absence. On liste les exports, on liste les imports, on soustrait. C’est aussi ce que fait un outil de couverture ou un `knip` — encore faut-il savoir ce qu’il calcule pour lire son rapport.',
    preuve: { genre: 'exportInutilise', module: 'src/format.js' },
  },
];
