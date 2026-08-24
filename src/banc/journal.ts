/**
 * Banc d'édition — étape 1 : le journal des gestes.
 *
 * On n'intercepte AUCUNE touche. CodeMirror annote déjà chaque transaction avec
 * sa cause (`Transaction.userEvent`), et on la lit avec `tr.isUserEvent(...)` :
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
 * Les noms sont hiérarchiques : `isUserEvent("delete")` attrape aussi
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
  /** transactions d'édition — c'est le « réel » du score d'efficacité */
  editions: number;
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
  gestes: [],
});

let mesures = vide();
let debut = 0;
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

export function demarrer() {
  mesures = { ...vide(), enCours: true };
  debut = Date.now();
  emettre();
}

export function arreter() {
  if (!mesures.enCours) return;
  mesures = { ...mesures, enCours: false, duree: Date.now() - debut };
  emettre();
}

export function lire(): Mesures {
  return { ...mesures, duree: mesures.enCours ? Date.now() - debut : mesures.duree };
}

/**
 * L'extension à ajouter aux extensions de l'éditeur.
 *
 * Le premier geste démarre le chronomètre tout seul : pas de bouton « commencer »,
 * la friction entre deux essais est ce qui tue la répétition.
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
      if (tr.docChanged) mesures.editions += 1;

      mesures.gestes.push({ t: Date.now() - debut, evenement: nom, inserees, supprimees });
    }

    emettre();
  });
}
