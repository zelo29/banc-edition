/**
 * Le kata est-il resoluble par le geste qu'il annonce ?
 *
 * C'est la verification qui manquait, et son absence avait laisse passer six
 * katas nommant un raccourci que l'editeur ne connaissait pas. On applique ici
 * la commande elle-meme, et on exige la cible AU CARACTERE PRES.
 *
 * Les commandes qui exigent une vraie vue (deleteLine, addCursorBelow, qui
 * appellent view.moveVertically) ne sont pas testables ici : elles sont notees
 * comme telles plutot que passees sous silence.
 */
import { EditorSelection, EditorState } from '@codemirror/state';
import { indentMore, moveLineDown, copyLineDown } from '@codemirror/commands';
import { SearchQuery, replaceAll, search, searchKeymap, setSearchQuery } from '@codemirror/search';
import { gestesKata, gestesPanneau, joindreLignes } from '../src/banc/raccourcis.ts';
import { KATAS } from '../src/katas/index.ts';

let ok = 0, ko = 0;
const v = (nom, attendu, obtenu) => {
  const bon = JSON.stringify(attendu) === JSON.stringify(obtenu);
  bon ? ok++ : ko++;
  console.log(`  ${bon ? 'OK  ' : 'ECHEC'} ${nom}`);
  if (!bon) console.log(`        attendu ${JSON.stringify(attendu)}\n        obtenu  ${JSON.stringify(obtenu)}`);
};

const kata = (id) => KATAS.find((k) => k.id === id);

/** Applique une suite de commandes a un etat, et rend le document obtenu. */
function jouer(depart, selection, ...commandes) {
  let etat = EditorState.create({ doc: depart, selection });
  for (const cmd of commandes) {
    cmd({ state: etat, dispatch: (tr) => { etat = tr.state; } });
  }
  return etat.doc.toString();
}

// --- joindreLignes, ecrit a la main : CodeMirror n'a pas de joinLines --------
v('joint deux lignes avec une espace', 'a b',
  jouer('a\nb', EditorSelection.cursor(0), joindreLignes));
v('avale l’indentation de la ligne avalee', 'const a = 1;',
  jouer('const a =\n      1;', EditorSelection.cursor(0), joindreLignes));
v('pas d’espace fabriquee sur une ligne vide', 'a',
  jouer('a\n', EditorSelection.cursor(0), joindreLignes));
v('sur la derniere ligne, ne fait rien', 'a\nb',
  jouer('a\nb', EditorSelection.cursor(3), joindreLignes));

// --- chaque kata atteint sa cible par son geste ------------------------------
{
  const k = kata('joindre');
  v(`« ${k.titre} » : Ctrl+J deux fois atteint la cible`, k.cible,
    jouer(k.depart, EditorSelection.cursor(0), joindreLignes, joindreLignes));
}
{
  const k = kata('deplacer');
  // curseur sur la ligne 2, celle qui doit descendre
  const etat = EditorState.create({ doc: k.depart });
  v(`« ${k.titre} » : Alt+↓ atteint la cible`, k.cible,
    jouer(k.depart, EditorSelection.cursor(etat.doc.line(2).from), moveLineDown));
}
{
  const k = kata('indenter');
  const d = EditorState.create({ doc: k.depart }).doc;
  v(`« ${k.titre} » : Tab sur la selection atteint la cible`, k.cible,
    jouer(k.depart, EditorSelection.range(d.line(2).from, d.line(4).to), indentMore));
}
{
  // Dupliquer ne suffit pas seul (il faut ensuite editer les copies), mais le
  // geste doit au moins produire les trois lignes.
  const k = kata('dupliquer');
  const d = EditorState.create({ doc: k.depart }).doc;
  const obtenu = jouer(k.depart, EditorSelection.cursor(d.line(2).from), copyLineDown, copyLineDown);
  v(`« ${k.titre} » : Maj+Alt+↓ produit bien trois routes`, 3,
    obtenu.split('\n').filter((l) => l.includes('chemin')).length);
}

{
  // Le kata du remplacement. Il annoncait « Ctrl+H » et s'arretait la : le
  // panneau s'ouvrait, mais aucune touche n'y menait a « remplacer tout ».
  // On verifie ici les DEUX moities -- que la commande atteint la cible, et
  // qu'une touche la declenche.
  const k = kata('remplacer');
  let etat = EditorState.create({ doc: k.depart, extensions: [search()] });
  etat = etat.update({
    effects: setSearchQuery.of(
      new SearchQuery({ search: 'old.example.com', replace: 'api.example.com' }),
    ),
  }).state;
  // `replaceAll` passe une SPEC a dispatch (`view.dispatch({changes, ...})`),
  // la ou les commandes de `jouer` passent une transaction deja construite.
  // Le faux dispatch doit accepter les deux, sinon `tr.state` est undefined.
  replaceAll({
    state: etat,
    dispatch: (x) => { etat = x.state ?? etat.update(x).state; },
  });
  v(`« ${k.titre} » : replaceAll atteint la cible`, k.cible, etat.doc.toString());
}

// --- les touches annoncees existent-elles vraiment ? -------------------------
// La verification qui manquait a l'origine, etendue aux etapes. Une etape nomme
// une touche EN FRANCAIS, CodeMirror la nomme autrement : cette table est le
// prix a payer pour que « Ctrl+Alt+Entree » soit verifiable et pas seulement
// affiche. La laisser incomplete fait echouer le test, jamais passer en silence.
const EN_CODEMIRROR = {
  'Ctrl+H': 'Mod-h',
  'Ctrl+D': 'Mod-d',
  'Ctrl+J': 'Mod-j',
  'Tab': 'Tab',
  'Ctrl+Alt+Entrée': 'Mod-Alt-Enter',
  'Échap': 'Escape',
};
const TOUTES_LIAISONS = [...gestesKata, ...gestesPanneau, ...searchKeymap];

for (const k of KATAS.filter((k) => k.etapes)) {
  for (const etape of k.etapes) {
    const attendue = EN_CODEMIRROR[etape.touche];
    v(`« ${k.titre} » : la touche ${etape.touche} est liee`, true,
      !!attendue && TOUTES_LIAISONS.some((b) => b.key === attendue));
  }
}

console.log('\n  gestes exigeant une vraie vue, non couverts ici :');
console.log('    Ctrl+Maj+K (deleteLine) et Ctrl+Alt+↓ (addCursorBelow)');

console.log(`\n  ${ok} verifications passees, ${ko} echec(s)`);
process.exit(ko ? 1 : 0);
