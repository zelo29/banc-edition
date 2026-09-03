/**
 * L'habillage de l'éditeur — et deux promesses qui n'étaient pas tenues.
 *
 * **Le curseur invisible.** CodeMirror sans thème se croit en clair : il pose
 * `cm-light` et son thème de base peint le curseur en `solid black` et la
 * sélection en `#d7d4f0`. Sur le fond sombre du banc, ça donne un curseur qu'on
 * ne voit pas et une sélection quasi blanche sous un texte quasi blanc — sur un
 * banc dont deux katas (`Ctrl+D`, `Ctrl+Alt+↓`) ne consistent qu'à regarder où
 * sont ses curseurs. Aucune règle CSS de `style.css` ne pouvait le rattraper :
 * ces couleurs sont injectées en JavaScript, et leurs sélecteurs sont plus
 * spécifiques. D'où les sélecteurs recopiés à l'identique ci-dessous — à
 * spécificité égale, c'est le thème monté en dernier qui gagne, et c'est nous.
 *
 * **La coloration annoncée.** `langages.ts` dit « lire du SQL en noir et blanc
 * n'entraîne pas la même chose que lire du SQL dans un éditeur », et rien ne
 * colorait quoi que ce soit : `javascript()` fournit l'arbre, mais sans
 * `syntaxHighlighting` personne ne le peint. On lisait bien du noir et blanc.
 *
 * Les couleurs viennent de `style.css` par variables, et non d'un thème figé :
 * une seule palette pour l'écran et pour le code, qui suit clair et sombre sans
 * qu'on ait deux endroits à tenir.
 */
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import type { Extension } from '@codemirror/state';

/**
 * Le mode réellement appliqué, calculé comme la feuille de style le fait :
 * sombre par défaut, clair seulement si le système le demande et qu'aucun
 * `data-theme` ne l'a forcé.
 *
 * Il ne sert qu'aux quelques règles `&dark` qu'on ne redéfinit pas ici
 * (crochets appariés, caractères spéciaux, panneaux) : tout le reste passe par
 * les variables et suit le changement de mode tout seul.
 */
function sombre(): boolean {
  if (typeof document === 'undefined') return true;
  const force = document.documentElement.dataset.theme;
  if (force === 'dark') return true;
  if (force === 'light') return false;
  return !window.matchMedia?.('(prefers-color-scheme: light)').matches;
}

const coloration = HighlightStyle.define([
  { tag: [t.comment, t.lineComment, t.blockComment], color: 'var(--code-commentaire)', fontStyle: 'italic' },
  { tag: [t.keyword, t.modifier, t.controlKeyword, t.moduleKeyword, t.self], color: 'var(--code-mot)' },
  { tag: [t.string, t.special(t.string), t.regexp], color: 'var(--code-chaine)' },
  { tag: [t.number, t.bool, t.null, t.atom, t.unit], color: 'var(--code-nombre)' },
  {
    tag: [t.function(t.variableName), t.function(t.propertyName), t.definition(t.variableName), t.labelName],
    color: 'var(--code-nom)',
  },
  { tag: [t.typeName, t.className, t.tagName, t.namespace, t.standard(t.variableName)], color: 'var(--code-type)' },
  { tag: [t.propertyName, t.attributeName], color: 'var(--code-propriete)' },
  { tag: [t.operator, t.punctuation, t.separator, t.bracket, t.derefOperator], color: 'var(--code-signe)' },
  { tag: [t.meta, t.processingInstruction, t.documentMeta], color: 'var(--code-commentaire)' },
  { tag: t.invalid, color: 'var(--alerte)' },
]);

/**
 * Les sélecteurs sont ceux du thème de base, mot pour mot : `.cm-cursor` seul
 * perdrait contre `&light .cm-cursor`, et une sélection écrite court perdrait
 * contre les six classes de `&light.cm-focused > .cm-scroller > …`.
 */
function habillage(hauteur: string) {
  return EditorView.theme(
    {
      '&': { fontSize: '14px', height: hauteur, maxHeight: '100%', backgroundColor: 'transparent', color: 'var(--encre)' },
      // Pas de `lineHeight` ici : CodeMirror calcule la hauteur des cases de
      // la gouttiere a partir de la sienne, et un interligne impose au scroller
      // decale les numeros de ligne du code qu'ils numerotent.
      '.cm-scroller': { fontFamily: 'var(--mono)' },
      '.cm-content': { caretColor: 'var(--accent)' },

      // Un curseur de 2px et non de 1,2px : à cette taille de police, un trait
      // fin sur fond sombre se perd dans le rendu sous-pixel.
      '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--accent)', borderLeftWidth: '2px' },
      // Le curseur secondaire du multi-curseur doit se distinguer du principal,
      // sinon on ne sait pas d'où partira la frappe.
      '.cm-cursor-secondary': { borderLeftColor: 'color-mix(in srgb, var(--accent) 55%, transparent)' },

      '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
        { background: 'color-mix(in srgb, var(--accent) 32%, transparent)' },

      '.cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--accent) 8%, transparent)' },
      '.cm-gutters': { backgroundColor: 'transparent', color: 'var(--faible)', borderRight: '1px solid var(--trait)' },
      '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--accent)' },
      '.cm-matchingBracket, .cm-nonmatchingBracket': {
        backgroundColor: 'color-mix(in srgb, var(--accent) 22%, transparent)',
        outline: 'none',
      },
    },
    { dark: sombre() },
  );
}

/** L'éditeur d'un kata : il occupe tout son volet. */
export function themeEditeur(): Extension {
  return [habillage('100%'), syntaxHighlighting(coloration)];
}

/**
 * Le code qu'on lit : il prend la hauteur de ce qu'il contient, pas celle de
 * son volet. Trois lignes de bash n'ont aucune raison d'occuper la moitié de
 * l'écran pendant que la question se serre en bas.
 */
export function themeLecture(): Extension {
  return [habillage('auto'), syntaxHighlighting(coloration)];
}
