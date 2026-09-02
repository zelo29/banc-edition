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

28 épreuves. Chacune vérifiée par exécution : les réponses des lectures sont
calculées, les bugs des débogages sont reproduits.

## À venir, par ordre de valeur

### 1. La revue de code

Une diff, un défaut planté, trouve la ligne. Mesure : 1 / tentatives.

C'est le geste le plus « entreprise » de tous — c'est à ça qu'on reconnaît un
développeur senior, et c'est ce qu'on te demandera dès la première semaine. Une
diff se lit autrement qu'un fichier : le contexte manque par construction, et
c'est justement ce qui rend l'exercice dur et entraînable.

Contenu : régressions, cas limites cassés, conditions inversées, ressources non
libérées, `await` perdus dans un refactor.

### 2. La répétition

Pas un banc : le mécanisme. La même épreuve cinq fois d'affilée, la courbe en
direct sous les yeux.

C'est le seul dispositif d'apprentissage moteur qui existe, et il est dans cette
roadmap depuis le premier jour. Il passe devant les bancs suivants parce qu'il
rend plus efficace **tout** ce qui existe déjà.

### 3. La navigation de dépôt

Plusieurs fichiers, une question qui oblige à trouver *où* : « quelle fonction
appelle `charger` ? », « où `TIMEOUT` est-il défini ? ».

Distinct de la lecture : là on comprend un fichier, ici on cherche dans un
arbre. C'est la compétence qui décide de tes deux premières semaines dans une
équipe. Matériel neuf à construire : un arbre de fichiers navigable et une
recherche.

### 4. Le coach

Pas un banc non plus. Il lit le journal des gestes et nomme le motif :
« tu retapes des lignes entières au lieu de les déplacer »,
« tu prends la souris dès que la sélection dépasse une ligne ».

C'est ce qui transforme une mesure en enseignement. Il attend d'avoir assez de
journal pour dire quelque chose de vrai — d'où sa place ici et pas plus haut.

### 5. Le générateur d'épreuves

**Le vrai plafond de l'outil.** 28 épreuves, c'est six séances avant d'avoir tout
vu. Aucun banc supplémentaire ne règle ça : c'est un problème de contenu.

Un agent produit la fournée suivante ; les harnais existants la valident **par
exécution** avant de l'accepter — une lecture dont la réponse ne se calcule pas,
un bug qui ne se reproduit pas, sont rejetés automatiquement.

C'est le seul endroit de ce projet où faire tourner un agent a du sens : un lot,
vérifié, quand la bibliothèque s'épuise. Pas une boucle permanente.

### 6. Git

Un dépôt dans un état donné, un état cible, on compte les commandes. La mesure
est exacte — l'état d'un dépôt se compare comme deux chaînes.

Rebase, conflits, `bisect`, `reflog` : ce qui fait paniquer les gens en équipe.
Repoussé ici uniquement pour son coût — il faut un git en mémoire
(`isomorphic-git`) et un terminal simulé. Fort levier, gros chantier.

### 7. Le terminal

Un arbre de fichiers, une question, une réponse exacte : « combien de fichiers
contiennent X ? ». `grep`, `find`, `sed`, les tubes.

Mesurable proprement, mais moins de levier que le reste : la plupart des gens
s'en sortent avec trois commandes et un moteur de recherche.

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
