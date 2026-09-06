# Banc d'édition

Mesure **comment tu travailles**, pas seulement si l'exercice est résolu.

Quatre bancs, une seule séance : **éditer** (la main), **lire** (l'œil),
**déboguer** (remonter de l'effet à la cause) et **naviguer** (trouver où, dans
un arbre). La séance ne fait pas la différence — elle tire des épreuves, et seul
l'écran sait laquelle afficher. C'est ce qui a permis d'ajouter le troisième
puis le quatrième sans retoucher le reste.

Monkeytype mesure la frappe brute sans éditeur. Codewars mesure la résolution
sans regarder l'exécution. VimGolf mesure le geste — mais en vim seulement, en
asynchrone. Personne ne mesure le geste d'édition en direct, dans un éditeur,
avec un retour immédiat.

```bash
npm install
npm run dev      # http://localhost:5180/banc-edition/
npm run verif    # le contrat CodeMirror, le score, la séance
```

`verif/score.mjs` importe les sources `.ts` telles quelles : il demande Node ≥ 22.18,
qui retire les types sans transpilation.

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

## Le score : ce qu'il fallait faire, contre ce qu'on a fait

Le chronomètre seul récompense de taper vite, pas de taper juste. On mesure donc
le rapport entre le **minimum théorique** et le **réel** :

- le minimum est la distance d'édition en caractères entre le départ et la
  cible — exacte, calculée par plus longue sous-séquence commune ;
- le réel est la somme des caractères insérés et supprimés par les transactions,
  y compris ceux qu'on tape puis efface aussitôt.

En caractères et non en transactions, volontairement : le minimum en nombre de
gestes n'est pas calculable — renommer quatre occurrences au multi-curseur, c'est
une seule transaction qui touche quatre endroits.

Ce que ça attrape, et c'est précisément le défaut à corriger : retaper une ligne
entière pour changer un mot. Le minimum dit 8 caractères, le réel en compte 60,
l'efficacité tombe à 0,13.

La même distance sert à la jauge de progression, plutôt qu'un compteur de
préfixe commun : dès que la première occurrence est corrigée, le préfixe saute à
la suivante et annonce 45 % du travail fait là où la distance en compte 20.

## La séance

Cinq katas, enchaînés tout seuls, puis un bilan. **Aucun menu, aucun choix.**

C'était le manque principal, et il n'était pas technique : un banc qui mesure
sans diriger laisse une décision à prendre à chaque ouverture — quel kata,
combien de fois, jusqu'à quand — et cette décision, payée tous les jours, est
exactement ce qui empêche l'habitude de se former.

Le tirage n'est pas aléatoire. Il classe, dans cet ordre :

1. **les gestes jamais rencontrés**, du moins cher au plus cher — apprendre
   passe avant réviser, et la première séance doit être courte ;
2. **les gestes vus mais pas acquis** — la dette, remboursée en priorité ;
3. **les gestes acquis**, du plus ancien au plus récent — l'entretien.

Le tri est stable et sans hasard : aucun kata ne peut être oublié indéfiniment.

Le bilan ne retient qu'**un seul geste**, le plus coûteux de la séance. Une liste
de cinq reproches ne se travaille pas — on repart avec la même chose qu'en
arrivant, en plus découragé.

## Un raccourci d'application ne doit pas porter un geste de kata

Tab redémarrait le kata. Le kata « Réindenter le bloc » se résout **en appuyant
sur Tab**. Sur la première séance réelle, un second appui — réflexe normal quand
on indente — annulait la réussite à peine obtenue : le même kata a été refait
dix fois de suite avant qu'on passe au suivant.

C'est une règle générale, pas un cas particulier : toute touche que le banc
enseigne lui appartient. Ne restent à l'application que Ctrl+Entrée
(recommencer), Entrée (suivant) et Échap hors de l'éditeur.

## La carte des gestes

Le bilan montre où tu en es sur les douze, et pas seulement sur les cinq de la
séance : tenus, en dette, jamais rencontrés. La dette passe en tête — c'est la
seule partie sur laquelle on peut agir.

Sans elle, vingt essais accumulés ne se voyaient nulle part, et l'outil ne
répondait pas à la seule question qui fait revenir : est-ce que je progresse ?

## Enseigner, puis tester

Tant qu'un geste n'est pas acquis, il est **montré avant** le kata. Une fois tenu
au-dessus de 0,7 d'efficacité sur l'un des trois derniers essais, l'indice
disparaît et le kata passe en test.

Sans cette moitié, la première rencontre avec un kata était perdue d'avance : on
le brutalisait à la main, on faisait 12 %, et on n'en repartait pas avec un geste
appris mais avec une mauvaise note. Le bilan marque « montré » les réussites
obtenues avec l'indice — elles ne comptent pas comme des gestes tenus.

## Le navigateur vole les raccourcis

Un banc d'édition qui tourne dans un onglet ne possède pas le clavier. Ctrl+J
ouvre les téléchargements de Firefox, Ctrl+D pose un marque-page, Ctrl+H ouvre
l'historique — les trois sont des gestes de kata.

Deux couches les reprennent :

- chaque liaison de `raccourcis.ts` porte `preventDefault`, ce qui suffit dès que
  l'éditeur a le focus ;
- une garde au niveau de la page couvre le reste, focus perdu compris.

**Ce qui résiste** : les raccourcis des outils de développement (Ctrl+Maj+K,
Ctrl+Maj+I, F12) sont traités par le navigateur lui-même et ne sont pas
annulables par la page. Le kata « Retirer les traces » les rencontre. Le seul
remède est de lancer Firefox en mode kiosque, qui désactive ses propres
raccourcis.

## CodeMirror n'est pas VS Code

Les katas nomment des raccourcis VS Code. CodeMirror n'en connaît qu'une partie :
il fournit `moveLineDown`, `deleteLine`, `addCursorBelow`, mais **rien** pour
Ctrl+D, Ctrl+J, Ctrl+H ni Tab sur une sélection.

Un kata qui annonce un geste que l'éditeur ignore n'entraîne rien : il bloque.
`raccourcis.ts` comble donc l'écart — `@codemirror/search` pour Ctrl+D et Ctrl+H,
`closeBrackets` pour entourer une sélection, `indentWithTab` pour Tab, et une
commande `joindreLignes` écrite à la main, CodeMirror n'ayant pas de `joinLines`.

`verif/gestes.mjs` applique le geste annoncé et exige la cible au caractère près.
C'est cette vérification qui manquait : sans elle, six katas sur douze nommaient
un raccourci mort.

`verif/editeur.mjs` va plus loin : il monte le vrai éditeur dans un DOM et lui
envoie de vrais événements clavier. C'est le seul moyen de vérifier la
**précédence** — une liaison peut exister et perdre quand même contre
`defaultKeymap`. C'est lui qui a trouvé le pire défaut du lot : sans
`EditorState.allowMultipleSelections` ni `drawSelection()`, CodeMirror refuse
silencieusement toute sélection secondaire. Le multi-curseur ne marchait pas du
tout, et deux katas de plus étaient morts sans que rien ne le signale.

## Ouvrir un panneau n'est pas finir un geste

Ctrl+H marchait : le panneau de recherche s'ouvrait. Le kata était pourtant
infaisable, et d'une façon que rien ne signalait.

`searchKeymap` ne lie **ni `replaceAll` ni `replaceNext`** — aucune touche ne
mène à « remplacer tout ». Et l'ordre du DOM du panneau place trois boutons et
trois cases à cocher entre le champ « Find » et le champ « Replace » : six
tabulations pour traverser. Le seul chemin praticable était donc le clic — sur un
banc qui compte et pénalise chaque `select.pointer`. **Un kata qui punit le seul
chemin qu'il laisse ouvert n'entraîne pas : il décourage.**

`SearchPanel.keydown` appelle `runScopeHandlers(view, e, "search-panel")` avant
toute chose : c'est le point d'extension prévu, et `scope` est ce qui fait qu'une
liaison y est consultée — sans lui, elle vaut pour l'éditeur, où le panneau n'a
pas le focus.

| Touche | Effet | D'où elle vient |
|---|---|---|
| `Ctrl+Alt+Entrée` | remplace tout | ajoutée — c'est le raccourci de VS Code |
| `Tab` / `Maj+Tab` | passe d'un champ à l'autre | ajoutées, sans retirer le Tab natif |
| `Entrée` | remplace **une** occurrence | déjà natif — et la différence est ce que le kata enseigne |
| `Échap` | referme | déjà natif |

Les deux commandes de navigation rendent `false` partout ailleurs : le Tab natif
reprend alors la main et sort du panneau normalement, boutons compris. On
n'enlève l'accès clavier à rien, on ajoute le chemin court.

Un détail coûteux au passage : `Ctrl+Entrée` recommence le kata depuis n'importe
où, et la condition ne regardait pas `altKey`. Le panneau appelle bien
`preventDefault`, mais il ne stoppe pas la propagation — `Ctrl+Alt+Entrée`
montait donc jusqu'au gestionnaire de la page, et **le kata redémarrait dans la
seconde qui suivait le remplacement**, effaçant le travail à l'instant même de la
réussite.

### Nommer la touche d'entrée ne suffit pas

D'où le champ `etapes` du kata : une suite de `{ touche, effet }`, montrée comme
l'indice l'était déjà, tant que le geste n'est pas acquis. Le banc dit maintenant
la suite complète, et `verif/gestes.mjs` vérifie que **chaque touche annoncée est
réellement liée** — c'est la version généralisée du garde-fou qui avait déjà
attrapé six raccourcis morts. `verif/editeur.mjs` rejoue la séquence entière dans
un vrai DOM et exige la cible : le kata est prouvé faisable au clavier seul.

## Le banc de lecture

Comprendre vite un fichier qu'on n'a jamais vu est ce qui sépare les bons
développeurs, personne ne l'entraîne, et c'est mesurable au chronomètre.

Une lecture = un extrait de code, une question, une réponse courte et exacte —
un nombre, un mot, un numéro de ligne. Comme pour les katas : pas de runner, pas
de correcteur, on compare des chaînes. **Une question dont la réponse ne tient
pas en un mot est une question mal posée.**

La mesure est la même dans son esprit que celle du banc d'édition :

| | banc d'édition | banc de lecture |
|---|---|---|
| minimum | la distance d'édition | **une** réponse |
| réel | les caractères brassés | les réponses données |
| efficacité | minimum / réel | 1 / tentatives |

Le temps compte, mais c'est le nombre de fausses pistes qui enseigne : il dit si
tu as lu ou si tu as deviné. Une mauvaise réponse ne punit pas et ne dit pas où
est l'erreur — le seul retour utile est « relis ».

`verif/lecture.mjs` **exécute** chaque extrait et compare le résultat à la
réponse annoncée. Un banc de lecture qui corrige faux est pire qu'inutile : il
enseigne l'erreur.

## Le temps qui ne court pas la nuit

Le banc d'édition n'a pas ce problème : son journal ne compte que des gestes, et
une transaction ne se produit pas quand on n'est pas là. Une lecture, elle, n'a
rien à compter — une horloge partie à l'affichage tourne pendant la nuit et
enregistre **quatre heures de « lecture » pour un exercice de trente secondes**.
C'est arrivé, et ça rend la mesure inutilisable.

Le temps ne s'accumule donc que pendant que l'onglet est visible et que la
dernière activité date de moins de trois minutes. Le seuil est volontairement
généreux, et c'est le point délicat : lire est précisément l'activité où on ne
touche à rien. Un seuil serré effacerait du temps de lecture réel, ce qui serait
pire que le défaut qu'on corrige.

Trois minutes ne prétendent donc pas mesurer la présence — elles **bornent** une
absence. Quand l'inactivité est constatée, on suspend au moment où elle a été
acquise, dernière activité plus le seuil, et non à l'instant du constat qui peut
venir des heures trop tard.

## Data et sécurité : du matériau, pas un banc de plus

Les deux domaines comptent énormément, et ce sont les mieux servis du métier.
DataLemur et StrataScratch couvrent l'écriture de requêtes ; PortSwigger Web
Security Academy et pwn.college couvrent l'exploitation, gratuitement et avec
une validation automatique irréprochable. Écrire ici un banc « écris cette
requête » ou « trouve cette faille » serait perdre d'avance contre du gratuit.

Mais ces plateformes demandent toutes de **produire** l'attaque ou la requête.
Aucune ne chronomètre l'autre moitié : relire une requête existante et dire ce
qu'elle rend, repérer la ligne fautive dans du code ordinaire sans savoir qu'on
cherche une faille. C'est le banc de lecture, et le domaine n'y change rien — un
`NOT IN` qui rend zéro ligne se lit comme un `continue` mal placé.

Ils sont donc entrés **comme matériau**, sans une ligne de code d'application :

| lecture | ce qu'elle enseigne |
|---|---|
| Le NOT IN qui ne rend rien | un seul NULL dans la sous-requête vide le résultat entier |
| Le chiffre d'affaires triplé | joindre vers le « plusieurs » duplique le « un » |
| La moyenne et l'effectif | `AVG` ignore les NULL, `COUNT(*)` non — les deux s'affichent côte à côte |
| Le classement sans deuxième | `RANK` laisse un trou, `DENSE_RANK` non |
| Le centime introuvable | 19,99 + 4,99 + 0,02 ne fait pas 25 |
| La frontière effacée | une requête concaténée n'a plus de frontière entre code et donnée |
| La racine qui ne retient rien | `path.join` assemble et normalise — il ne confine pas |
| La clé qui n'en est pas une | écrire dans `__proto__` modifie tous les objets |
| La ligne qui annule la précédente | un `innerHTML +=` défait le `textContent` d'au-dessus |
| Le secret effacé trop tard | `rm` ajoute une couche, il n'en retire aucune |

### Le SQL s'exécute aussi

`node:sqlite` est dans Node depuis la 22, donc il n'y avait plus de raison de
**croire** une réponse SQL. Chaque lecture SQL porte son propre jeu de données,
le harnais monte la base en mémoire et joue la dernière instruction de
l'extrait. Les données sont dans l'extrait et non dans le harnais, pour une
raison de fond : « combien de lignes ? » n'a de réponse que si le lecteur voit
les données. L'extrait est un script complet, ce qui le rend lisible **et**
vérifiable par la même occasion.

L'injection SQL est donc réellement jouée : c'est la base qui rend trois jetons.
Et « tous les jetons » veut dire quelque chose, parce que le harnais recompte la
table **sans** l'injection, sur le même jeu de données — rejouer la requête
injectée pour la vérifier n'aurait rien prouvé du tout.

Ce qui reste non exécuté est nommé en fin de sortie : un Dockerfile, un workflow
CI, une annotation TypeScript et un en-tête HTTP. Quatre sur quarante-six, et le
harnais les affiche à chaque passage plutôt que de laisser croire à une
vérification.

## Le banc de navigation

Lire un fichier et chercher dans un arbre sont deux gestes différents, et le
second décide de tes deux premières semaines dans une équipe. On ne te demandera
pas de comprendre `paiement.js` : on te demandera de trouver **où** le montant
est arrondi, dans quatre cents fichiers que personne n'a le temps de t'expliquer.

Six épreuves, six techniques :

| épreuve | ce qu'elle entraîne |
|---|---|
| Trois usages, une déclaration | chercher `const X`, pas `X` — quatre fichiers le contiennent, un seul le crée |
| L'appel et ses sosies | un import et un commentaire ne sont pas des appels |
| Avant de changer la signature | compter les importateurs, c'est ça le coût du changement |
| Le baril qui ne définit rien | un `export … from` réexporte sans définir : suivre la chaîne |
| Deux fonctions, un seul nom | à noms égaux, c'est l'import qui tranche |
| Chercher une absence | le code mort ne se trouve avec aucune recherche : exports moins imports |

La recherche du navigateur n'est **pas bridée** — elle compte les
correspondances par fichier, exactement comme celle d'un éditeur. Ce sont les
épreuves qui sont construites pour qu'elle ne suffise pas, et le harnais vérifie
qu'aucune ne se résout par une recherche naïve. Brider l'outil aurait entraîné à
naviguer dans un dépôt qui n'existe pas.

### Le champ `preuve`, et pourquoi il compte pour la suite

Une lecture s'exécute, un débogage se reproduit. Une navigation n'a rien à
exécuter : sa réponse est un **fait sur l'arbre**. Chaque épreuve déclare donc
comment sa réponse se recalcule — `{ genre: 'appelant', symbole: 'purger' }` —
et `verif/navigation.mjs` la recalcule vraiment avant de la comparer à celle qui
est écrite.

Le harnais vérifie deux choses de plus que la réponse :

- **l'unicité** — « quelle fonction appelle X » n'a de sens que s'il n'y en a
  qu'une, et une épreuve à deux réponses justes ne se voit pas en relisant ;
- **la non-trivialité** — si le symbole n'apparaît que dans un fichier, aucune
  navigation n'est demandée.

Un genre de preuve non implémenté fait échouer le harnais. **C'est ce qui rendra
le générateur d'épreuves possible** : un lot produit par un agent se valide tout
seul, sans qu'un humain relise quatre cents fichiers pour vérifier qu'il n'y a
bien qu'un seul appel.

Les quatre mutations qui doivent échouer — une fausse réponse, un second appel
qui rend la question ambiguë, une seconde déclaration, un genre inventé — ont été
essayées une par une : les quatre sont détectées.

## La première séance fait le tour du produit

« Le moins cher d'abord » était la bonne règle avec un seul banc. Avec quatre,
le banc le plus fourni occupe tout : vingt-six lectures repoussaient la première
navigation à la **septième séance** — un quart du produit invisible pendant une
semaine, sur un outil dont la seule question est de savoir s'il sera rouvert.

Le premier rang du tirage — les épreuves jamais rencontrées — alterne donc les
bancs, chacun servant sa moins chère. La séance n°1 montre les quatre. Ce qui ne
change pas : le rang reste prioritaire, la dette passe avant l'entretien, et à
l'intérieur d'un banc l'ordre reste du moins cher au plus cher.

Un détail qui n'en est pas un : le coût d'une navigation se compte en
**fichiers**, pas en lignes. Sommer les lignes de l'arbre suppose qu'on le lit en
entier, ce qui est exactement le geste que le banc apprend à ne pas faire.

## La présence

Le reste du produit répond à « est-ce que je progresse ». Celui-ci répond à la
seule question qui décide de tout : **est-ce que j'y reviens**. Un instrument de
mesure parfait qu'on n'ouvre jamais ne fait progresser personne, et le critère
de réussite n'a jamais été « la mesure est juste » mais « je l'ouvre tous les
jours ».

Ce n'est pas un score, et c'est ce qui lui donne le droit d'exister ici : des
dates se vérifient. Le bilan annonce les jours d'affilée, le record, et les
jours faits sur les sept derniers.

**Le jour est local, jamais UTC.** `toISOString().slice(0, 10)` est le réflexe et
il est faux : une séance faite à 00 h 30 à Paris s'enregistre la veille, une
séance faite à 23 h à Auckland s'enregistre le lendemain. On perd ou on double
un jour — et une série cassée par un fuseau horaire ne se rattrape pas, on ne
peut pas refaire hier. Le harnais rejoue le calcul dans un processus réglé sur
`Pacific/Auckland`, là où le réflexe se serait trompé d'un jour, et vérifie
aussi que la veille du 30 mars survit au passage à l'heure d'été.

**Le jour se marque à la séance terminée**, pas à l'ouverture de la page. Une
série qu'on gagne en ouvrant un onglet ne mesure plus rien, et c'est la seule
chose ici qu'on aurait envie de se mentir à soi-même.

**Aucun zéro accusateur.** Manquer un jour est déjà ce qui fait abandonner ;
l'annoncer en rouge finit le travail. La série reste donc vivante tout le
lendemain — elle se sauve encore — et le rappel « série de 4 — à sauver »
n'apparaît en tête que ce jour-là. Affiché tous les jours il deviendrait du
décor ; affiché après coup il ne serait qu'un reproche.

## Ouvrir en un geste

Le blocage n'était pas la mesure, c'était le lancement : `cd`, `npm run dev`,
puis ouvrir un navigateur. Trois décisions payées chaque jour, pour un outil
dont tout le propos est de n'en demander aucune.

`.github/workflows/pages.yml` publie le banc sur GitHub Pages à chaque poussée
sur `main`, et il fait tourner `npm run verif` **avant** — un banc dont une
réponse est fausse enseigne l'erreur, il vaut mieux ne rien publier que publier
ça. Rien à héberger et rien à payer : l'application est entièrement côté client.

Deux choses à savoir :

- **`localStorage` est cloisonné par origine.** L'historique de
  `localhost:5180` ne suivra pas sur le site publié. Il faut choisir lequel des
  deux est LE banc — le publié, si on veut l'ouvrir tous les jours — et garder
  `npm run dev` pour développer, pas pour s'entraîner.
- le `base` de Vite déplace l'adresse de développement vers
  `localhost:5180/banc-edition/`. La racine y redirige toute seule.

## Ce qui reste d'une épreuve

Le journal des gestes ne survivait à rien. `armer()` vide `gestes` au début de
chaque épreuve, et `EtapeFaite` ne garde que des totaux — durée, frappes,
souris, efficacité. Or le coach annoncé par la roadmap doit pouvoir dire « tu
retapes des lignes entières au lieu de les déplacer » ou « tu prends la souris
dès que la sélection dépasse une ligne », et **aucune de ces deux phrases ne se
déduit d'un total.**

C'est le seul point de la roadmap qui ait une urgence propre : **une séance
faite avant ce stockage est perdue pour toujours.** On ne peut pas rejouer hier
pour en extraire des gestes qu'on n'a pas enregistrés. Le coach, lui, peut
attendre d'avoir de quoi dire quelque chose de vrai — la matière, non.

### On ne garde pas le journal, on le résume

Un kata produit cent à deux cents gestes. Cinq épreuves par jour, reprises
comprises, font près de quinze mille gestes par mois — une quinzaine de
mégaoctets par an, dans un `localStorage` qui en offre cinq. Garder le flux brut
n'est pas une option prudente qu'on aurait écartée par élégance : c'est une
option qui casse.

La contrepartie est réelle et il faut la dire : **ce qui n'est pas résumé
aujourd'hui n'existera jamais.** Le choix des champs est donc le choix de ce que
le coach saura voir, et il se fait maintenant :

| champ | le motif qu'il rend visible |
|---|---|
| `minimum` / `reel` | « tu retapes une ligne entière pour changer un mot » |
| `evenements` | « tu prends la souris », « tu hésites », « tu colles » |
| `rafaleArriere` | « tu effaces caractère par caractère » |
| `duree` | la vitesse, banc par banc |

`rafaleArriere` est le seul champ de séquence retenu, et c'est délibéré : c'est
le seul motif qu'aucun total ne permet de reconstruire. Quarante
`delete.backward` d'affilée et quarante répartis dans l'épreuve donnent le même
compteur et ne racontent pas la même chose.

Au-delà de deux mille traces — deux cent cinquante jours de séances
quotidiennes — les plus anciennes partent. Un coach qui décrit comment tu
travaillais il y a un an décrit quelqu'un d'autre.

### Le nom des annotations est une dépendance, pas un détail

Tout le produit repose sur des chaînes de caractères décidées par une
bibliothèque tierce : `delete.backward`, `select.pointer`, `input.paste`. Le
jour où l'une d'elles change, **rien ne casse** — les compteurs tombent
silencieusement à zéro et le coach n'a plus rien à dire.

`verif/journal-reel.mjs` monte donc le vrai éditeur avec la vraie extension de
journal, envoie de **vraies touches**, et résume ce qui en sort. C'est la seule
preuve que ce qu'on enregistre aujourd'hui sera lisible demain.

Il a immédiatement rendu deux choses. La distinction souris/clavier annoncée
plus haut est bien réelle, mais pas comme le harnais synthétique le croyait :
une sélection au clavier porte `select`, et une transaction **sans annotation du
tout** est écartée par le journal comme sélection programmatique. Le repli
`|| 'selection'` du résumé ne couvrait donc qu'un cas qui ne se produit jamais —
et un test l'affirmait. Les deux ont sauté.

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

Le détail, le raisonnement et la frontière : **[ROADMAP.md](ROADMAP.md)**.
Ce que le banc ne mesurera jamais et qu'il faut savoir quand même :
**[CULTURE.md](CULTURE.md)**.

1. ~~Le journal des gestes~~
2. ~~Les trois compteurs~~
3. ~~Le format de kata~~
4. ~~Le score : diff minimal entre départ et cible, rapporté au réel~~
5. ~~La séance : cinq katas enchaînés, un bilan qui ne retient qu'un geste~~
6. ~~La carte des gestes : où tu en es sur l'ensemble, pas sur la séance~~
7. ~~Le banc de lecture : un fichier inconnu, une question, le chronomètre~~
8. ~~Le banc de débogage : un symptôme, un extrait, le temps jusqu'à la cause~~
9. ~~Les domaines voisins : data et sécurité, comme matériau de lecture~~
10. ~~La répétition : refaire tout de suite ce qu'on vient d'apprendre, sans l'indice~~
11. ~~La navigation de dépôt : plusieurs fichiers, une question qui oblige à trouver *où*~~
12. Le générateur d'épreuves : un lot de plus, validé par exécution avant d'être accepté
13. Le coach : détection des motifs lents dans le journal

Un point a quitté cette liste au lieu d'être barré : **la revue de code**, qui
en était le prochain. [DiffDojo](https://diffdojo.com/) fait exactement
l'exercice prévu — des PR réalistes avec défauts plantés, notées contre une
revue canonique — gratuitement et en mieux. Le filtre n°2 de la roadmap dit de
ne pas refaire ce que quelqu'un sert déjà mieux ; il ne sert à rien de l'écrire
si on ne l'applique pas quand ça coûte.
