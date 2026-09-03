/**
 * Le vrai editeur, monte dans un DOM, pilote au clavier.
 *
 * Les autres harnais appellent les commandes directement. Celui-ci envoie un
 * evenement clavier a la vue et regarde ce que le document devient : c'est le
 * seul moyen de verifier ce qui compte vraiment -- la PRECEDENCE. Une liaison
 * peut exister et perdre quand meme contre defaultKeymap ou contre le
 * navigateur, et aucun test de commande ne le montre.
 */
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><body><div id="hote"></div></body>', { pretendToBeVisual: true });
for (const k of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'Range',
                 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'DOMRect',
                 'MutationObserver', 'KeyboardEvent', 'DOMParser', 'Window', 'Event', 'InputEvent'])
  // defineProperty et non affectation : Node 22 expose `navigator` en lecture seule.
  try { Object.defineProperty(globalThis, k, { value: dom.window[k], configurable: true, writable: true }); }
  catch { /* deja fige, tant pis : CodeMirror n'en a pas besoin */ }
globalThis.window = dom.window;

const { EditorState, EditorSelection } = await import('@codemirror/state');
const { EditorView, drawSelection, keymap, lineNumbers, highlightActiveLine } = await import('@codemirror/view');
const { defaultKeymap, history, historyKeymap } = await import('@codemirror/commands');
const { javascript } = await import('@codemirror/lang-javascript');
const { raccourcisKata } = await import('../src/banc/raccourcis.ts');
const { themeEditeur } = await import('../src/banc/theme.ts');
const { insertBracket } = await import('@codemirror/autocomplete');
const { KATAS } = await import('../src/katas/index.ts');

let ok = 0, ko = 0;
const v = (nom, attendu, obtenu) => {
  const bon = JSON.stringify(attendu) === JSON.stringify(obtenu);
  bon ? ok++ : ko++;
  console.log(`  ${bon ? 'OK  ' : 'ECHEC'} ${nom}`);
  if (!bon) console.log(`        attendu ${JSON.stringify(attendu)}\n        obtenu  ${JSON.stringify(obtenu)}`);
};

/** Monte une vue avec EXACTEMENT les extensions de Editeur.tsx (mode non-vim). */
function monter(doc) {
  const hote = dom.window.document.getElementById('hote');
  hote.innerHTML = '';
  return new EditorView({
    state: EditorState.create({
      doc,
      extensions: [
        raccourcisKata(),
        lineNumbers(),
        highlightActiveLine(),
        EditorState.allowMultipleSelections.of(true),
        drawSelection(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        javascript(),
        // Sans liaison de touche, mais monte quand meme : « exactement les
        // memes extensions » doit rester vrai, sinon la phrase ne vaut rien.
        themeEditeur(),
      ],
    }),
    parent: hote,
  });
}

/** Envoie une vraie touche, et dit si le navigateur aurait garde la main. */
function touche(vue, key, mods = {}) {
  const ev = new dom.window.KeyboardEvent('keydown', {
    key, code: key, bubbles: true, cancelable: true,
    ctrlKey: !!mods.ctrl, shiftKey: !!mods.shift, altKey: !!mods.alt,
  });
  vue.contentDOM.dispatchEvent(ev);
  return ev.defaultPrevented;
}

/** La meme chose, mais sur un element quelconque : le panneau de recherche
 *  ecoute sur SON div, pas sur le contenu de l'editeur. */
function toucheSur(el, key, mods = {}) {
  const ev = new dom.window.KeyboardEvent('keydown', {
    key, code: key, bubbles: true, cancelable: true,
    ctrlKey: !!mods.ctrl, shiftKey: !!mods.shift, altKey: !!mods.alt,
  });
  el.dispatchEvent(ev);
  return ev.defaultPrevented;
}

/** Ce que fait l'utilisateur : il tape dans un champ. Le panneau se met a jour
 *  sur keyup, pas sur une affectation de `.value`. */
function saisir(champ, texte) {
  champ.focus();
  champ.value = texte;
  champ.dispatchEvent(new dom.window.KeyboardEvent('keyup', { bubbles: true }));
}

const kata = (id) => KATAS.find((k) => k.id === id);

// --- Tab indente le bloc selectionne ---------------------------------------
{
  const k = kata('indenter');
  const vue = monter(k.depart);
  const d = vue.state.doc;
  vue.dispatch({ selection: EditorSelection.range(d.line(2).from, d.line(4).to) });
  const annule = touche(vue, 'Tab');
  v('Tab est bien capture par l’editeur', true, annule);
  v(`« ${k.titre} » : Tab atteint la cible`, k.cible, vue.state.doc.toString());
  vue.destroy();
}

// --- Ctrl+J joint -----------------------------------------------------------
{
  const k = kata('joindre');
  const vue = monter(k.depart);
  vue.dispatch({ selection: EditorSelection.cursor(0) });
  const annule = touche(vue, 'j', { ctrl: true });
  v('Ctrl+J est repris au navigateur', true, annule);
  touche(vue, 'j', { ctrl: true });
  v(`« ${k.titre} » : Ctrl+J deux fois atteint la cible`, k.cible, vue.state.doc.toString());
  vue.destroy();
}

// --- Ctrl+Maj+K et Ctrl+Alt+bas -------------------------------------------
// deleteLine et addCursorBelow passent par coordsAtPos, donc par une vraie mise
// en page : jsdom n'implemente pas Range.getClientRects et les fait echouer.
// Les declarer non couverts vaut mieux que de les laisser echouer pour toujours,
// ce qui apprend a ignorer la suite. Ce qui les bloquait vraiment --
// allowMultipleSelections -- est prouve ci-dessous par Ctrl+D.
const NON_COUVERTS = ['Ctrl+Maj+K (deleteLine)', 'Ctrl+Alt+bas (addCursorBelow)'];

// --- Ctrl+D selectionne l'occurrence suivante -------------------------------
{
  const vue = monter('res = res + res;');
  vue.dispatch({ selection: EditorSelection.range(0, 3) });
  const annule = touche(vue, 'd', { ctrl: true });
  v('Ctrl+D est repris au navigateur', true, annule);
  v('Ctrl+D pose un second curseur', 2, vue.state.selection.ranges.length);
  vue.destroy();
}

// --- entourer une selection d'un guillemet ----------------------------------
{
  const vue = monter('const cles = [nom];');
  vue.dispatch({ selection: EditorSelection.range(14, 17) });
  // closeBrackets agit sur la SAISIE, pas sur un remplacement programmatique :
  // c'est insertBracket qu'il faut appeler pour reproduire une frappe.
  const tr = insertBracket(vue.state, "'");
  if (tr) vue.dispatch(tr);
  const obtenu = vue.state.doc.toString();
  v('taper un guillemet sur une selection l’entoure', "const cles = ['nom'];", obtenu);
  vue.destroy();
}

// --- le kata du remplacement, AU CLAVIER SEUL --------------------------------
// Le test qui manquait. Les commandes existaient et la cible etait atteignable,
// mais le seul chemin depuis le clavier passait par six tabulations et un clic :
// le kata se terminait a la souris, que le banc penalise. On refait donc ici la
// suite exacte que l'indice annonce, touche par touche.
{
  const k = kata('remplacer');
  const vue = monter(k.depart);

  const annule = touche(vue, 'h', { ctrl: true });
  const panneau = vue.dom.querySelector('.cm-search');
  v('Ctrl+H est repris au navigateur', true, annule);
  v('Ctrl+H ouvre le panneau de remplacement', true, !!panneau);

  const champ = (n) => panneau.querySelector(`input[name="${n}"]`);
  saisir(champ('search'), 'old.example.com');

  // Le point de blocage : sans liaison, Tab s'arretait sur le bouton « next ».
  toucheSur(panneau, 'Tab');
  v('Tab mene du champ Find au champ Replace',
    'replace', dom.window.document.activeElement?.name);

  saisir(champ('replace'), 'api.example.com');

  const prisEnCompte = toucheSur(panneau, 'Enter', { ctrl: true, alt: true });
  v('Ctrl+Alt+Entree est pris en compte par le panneau', true, prisEnCompte);
  v(`« ${k.titre} » : le kata se resout au clavier seul`, k.cible, vue.state.doc.toString());

  // Maj+Tab revient, pour corriger la recherche sans lacher le clavier.
  toucheSur(panneau, 'Tab', { shift: true });
  v('Maj+Tab ramene au champ Find', 'search', dom.window.document.activeElement?.name);

  vue.destroy();
}

console.log('\n  gestes exigeant une vraie mise en page, non couverts ici :');
for (const g of NON_COUVERTS) console.log(`    ${g}`);

console.log(`\n  ${ok} verifications passees, ${ko} echec(s)`);
process.exit(ko ? 1 : 0);
