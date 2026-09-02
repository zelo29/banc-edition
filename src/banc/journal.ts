/**
 * Banc d'édition — étape 1 : le journal des gestes.
 *
 * On n'intercepte AUCUNE touche. CodeMirror annote déjà chaque transaction avec
 * sa cause, et on lit cette annotation directement — `tr.annotation(Transaction.userEvent)` :
 *
 *   input.type        frappe de caractère
 *   input.paste       collage            — ce n'est pas du geste
 *   input.complete    autocomplétion     — à couper en mode kata
 *   delete.backward   retour arrière     — le signal n°1 de lenteur
 *   delete.selection  suppression d'une sélection — geste sain
 *   select.pointer    sélection à la SOURIS — le second signal
 *   move.drop         glisser-déposer de texte
 *   undo / redo       hésitation
 *
 * L'annotation est lue telle quelle, et non par une chaîne de `isUserEvent` du
 * plus précis au plus général : cette chaîne rangeait `delete.forward` sous
 * `delete.backward`. Une sélection au clavier produit un `select` qui n'est PAS
 * `select.pointer` — c'est toute la distinction souris/clavier, en une ligne.
 *
 * Tout le reste du produit (score, coach, rejeu) se construit sur ce journal :
 * il ne doit donc rien savoir de l'interface, et surtout ne jamais lever
 * d'exception dans le chemin d'édition.
 */
import { EditorView } from '@codemirror/view';
import { Transaction, type Extension } from '@codemirror/state';

export interface Geste {
  /** millisecondes depuis le début de la session */
  t: number;
  /** annotation userEvent, ou 'inconnu' si la transaction n'en porte pas */
  evenement: string;
  /** caractères insérés / supprimés par cette transaction */
  inserees: number;
  supprimees: number;
}

export interface Mesures {
  enCours: boolean;
  /** millisecondes écoulées depuis le début */
  duree: number;
  frappes: number;
  suppressions: number;
  souris: number;
  collages: number;
  annulations: number;
  /** transactions d'édition */
  editions: number;
  /** caractères insérés + supprimés — c'est le « réel » du score d'efficacité */
  caracteres: number;
  gestes: Geste[];
}

const vide = (): Mesures => ({
  enCours: false,
  duree: 0,
  frappes: 0,
  suppressions: 0,
  souris: 0,
  collages: 0,
  annulations: 0,
  editions: 0,
  caracteres: 0,
  gestes: [],
});

let mesures = vide();
let debut = 0;
// Le kata est-il derriere nous ? Sans ce drapeau, le premier geste posterieur a
// la reussite (relire, cliquer dans le texte) rouvrait une mesure toute neuve :
// les compteurs repartaient a zero pendant que l'ecran affichait encore le
// resultat fige.
let termine = false;
const abonnes = new Set<(m: Mesures) => void>();

function emettre() {
  const instantane: Mesures = { ...mesures, duree: mesures.enCours ? Date.now() - debut : mesures.duree };
  abonnes.forEach((f) => f(instantane));
}

/** S'abonner aux mesures. Renvoie la fonction de désabonnement. */
export function observer(f: (m: Mesures) => void): () => void {
  abonnes.add(f);
  f({ ...mesures, duree: mesures.enCours ? Date.now() - debut : mesures.duree });
  return () => abonnes.delete(f);
}

/**
 * Prepare la mesure suivante SANS lancer le chronometre : c'est le premier geste
 * qui le lance, comme au tout premier kata.
 *
 * Les compteurs sont vides des maintenant -- l'ecran ne doit pas afficher le
 * resultat du kata precedent -- mais le temps passe a lire l'enonce n'est pas
 * compte comme du temps d'edition. Un banc qui mesure le geste ne doit pas
 * facturer la lecture, sinon les chiffres de deux seances ne se comparent plus.
 */
export function armer() {
  mesures = vide();
  debut = 0;
  termine = false;
  emettre();
}

export function arreter() {
  if (!mesures.enCours) return;
  mesures = { ...mesures, enCours: false, duree: Date.now() - debut };
  termine = true;
  emettre();
}

export function lire(): Mesures {
  return { ...mesures, duree: mesures.enCours ? Date.now() - debut : mesures.duree };
}

/**
 * L'extension à ajouter aux extensions de l'éditeur.
 *
 * Le premier geste démarre le chronomètre tout seul : pas de bouton « commencer »,
 * la friction entre deux essais est ce qui tue la répétition. `armer()` remet
 * les compteurs à zéro entre deux katas sans rien démarrer.
 */
export function journalExtension(): Extension {
  return EditorView.updateListener.of((update) => {
    if (!update.transactions.length) return;

    for (const tr of update.transactions) {
      // Une transaction sans effet ni sur le texte ni sur la sélection
      // (reconfiguration, thème, scroll) n'est pas un geste.
      if (!tr.docChanged && !tr.selection) continue;

      // Lecture directe de l'annotation : elle donne le nom exact
      // (`delete.forward` reste `delete.forward`), là où une chaîne de
      // `isUserEvent` du plus précis au plus général finit par tout ranger
      // sous le premier prédicat qui matche.
      const nom = tr.annotation(Transaction.userEvent) ?? (tr.docChanged ? 'inconnu' : '');
      if (!nom) continue; // sélection programmatique : pas un geste

      if (!mesures.enCours) {
        // Rien ne recommence tout seul apres un kata reussi : seul demarrer()
        // ouvre la mesure suivante.
        if (termine) continue;
        mesures = { ...vide(), enCours: true };
        debut = Date.now();
      }

      let inserees = 0;
      let supprimees = 0;
      if (tr.docChanged) {
        tr.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
          supprimees += toA - fromA;
          inserees += inserted.length;
        });
      }

      // Un collage n'est pas une frappe : il est compté à part, sinon il
      // gonflerait le compteur de gestes sans qu'aucun geste ait eu lieu.
      if (nom === 'input.paste') mesures.collages += 1;
      else if (nom.startsWith('input')) mesures.frappes += 1;
      if (nom.startsWith('delete')) mesures.suppressions += 1;
      if (nom === 'select.pointer' || nom.startsWith('move')) mesures.souris += 1;
      if (nom === 'undo' || nom === 'redo') mesures.annulations += 1;
      if (tr.docChanged) {
        mesures.editions += 1;
        // Le « réel » du score : tout caractère brassé compte, y compris celui
        // qu'on insère puis supprime aussitôt.
        mesures.caracteres += inserees + supprimees;
      }

      mesures.gestes.push({ t: Date.now() - debut, evenement: nom, inserees, supprimees });
    }

    emettre();
  });
}
