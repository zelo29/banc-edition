# Banc d'édition

Mesure **comment tu tapes**, pas seulement si l'exercice est résolu.

Monkeytype mesure la frappe brute sans éditeur. Codewars mesure la résolution
sans regarder l'exécution. VimGolf mesure le geste — mais en vim seulement, en
asynchrone. Personne ne mesure le geste d'édition en direct, dans un éditeur,
avec un retour immédiat.

```bash
npm install
npm run dev      # http://localhost:5180
npm run verif    # le contrat d'annotation de CodeMirror
```

## Comment ça marche

**Aucune touche n'est interceptée.** CodeMirror annote déjà chaque transaction
avec sa cause, via `Transaction.userEvent` :

| Annotation | Sens | Usage |
|---|---|---|
| `input.type` | frappe de caractère | compteur de frappes |
| `input.paste` | collage | compté à part — ce n'est pas un geste |
| `input.complete` | autocomplétion | absente en mode kata |
| `delete.backward` | retour arrière | le signal n°1 de lenteur |
| `delete.selection` | suppression d'une sélection | geste sain |
| `select.pointer` | sélection à la **souris** | le second signal |
| `move.drop` | glisser-déposer | pénalité |
| `undo` / `redo` | hésitation | marqueur |

L'annotation est lue directement (`tr.annotation(Transaction.userEvent)`) et non
par une chaîne de `isUserEvent` du plus précis au plus général, qui rangeait
`delete.forward` sous `delete.backward`.

Une sélection au clavier produit un `select` qui n'est **pas** `select.pointer` :
toute la distinction souris/clavier tient là.

## Un kata = deux fichiers

`depart` et `cible`. La cible **est** le test : pas de suite de tests, pas de
runner, pas de compilation — on compare deux chaînes. Chaque kata vise un geste
précis, révélé seulement après la réussite.

## Ce qui est volontairement absent

- **L'autocomplétion et le linter** : `input.complete` n'est pas une frappe, et
  ils entraîneraient le mauvais geste. On mesure la personne, pas l'outil.
- **Un score unique** : « efficacité 0,34 · souris ×8 » enseigne quelque chose,
  « score 412 » n'enseigne rien.
- **Comptes, backend, classement** : rien de tout ça tant que la mesure n'est pas
  juste. Un classement sur un score faux ne vaut rien.

## Suite

1. ~~Le journal des gestes~~
2. ~~Les trois compteurs~~
3. ~~Le format de kata~~
4. Le score : diff minimal entre départ et cible, rapporté au réel
5. La répétition : le même kata cinq fois, la courbe
6. Le coach : détection des motifs lents dans le journal
