const { EditorState, Transaction, EditorSelection } = require('@codemirror/state');

let ok = 0, ko = 0;
const v = (nom, attendu, obtenu) => {
  const bon = JSON.stringify(attendu) === JSON.stringify(obtenu);
  bon ? ok++ : ko++;
  console.log(`  ${bon ? 'OK  ' : 'ECHEC'} ${nom}${bon ? '' : `  attendu ${JSON.stringify(attendu)}, obtenu ${JSON.stringify(obtenu)}`}`);
};

let etat = EditorState.create({ doc: 'const a = 1;\nconst b = 2;\n' });

// 1. l'annotation est bien lisible telle quelle
const frappe = etat.update({ changes: { from: 12, insert: 'x' }, userEvent: 'input.type' });
v("input.type se relit exactement", 'input.type', frappe.annotation(Transaction.userEvent));

// 2. delete.forward n'est PAS confondu avec delete.backward
const supprAvant = etat.update({ changes: { from: 0, to: 1 }, userEvent: 'delete.forward' });
v("delete.forward garde son nom", 'delete.forward', supprAvant.annotation(Transaction.userEvent));

// 3. hiérarchie : isUserEvent('delete') attrape bien delete.forward
v("isUserEvent('delete') attrape delete.forward", true, supprAvant.isUserEvent('delete'));

// 4. souris : select.pointer vs sélection clavier
const souris = etat.update({ selection: EditorSelection.single(3, 8), userEvent: 'select.pointer' });
const clavier = etat.update({ selection: EditorSelection.single(3, 8), userEvent: 'select' });
v("select.pointer identifie la souris", 'select.pointer', souris.annotation(Transaction.userEvent));
v("sélection clavier n'est pas 'pointer'", false, clavier.isUserEvent('select.pointer'));

// 5. une transaction programmatique n'a AUCUNE annotation -> ignorée
const programmatique = etat.update({ selection: EditorSelection.single(0) });
v("transaction programmatique sans annotation", undefined, programmatique.annotation(Transaction.userEvent));

// 6. comptage des caractères par iterChanges
const remplace = etat.update({ changes: { from: 0, to: 5, insert: 'let' }, userEvent: 'input.type' });
let ins = 0, sup = 0;
remplace.changes.iterChanges((fA, tA, fB, tB, inserted) => { sup += tA - fA; ins += inserted.length; });
v("iterChanges compte 5 supprimés / 3 insérés", [5, 3], [sup, ins]);

// 7. collage volumineux : un seul geste, beaucoup de caractères
const collage = etat.update({ changes: { from: 0, insert: 'A'.repeat(200) }, userEvent: 'input.paste' });
let insC = 0;
collage.changes.iterChanges((fA, tA, fB, tB, inserted) => { insC += inserted.length; });
v("collage = 1 transaction, 200 caractères", [1, 200], [1, insC]);

console.log(`\n  ${ok} vérifications passées, ${ko} échec(s)`);
process.exit(ko ? 1 : 0);
