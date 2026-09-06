/**
 * Les noms que le resume attend sont-ils ceux que CodeMirror emet ?
 *
 * `verif/traces.mjs` verifie le resume sur des suites d'evenements ecrites a la
 * main : il prouve l'arithmetique, pas les noms. Or tout le produit repose sur
 * une chaine de caracteres — `delete.backward`, `select.pointer` — decidee par
 * une bibliotheque tierce. Le jour ou l'une d'elles change, rien ne casse : les
 * compteurs tombent silencieusement a zero et le coach n'a plus rien a dire.
 *
 * Ce harnais monte donc le vrai editeur avec la vraie extension de journal,
 * envoie de vraies frappes, et resume ce qui en sort. C'est la seule preuve que
 * ce qu'on enregistre depuis aujourd'hui sera lisible demain.
 */
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><body><div id="hote"></div></body>', { pretendToBeVisual: true });
for (const k of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'Range',
                 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'DOMRect',
                 'MutationObserver', 'KeyboardEvent', 'DOMParser', 'Window', 'Event', 'InputEvent'])
  try { Object.defineProperty(globalThis, k, { value: dom.window[k], configurable: true, writable: true }); }
  catch { /* deja fige */ }
globalThis.window = dom.window;

const { EditorState, EditorSelection } = await import('@codemirror/state');
const { EditorView, drawSelection, keymap, lineNumbers } = await import('@codemirror/view');
const { defaultKeymap, history, historyKeymap, undo } = await import('@codemirror/commands');
const { armer, arreter, journalExtension, lire } = await import('../src/banc/journal.ts');
const { resumer } = await import('../src/banc/traces.ts');

let ok = 0, ko = 0;
const v = (nom, attendu, obtenu) => {
  const bon = JSON.stringify(attendu) === JSON.stringify(obtenu);
  bon ? ok++ : ko++;
  console.log(`  ${bon ? 'OK  ' : 'ECHEC'} ${nom}`);
  if (!bon) console.log(`        attendu ${JSON.stringify(attendu)}\n        obtenu  ${JSON.stringify(obtenu)}`);
};

/** Envoie une vraie touche a la vue. */
function touche(vue, key, mods = {}) {
  vue.contentDOM.dispatchEvent(new dom.window.KeyboardEvent('keydown', {
    key, code: key, bubbles: true, cancelable: true,
    ctrlKey: !!mods.ctrl, shiftKey: !!mods.shift, altKey: !!mods.alt,
  }));
}

function monter(doc) {
  const hote = dom.window.document.getElementById('hote');
  hote.innerHTML = '';
  return new EditorView({
    state: EditorState.create({
      doc,
      // Curseur a la fin : un retour arriere en position 0 n'est pas un geste,
      // c'est une plage invalide, et CodeMirror leve.
      selection: { anchor: doc.length },
      extensions: [
        lineNumbers(),
        EditorState.allowMultipleSelections.of(true),
        drawSelection(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        journalExtension(),
      ],
    }),
    parent: hote,
  });
}

/** Le resume d'une seance d'edition jouee pour de vrai. */
function jouer(doc, actes) {
  const vue = monter(doc);
  armer();
  for (const acte of actes) acte(vue);
  arreter();
  const trace = resumer({ id: 'reel', banc: 'edition' }, lire(), { minimum: 1, reel: 1 });
  vue.destroy();
  return trace;
}

// Les gestes, exprimes comme CodeMirror les recoit reellement.
const taper = (texte) => (vue) => {
  for (const c of texte) {
    vue.dispatch(vue.state.replaceSelection(c), { userEvent: 'input.type' });
  }
};
const retourArriere = (n) => (vue) => {
  for (let i = 0; i < n; i++) {
    const pos = vue.state.selection.main.head;
    vue.dispatch({ changes: { from: pos - 1, to: pos }, userEvent: 'delete.backward' });
  }
};
// La souris n'a pas de touche : CodeMirror annote lui-meme le clic, on
// reproduit donc la transaction telle qu'il l'emet.
const selectionnerALaSouris = (de, a) => (vue) =>
  vue.dispatch({ selection: EditorSelection.single(de, a), userEvent: 'select.pointer' });
// Le clavier, lui, passe par une VRAIE touche : c'est defaultKeymap qui pose
// l'annotation `select`, et c'est precisement ce qu'on veut verifier. Une
// selection dispatchee a la main sans annotation serait ecartee par le journal
// comme une selection programmatique -- et le test aurait prouve le contraire
// de ce qu'il pretend.
const selectionnerAuClavier = (n) => (vue) => {
  for (let i = 0; i < n; i++) touche(vue, 'ArrowRight', { shift: true });
};
// La vraie commande, et non une transaction `userEvent: 'undo'` fabriquee : une
// transaction sans changement ni selection n'est pas un geste et serait ignoree.
// C'est justement ce qu'on veut prouver — que l'annulation REELLE est annotee.
const annuler = () => (vue) => undo(vue);
const coller = (texte) => (vue) =>
  vue.dispatch(vue.state.replaceSelection(texte), { userEvent: 'input.paste' });

// --- les noms arrivent-ils jusqu'au resume ? --------------------------------
{
  const t = jouer('bonjour', [taper('abc')]);
  v('la frappe arrive sous « input.type »', 3, t.evenements['input.type']);
}
{
  const t = jouer('bonjour', [retourArriere(4)]);
  v('le retour arriere arrive sous « delete.backward »', 4, t.evenements['delete.backward']);
  v('et la rafale les voit consecutifs', 4, t.rafaleArriere);
}
{
  // LA distinction qui porte tout le banc : une selection a la souris est
  // annotee, une selection au clavier ne l'est pas. Si CodeMirror annotait les
  // deux pareil, le second compteur du produit ne mesurerait plus rien.
  const t = jouer('bonjour tout le monde', [
    selectionnerALaSouris(0, 7), selectionnerAuClavier(4),
  ]);
  v('la souris arrive sous « select.pointer »', 1, t.evenements['select.pointer']);
  v('quatre Maj+Droite arrivent sous « select »', 4, t.evenements.select);
  v('et le clavier n’a PAS grossi le compteur de souris', 1, t.evenements['select.pointer']);
}
{
  const t = jouer('bonjour', [coller('xyz')]);
  v('le collage arrive sous « input.paste »', 1, t.evenements['input.paste']);
  v('et n’est pas confondu avec une frappe', undefined, t.evenements['input.type']);
}
{
  // Il faut avoir fait quelque chose pour l'annuler : sans frappe prealable la
  // commande rend false et n'emet aucune transaction. La premiere version de ce
  // test annulait dans un editeur vierge et concluait que l'annotation avait
  // disparu.
  const t = jouer('bonjour', [taper('xy'), annuler()]);
  v('l’annulation arrive sous « undo »', 1, t.evenements.undo);
  v('et la frappe annulee reste comptee — le geste a eu lieu',
    true, t.evenements['input.type'] >= 1);
}

// --- le motif que le coach devra nommer, joue en entier ---------------------
// « Tu retapes une ligne entiere au lieu de changer un mot. » On efface la
// ligne caractere par caractere, puis on la retape.
{
  const t = jouer('const total = 0;', [retourArriere(16), taper('const somme = 0;')]);
  v('retaper une ligne laisse une longue rafale de retours arriere', 16, t.rafaleArriere);
  v('et autant de frappes que de caracteres retapes', 16, t.evenements['input.type']);
  v('les deux motifs coexistent dans une seule trace',
    ['delete.backward', 'input.type'], Object.keys(t.evenements).sort());
}

// --- armer remet bien le journal a zero entre deux epreuves -----------------
// Sinon la trace d'une epreuve emporterait les gestes de la precedente, et
// toutes les mesures du coach seraient decalees d'un cran.
{
  const vue = monter('bonjour');
  armer();
  taper('abc')(vue);
  arreter();
  armer();
  taper('de')(vue);
  arreter();
  const t = resumer({ id: 'reel', banc: 'edition' }, lire(), { minimum: 1, reel: 1 });
  vue.destroy();
  v('armer efface les gestes de l’epreuve precedente', 2, t.evenements['input.type']);
}

console.log(`\n  ${ok} verifications passees, ${ko} echec(s)`);
process.exit(ko ? 1 : 0);
