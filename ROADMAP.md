# Roadmap

Le but : être le meilleur développeur en entreprise, dans n'importe quel
contexte. Ce document dit ce que le banc entraînera, dans quel ordre, et
surtout **ce qu'il n'entraînera pas**.

## Le critère

Un aspect du métier mérite un banc s'il passe les trois filtres :

1. **Une mesure honnête et automatique existe.** On compare des chaînes, pas des
   opinions. Si la correction demande un avis, ce n'est pas un banc.
2. **Personne ne le sert déjà mieux.** Anki bat n'importe quoi qu'on écrirait
   pour le vocabulaire ; Codewars et Advent of Code battent n'importe quoi qu'on
   écrirait pour l'algorithmique. On ne les refait pas.
3. **Ça pèse vraiment dans le travail réel.** Pas ce qui est facile à mesurer :
   ce qui coûte des heures toutes les semaines.

Un aspect qui échoue au filtre 1 n'entre pas dans le banc — même s'il est
important. C'est la règle qui protège la seule chose de valeur ici : une mesure
qu'on peut croire.

## Fait

| banc | ce qu'il entraîne | la mesure |
|---|---|---|
| **édition** | la main | distance d'édition minimale / caractères brassés |
| **lecture** | l'œil sur un fichier inconnu | 1 / tentatives, et le temps |
| **débogage** | remonter de l'effet à la cause | 1 / tentatives, et le temps |
| **navigation** | trouver *où*, dans un arbre | 1 / tentatives, et le temps |

52 épreuves, sur huit technologies. Chacune vérifiée par exécution : les
réponses des lectures sont calculées, les requêtes SQL sont jouées sur une base
en mémoire, les bugs des débogages sont reproduits. Les réponses de
navigation sont recalculées depuis l'arbre — où un symbole est déclaré, qui
l'appelle, ce que personne n'importe. Une épreuve dont la réponse est affirmée
plutôt que calculée est signalée nommément par le harnais — il en reste quatre
sur cinquante-deux, et le fichier les nomme.

**La répétition** est en place, et c'est un mécanisme, pas un banc : une épreuve
d'édition ratée est refaite tout de suite, sans son indice cette fois, jusqu'à
trois essais et quatre reprises par séance. Seul le banc d'édition y a droit —
refaire une lecture dont on connaît déjà la réponse mesurerait la mémoire, et la
courbe monterait toute seule.

Les domaines voisins — data, sécurité — sont entrés par le banc de lecture, pas
par un banc à eux. Le pourquoi est plus bas ; c'est une décision, pas un raccourci.

## À venir, par ordre de valeur

### 1. Le générateur d'épreuves

**Le vrai plafond de l'outil**, et c'est maintenant le premier point de la
liste : 52 épreuves, c'est onze séances avant d'avoir tout vu. Aucun banc supplémentaire ne règle ça — c'est un
problème de contenu, et chaque banc ajouté l'aggrave.

Le banc de navigation a posé la brique qui manquait : son champ `preuve` fait
déclarer à chaque épreuve COMMENT sa réponse se recalcule, et un genre de preuve
non implémenté fait échouer le harnais. Une épreuve qu'on ne sait pas vérifier
ne peut donc plus entrer, même produite par nous.

Un agent produit la fournée suivante ; les harnais existants la valident **par
exécution** avant de l'accepter — une lecture dont la réponse ne se calcule pas,
une requête dont le résultat est affirmé plutôt que joué, un bug qui ne se
reproduit pas, sont rejetés automatiquement.

C'est le seul endroit de ce projet où faire tourner un agent a du sens : un lot,
vérifié, quand la bibliothèque s'épuise. Pas une boucle permanente.

### 2. Le coach

Pas un banc non plus. Il lit le journal des gestes et nomme le motif :
« tu retapes des lignes entières au lieu de les déplacer »,
« tu prends la souris dès que la sélection dépasse une ligne ».

C'est ce qui transforme une mesure en enseignement. Il attend d'avoir assez de
journal pour dire quelque chose de vrai — d'où sa place ici et pas plus haut.

### 3. Git

Un dépôt dans un état donné, un état cible, on compte les commandes. La mesure
est exacte — l'état d'un dépôt se compare comme deux chaînes.

Rebase, conflits, `bisect`, `reflog` : ce qui fait paniquer les gens en équipe.
Repoussé ici pour son coût — il faut un git en mémoire (`isomorphic-git`) et un
terminal simulé — et parce que Learn Git Branching couvre déjà l'essentiel
gratuitement. Fort levier, gros chantier, concurrent sérieux.

### 4. Le terminal

Un arbre de fichiers, une question, une réponse exacte : « combien de fichiers
contiennent X ? ». `grep`, `find`, `sed`, les tubes.

Mesurable proprement, mais moins de levier que le reste : la plupart des gens
s'en sortent avec trois commandes et un moteur de recherche.

## Les domaines voisins entrent par le contenu, pas par un banc

Data et sécurité comptent énormément et sont, tous les deux, **les domaines les
mieux servis du métier**. DataLemur, StrataScratch et LeetCode SQL couvrent
l'écriture de requêtes ; PortSwigger Web Security Academy, pwn.college et les
CTF couvrent l'exploitation, gratuitement et avec une validation automatique
irréprochable. Écrire un banc « écris cette requête » ou « trouve cette faille »
serait perdre d'avance contre un produit gratuit.

Mais ces plateformes demandent toutes de **produire** : la requête, l'attaque,
le payload. Aucune ne chronomètre l'autre moitié du travail réel — relire une
requête existante et dire ce qu'elle rend, repérer la ligne fautive dans du code
ordinaire sans savoir qu'on cherche une faille. C'est exactement ce que fait le
banc de lecture, et le domaine n'y change rien : un `NOT IN` qui rend zéro ligne
et un `path.join` qui sort de sa racine se lisent comme un `continue` mal placé.

D'où la règle : **un domaine voisin est du matériau pour un banc existant, pas
un banc de plus.** Ça vaut pour tout ce qui viendra — réseau, systèmes,
concurrence. Le jour où un domaine demande une mesure que les trois bancs ne
savent pas prendre, alors seulement il méritera son banc.

## Servi ailleurs, et mieux

Le filtre n°2, appliqué honnêtement. Ce qui suit ne sera **pas** construit ici,
et la place de cette liste dans le document est délibérée : elle est plus utile
que la précédente.

| ce qu'on voudrait entraîner | qui le fait déjà mieux |
|---|---|
| la revue de code | **DiffDojo** — des PR réalistes avec défauts plantés, commentaires en ligne, noté contre une revue canonique. Gratuit, sans compte, cinq minutes par jour |
| la sécurité applicative | PortSwigger Web Security Academy, pwn.college, les CTF (picoCTF, OverTheWire), Cryptopals |
| l'écriture de SQL | DataLemur, StrataScratch, pgexercises, SQLZoo |
| l'algorithmique | LeetCode, Codewars, Exercism, Advent of Code |
| construire un système entier | CodeCrafters — « écris ton propre Redis / Git / DNS », validé par exécution |
| git | Learn Git Branching, Oh My Git! |
| la mémorisation | Anki |
| les raccourcis, hors éditeur | ShortcutFoo, KeyCombiner |
| les mouvements vim | VimGolf, vim-be-good |

**La revue de code sort de la roadmap**, et c'est le changement le plus coûteux
de cette révision : c'était le point n°1. DiffDojo fait exactement l'exercice
prévu, en mieux — il note des commentaires en langue naturelle contre une
rubrique, là où ce banc n'aurait pu mesurer que « la bonne ligne », faute de
juge. La bonne décision est de s'en servir tous les jours et de ne pas le
réécrire.

Ce que ces outils ont en commun : aucun ne mesure le **geste**, aucun ne
chronomètre la **compréhension**, et aucun ne tient une progression unique à
travers les domaines. C'est ce qui reste, et c'est tout le projet.

## La culture, à côté

Tout ce qui échoue au filtre n°1 mais compte quand même — les idées, les textes,
les livres, ce qu'il faut savoir faire — est dans **[CULTURE.md](CULTURE.md)**.
Ce n'est pas une consolation : c'est l'autre moitié, et c'est celle qui décide
de ce qu'on fait du geste une fois qu'il ne coûte plus rien.

## La frontière

Quatre aspects du métier comptent énormément et **n'entreront pas** dans le banc :

- **concevoir** — choisir entre deux architectures ;
- **estimer** — dire combien de temps ;
- **désambiguïser** — poser la question qui débloque une spec ;
- **communiquer** — écrire le message de commit, la PR, le post-mortem.

Aucun n'a de réponse exacte. Les mesurer demanderait un juge — un modèle qui
note. Le jour où on franchit cette ligne, l'outil perd ce qui fait sa valeur :
une mesure qu'on peut vérifier soi-même.

Si on y touche un jour, ce sera un mode explicitement séparé, portant un nom qui
dit que c'est **un avis, pas une mesure**. Jamais fondu dans le même score.

## Ce que le banc ne remplacera jamais

Livrer une vraie fonctionnalité. Tenir un système en production. Travailler avec
des gens qui ne sont pas d'accord.

Le banc entraîne la mécanique — et la mécanique n'est pas le métier. Elle est ce
qui libère l'attention pour le reste : quand renommer quatre occurrences ne te
coûte plus rien, tu penses à l'architecture pendant que tu le fais.

C'est tout ce qu'un banc peut promettre. C'est déjà beaucoup.
