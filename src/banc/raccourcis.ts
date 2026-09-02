/**
 * Les gestes que les katas nomment — et qui doivent donc exister.
 *
 * CodeMirror n'est pas VS Code. Il fournit `moveLineDown`, `deleteLine` ou
 * `addCursorBelow`, mais rien pour Ctrl+D, Ctrl+J, Ctrl+H ni Tab sur une
 * sélection. Un kata qui annonce « Ctrl+J » dans un éditeur qui ignore Ctrl+J
 * n'entraîne rien : il bloque. Ce module rend vrai ce que les katas promettent.
 *
 * Chaque liaison porte `preventDefault` : sans lui, le navigateur garde la main
 * et Ctrl+J ouvre le panneau des téléchargements de Firefox par-dessus le kata.
 * Firefox laisse le contenu annuler ces raccourcis-là — mais PAS ceux des
 * outils de développement (Ctrl+Maj+K, Ctrl+Maj+I, F12), qui sont traités par
 * le navigateur lui-même, hors de portée de la page.
 *
 * Ces liaisons ne sont posées qu'en mode non-vim. En vim, joindre c'est `J`,
 * supprimer une ligne c'est `dd` : lui voler Ctrl+D (défilement) pour y mettre
 * un geste VS Code casserait le mode sans rien apprendre.
 */
import { EditorSelection, Prec, type ChangeSpec, type Extension } from '@codemirror/state';
import { keymap, type Command, type EditorView, type KeyBinding } from '@codemirror/view';
import { deleteLine, indentWithTab, selectParentSyntax } from '@codemirror/commands';
import { openSearchPanel, replaceAll, search, searchKeymap, selectNextOccurrence } from '@codemirror/search';
// closeBrackets vit dans le paquet autocomplete mais n'est PAS de
// l'autocomplétion : il entoure une sélection quand on tape un guillemet ou une
// parenthèse. L'autocomplétion, elle, reste absente — `input.complete` n'est pas
// une frappe et entraînerait le mauvais geste.
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';

/**
 * Ctrl+J — réunit la ligne suivante à la courante.
 *
 * Absent de CodeMirror, écrit ici. L'indentation de la ligne avalée disparaît :
 * joindre « const message = » et « 'bonjour' » doit donner
 * « const message = 'bonjour' », pas « const message =   'bonjour' ».
 */
export const joindreLignes: Command = (vue) => {
  const etat = vue.state;
  const changements: ChangeSpec[] = [];

  for (const plage of etat.selection.ranges) {
    const premiere = etat.doc.lineAt(plage.from);
    const derniere = etat.doc.lineAt(plage.to);
    // Curseur seul : on joint la ligne d'en dessous, comme VS Code.
    const fin =
      premiere.number === derniere.number
        ? Math.min(derniere.number + 1, etat.doc.lines)
        : derniere.number;

    for (let n = premiere.number; n < fin; n++) {
      const courante = etat.doc.line(n);
      const suivante = etat.doc.line(n + 1);
      const indentation = /^[ \t]*/.exec(suivante.text)![0].length;
      // Une espace de jointure, sauf si l'une des deux lignes est vide : on ne
      // fabrique pas d'espace en fin de ligne à partir de rien.
      const colle = courante.text.trim() && suivante.text.trim() ? ' ' : '';
      changements.push({ from: courante.to, to: suivante.from + indentation, insert: colle });
    }
  }

  if (!changements.length) return false;
  vue.dispatch(
    etat.update({
      changes: changements,
      selection: EditorSelection.cursor(
        etat.doc.lineAt(etat.selection.main.from).to,
      ),
      userEvent: 'input.joindre',
    }),
  );
  return true;
};

/**
 * Le panneau de recherche, lui, a son propre jeu de touches — et il était vide.
 *
 * Ctrl+H ouvrait bien le panneau, mais RIEN n'y menait à « remplacer tout » au
 * clavier : `searchKeymap` ne lie ni `replaceAll` ni `replaceNext`, et l'ordre
 * du DOM place trois boutons et trois cases à cocher entre le champ « Find » et
 * le champ « Replace » — six tabulations pour traverser. Le kata annonçait donc
 * un geste qu'il fallait finir à la souris, alors même que le banc compte et
 * pénalise chaque `select.pointer`. Un kata qui punit le seul chemin qu'il
 * laisse ouvert n'entraîne pas : il décourage.
 *
 * `SearchPanel.keydown` appelle `runScopeHandlers(view, e, "search-panel")`
 * avant toute chose : c'est le point d'extension prévu, et `scope` est ce qui
 * fait qu'une liaison y est consultée — sans lui elle vaut pour l'éditeur, où
 * le panneau n'a pas le focus. Inutile d'y mettre `preventDefault` : le panneau
 * s'en charge dès qu'un gestionnaire a répondu oui.
 */

/** Un champ du panneau de recherche, par son attribut `name`. */
const champPanneau = (vue: EditorView, nom: string) =>
  vue.dom.querySelector<HTMLInputElement>(`.cm-search input[name="${nom}"]`);

/**
 * Tab — de « Find » à « Replace », comme dans VS Code.
 *
 * Rend `false` partout ailleurs : le Tab natif reprend alors la main et sort du
 * panneau normalement, boutons compris. On ne retire donc l'accès clavier à
 * rien, on ajoute seulement le chemin court.
 */
export const auChampRemplacer: Command = (vue) => {
  const remplacer = champPanneau(vue, 'replace');
  if (!remplacer || document.activeElement !== champPanneau(vue, 'search')) return false;
  remplacer.focus();
  remplacer.select();
  return true;
};

/** Maj+Tab — le retour. */
export const auChampRecherche: Command = (vue) => {
  const recherche = champPanneau(vue, 'search');
  if (!recherche || document.activeElement !== champPanneau(vue, 'replace')) return false;
  recherche.focus();
  recherche.select();
  return true;
};

/** Les gestes qui n'existent que panneau de recherche ouvert. */
export const gestesPanneau: KeyBinding[] = [
  // Le raccourci de VS Code, au caractère près. Entrée seule remplace UNE
  // occurrence (c'est déjà le comportement natif du champ) : la différence
  // entre les deux est exactement ce que le kata enseigne.
  { key: 'Mod-Alt-Enter', run: replaceAll, scope: 'search-panel' },
  { key: 'Tab', run: auChampRemplacer, scope: 'search-panel' },
  { key: 'Shift-Tab', run: auChampRecherche, scope: 'search-panel' },
];

/** Les gestes des katas, dans la forme que VS Code leur donne. */
export const gestesKata: KeyBinding[] = [
  { key: 'Mod-d', run: selectNextOccurrence, preventDefault: true },
  { key: 'Mod-Shift-k', run: deleteLine, preventDefault: true },
  { key: 'Mod-j', run: joindreLignes, preventDefault: true },
  { key: 'Shift-Alt-ArrowRight', run: selectParentSyntax, preventDefault: true },
  { key: 'Mod-h', run: openSearchPanel, preventDefault: true },
  { key: 'Mod-f', run: openSearchPanel, preventDefault: true },
  // Tab indente le bloc sélectionné, Maj+Tab le désindente.
  indentWithTab,
];

/**
 * L'extension complète. `Prec.highest` pour passer devant `defaultKeymap`, qui
 * lie déjà Mod-Alt-\ et Shift-Mod-\ et gagnerait sinon sur Tab.
 */
export function raccourcisKata(): Extension {
  return [
    search({ top: true }),
    closeBrackets(),
    // searchKeymap apporte Échap pour refermer le panneau de recherche. Il est
    // à précédence normale : les gestes des katas passent devant.
    keymap.of(searchKeymap),
    Prec.highest(keymap.of([...closeBracketsKeymap, ...gestesKata, ...gestesPanneau])),
  ];
}

/**
 * Les touches que Firefox s'approprie et qui appartiennent au kata : Ctrl+D
 * (marque-page), Ctrl+J (téléchargements), Ctrl+H (historique), Ctrl+F
 * (recherche), Ctrl+K (barre d'adresse), Ctrl+S, Ctrl+P, Ctrl+U.
 *
 * CodeMirror annule déjà celles qu'il lie, mais seulement quand l'éditeur a le
 * focus. Cette liste couvre le reste de la page.
 *
 * Ni Ctrl+C/V/X/A/Z ni Ctrl+Maj+quoi que ce soit : les premières appartiennent
 * à l'utilisateur, les secondes au navigateur, qui ne les rendra pas.
 */
export const TOUCHES_VOLEES = new Set(['d', 'j', 'h', 'f', 'k', 's', 'p', 'u', 'g']);
