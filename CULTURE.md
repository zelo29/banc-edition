# Culture

La ROADMAP finit par cette phrase :

> Le banc entraîne la mécanique — et la mécanique n'est pas le métier. Elle est
> ce qui libère l'attention pour le reste.

Ce fichier est **le reste**. Il n'entre pas dans le banc et n'y entrera jamais :
rien de ce qui suit ne se mesure en comparant deux chaînes. C'est le versant qui
se lit, se discute et se pratique sur du vrai code — et c'est celui qui décide
si tu es un bon développeur ou un excellent.

Les deux ne sont pas en concurrence. Le banc rend le geste gratuit ; la culture
décide de ce que tu fais du geste. Renommer quatre occurrences sans y penser ne
sert à rien si tu ne sais pas que le module aurait dû cacher cette décision.

---

## I. Les dix idées

Pas des listes de bonnes pratiques : **dix idées qui reviennent partout**, chez
tous ceux qui écrivent du logiciel depuis cinquante ans. Si tu ne retiens que
cette section, tu as déjà l'essentiel.

### 1. Un module cache une décision, pas une étape

Parnas, 1972. Tout le monde découpe un programme en suivant l'ordre du
traitement : lire, valider, calculer, écrire. Parnas montre que c'est le mauvais
critère. **Un module doit cacher une décision susceptible de changer** — le
format du fichier, la structure de données, la politique de retry. Le
découpage par étapes produit des modules qui changent tous en même temps ; le
découpage par décision produit des modules qu'on peut remplacer seuls.

C'est le texte fondateur du couplage et de la cohésion, et à peu près tout ce
qu'on a écrit depuis sur l'architecture en découle.

### 2. Complexité essentielle et complexité accidentelle

Brooks, 1986. L'essentielle vient du problème : un système de paie est
compliqué parce que la paie l'est. L'accidentelle vient de nos outils et de nos
choix. **Aucun outil ne réduit l'essentielle** — c'est tout l'argument de « No
Silver Bullet », et c'est pour ça qu'aucun framework n'a jamais tenu ses
promesses de productivité ×10.

Le corollaire quotidien : avant d'accuser le langage ou la stack, demande-toi
quelle part de la difficulté est vraiment le problème. C'est souvent 20 %, et
les 80 % restants sont des choix qu'on peut défaire.

### 3. L'état est le principal ennemi

*Out of the Tar Pit*, Moseley & Marks, 2006. La complexité accidentelle a une
source dominante : **l'état mutable partagé**. Chaque variable modifiable
multiplie le nombre d'états possibles du programme, et le nombre de chemins que
ton cerveau doit tenir pour raisonner dessus.

D'où tout ce qui a suivi : l'immutabilité, les fonctions pures, les composants
sans état, l'event sourcing. Ce ne sont pas des modes — ce sont des façons
différentes de réduire la même quantité.

### 4. Les données avant le code

Brooks encore : *« Montre-moi tes organigrammes en me cachant tes tables, je
resterai perplexe. Montre-moi tes tables, je n'aurai généralement pas besoin de
tes organigrammes. »* Torvalds, trente ans plus tard : *« les mauvais
programmeurs se soucient du code, les bons se soucient des structures de
données. »*

Quand tu abordes un système inconnu, **cherche le schéma avant les fonctions**.
Quand tu conçois, dessine les données avant les appels. La bonne structure de
données rend le code évident ; la mauvaise rend le meilleur code illisible.

### 5. Simple n'est pas facile

Rich Hickey, *Simple Made Easy*, 2011. **Simple** est objectif : une chose qui
n'est pas entrelacée avec une autre (*sim-plex*, un seul pli). **Facile** est
subjectif : proche de ce que tu connais déjà.

On choisit presque toujours le facile en croyant choisir le simple, et on paie
six mois plus tard. C'est la conférence la plus utile jamais donnée sur la
conception logicielle, et elle dure une heure.

### 6. Un programme est une théorie, pas un texte

Peter Naur, *Programming as Theory Building*, 1985. Le code est la trace écrite
d'une théorie qui vit **dans la tête** de ceux qui l'ont écrit : pourquoi c'est
découpé comme ça, ce que le système fait quand le monde ne se comporte pas bien.

Conséquence brutale et vérifiable : une équipe qui reprend un code sans ses
auteurs ne récupère pas le programme, seulement son texte. C'est pourquoi la
documentation ne remplace jamais la continuité, pourquoi « on va réécrire ça
proprement » échoue si souvent, et pourquoi lire du code est une compétence à
part entière — tu reconstruis une théorie à partir de ses traces.

Le texte le plus sous-estimé de la liste. Vingt pages.

### 7. Local et distant sont de natures différentes

*A Note on Distributed Computing*, Waldo & al., 1994. Une décennie de
middlewares avait promis de faire disparaître le réseau derrière un appel de
fonction ordinaire. Le papier montre que c'est impossible : latence, pannes
partielles, concurrence et absence de mémoire commune ne sont pas des détails
d'implémentation, ce sont des différences de nature.

Chaque génération réapprend ça. Les microservices sont la dernière en date.

### 8. Il n'y a pas d'ordre global

Lamport, 1978. Dans un système distribué, **« avant » n'a pas de sens absolu** :
seule la causalité ordonne les événements. De là viennent les horloges
logiques, les vecteurs de version, et l'essentiel de ce qui rend les bases
distribuées difficiles.

Corollaire quotidien : dès que deux machines écrivent, la question « laquelle
est arrivée en premier ? » n'a pas de réponse fiable — et un `updated_at` en
timestamp mural n'en est pas une.

### 9. L'intelligence des extrémités

*End-to-End Arguments in System Design*, Saltzer, Reed & Clark, 1984. Une
fonction ne peut être garantie qu'aux extrémités de la communication : les
couches basses peuvent aider à la performance, jamais garantir la correction.

C'est pourquoi TCP ne te dispense pas d'une somme de contrôle applicative,
pourquoi « exactly once » n'existe pas au niveau du transport, et pourquoi la
bonne réponse à un message en double est **l'idempotence côté métier**, pas une
option de la file.

### 10. L'organisation dessine le système

Conway, 1967. **Un système reflète la structure de communication de
l'organisation qui l'a produit.** Trois équipes produisent trois modules,
qu'elles en aient besoin ou non.

C'est vérifiable partout, et ça se retourne : si tu veux une architecture,
change d'abord qui parle à qui. C'est ce qui fait qu'un problème d'architecture
est très souvent un problème d'organisation déguisé.

---

## II. Les lois qu'on te citera en réunion

À connaître pour les reconnaître, et surtout pour savoir où elles s'arrêtent.

| loi | ce qu'elle dit | la nuance qu'on oublie |
|---|---|---|
| **Hyrum** | avec assez d'utilisateurs, tout comportement observable de ton API devient une dépendance | y compris les bugs, les temps de réponse et l'ordre des clés |
| **Conway** | le système copie l'organisation | se retourne : change l'organisation pour changer le système |
| **Gall** | un système complexe qui marche a toujours évolué depuis un système simple qui marchait | on ne conçoit pas un gros système d'un coup, on le fait grandir |
| **Brooks** | ajouter des gens à un projet en retard le retarde davantage | le coût est la communication : n(n−1)/2 |
| **Amdahl** | le gain total est borné par la part non parallélisable | optimiser 90 % du code à l'infini plafonne à ×10 |
| **Postel** | sois strict dans ce que tu émets, tolérant dans ce que tu acceptes | contesté depuis : la tolérance transforme les bugs en standards de fait |
| **Chesterton** | ne démonte pas une barrière avant de savoir pourquoi elle est là | c'est la règle n°1 devant du code hérité |
| **Knuth** | « l'optimisation prématurée est la racine du mal » | la citation complète dit *97 % du temps* — les 3 % restants sont votre métier |
| **Kernighan** | déboguer est deux fois plus dur qu'écrire | donc si tu écris au maximum de ton intelligence, tu ne peux pas déboguer |

---

## III. Vingt textes courts

Une soirée chacun, au maximum. La densité par heure est sans commune mesure
avec celle d'un livre — et tous sont disponibles gratuitement.

| texte | an | ce qu'il te donne |
|---|---|---|
| Parnas, *On the Criteria To Be Used in Decomposing Systems into Modules* | 1972 | le critère de découpage, une fois pour toutes |
| Naur, *Programming as Theory Building* | 1985 | pourquoi la réécriture échoue, pourquoi lire compte |
| Brooks, *No Silver Bullet* | 1986 | essentiel contre accidentel |
| Moseley & Marks, *Out of the Tar Pit* | 2006 | l'état comme source n°1 de complexité |
| Saltzer, Reed & Clark, *End-to-End Arguments* | 1984 | où placer une garantie |
| Waldo & al., *A Note on Distributed Computing* | 1994 | pourquoi le réseau ne se cache pas |
| Lamport, *Time, Clocks and the Ordering of Events* | 1978 | la causalité au lieu du temps |
| Dijkstra, *On the Role of Scientific Thought* (EWD447) | 1974 | la séparation des préoccupations, par son auteur |
| Hickey, *Simple Made Easy* (conférence) | 2011 | simple ≠ facile |
| Kreps, *The Log* | 2013 | le journal comme abstraction unificatrice des données |
| Fowler, *Mocks Aren't Stubs* | 2007 | pourquoi tes tests cassent à chaque refactor |
| Kingsbury (Aphyr), les rapports *Jepsen* | 2013→ | ce que les bases promettent contre ce qu'elles font |
| Dean, *Latency Numbers Every Programmer Should Know* | 2009 | les ordres de grandeur, à connaître par cœur |
| Bonér & al., *The Reactive Manifesto* / *Release It!* (chap. circuit breaker) | 2007 | comment un système tombe en cascade |
| Perlis, *Epigrams on Programming* | 1982 | cent vingt phrases, dont vingt qui te suivront |
| Keshav, *How to Read a Paper* | 2007 | la méthode en trois passes — lis-le en premier |
| Google SRE Book, chap. *Postmortem Culture* | 2016 | le post-mortem sans coupable, et pourquoi |
| Wirth, *A Plea for Lean Software* | 1995 | la loi de Wirth : le logiciel ralentit plus vite que le matériel n'accélère |
| Hoare, *The Emperor's Old Clothes* (conférence Turing) | 1980 | « il n'y avait pas d'erreur cachée parce qu'il n'y avait pas de place pour en cacher » |
| Evans (Julia), les *zines* de wizardzines | 2016→ | tout le concret : DNS, TCP, strace, git interne |

Pour lire un papier sans t'y noyer : Keshav, trois passes. Cinq minutes pour la
structure, une heure pour les idées, quatre heures seulement si tu dois pouvoir
le reconstruire.

---

## IV. Les livres, dans l'ordre où ils paient

L'ordre compte : chacun rend le suivant plus facile.

1. **A Philosophy of Software Design** — Ousterhout, 2018. Cent quatre-vingts
   pages, et le meilleur livre existant sur la modularité. « Les modules
   profonds » : une interface étroite qui cache beaucoup. Le contre-pied direct
   des méthodes qui prêchent les fonctions de trois lignes.

2. **The Pragmatic Programmer** — Hunt & Thomas. Le socle des habitudes :
   DRY, l'orthogonalité, les traceurs, le principe de moindre surprise. À lire
   tôt, et à relire à trois ans d'expérience où il dit autre chose.

3. **Designing Data-Intensive Applications** — Kleppmann, 2017. **Le livre le
   plus rentable de cette liste.** Il couvre à lui seul le domaine data et
   l'essentiel des systèmes distribués : réplication, partitionnement,
   transactions, consensus, traitement par lots et par flux. Il te donne les
   idées VI à IX de la section I avec tout leur détail.

4. **Working Effectively with Legacy Code** — Feathers, 2004. Le seul livre qui
   traite du problème réel : modifier du code qu'on ne comprend pas et qui n'a
   pas de tests. Les techniques de « couture » qui permettent d'insérer un test
   avant de toucher quoi que ce soit.

5. **Refactoring** — Fowler. Le catalogue des transformations à comportement
   constant. À lire un crayon à la main : c'est aussi le catalogue des gestes
   que ton éditeur devrait faire pour toi — et donc, très directement, la liste
   des katas que ce banc devrait contenir.

6. **The Programmer's Brain** — Hermans, 2021. Comment on lit du code, pourquoi
   la mémoire de travail lâche à sept éléments, comment s'entraîner. C'est la
   base scientifique du banc de lecture.

7. **Release It!** — Nygard. Ce qui casse en production et pourquoi : timeouts
   absents, pools épuisés, pannes en cascade, circuit breakers, bulkheads. Le
   livre qui te fait passer de « ça marche » à « ça tient ».

8. **Computer Systems: A Programmer's Perspective** — Bryant & O'Hallaron. La
   machine sous le langage : mémoire, cache, édition de liens, appels système.
   Le livre qui rend les performances explicables plutôt que magiques.

9. **Crafting Interpreters** — Nystrom, gratuit en ligne. Tu écris deux
   interpréteurs complets. Après ça, aucun langage, aucun compilateur, aucun
   *parser* n'est plus une boîte noire — et tu écris de bien meilleurs messages
   d'erreur.

10. **Structure and Interpretation of Computer Programs** — Abelson & Sussman.
    Le plus exigeant, le plus lent, celui qui change le plus la façon de penser.
    À garder pour un moment où tu as du temps, pas pour un sprint.

Deux à part, pour le métier plutôt que le code : **The Mythical Man-Month**
(Brooks) sur pourquoi les projets dérapent, et **Site Reliability Engineering**
(Google, gratuit) sur ce que veut dire tenir un système.

---

## V. Ce qu'il faut savoir FAIRE

La culture qui ne descend pas dans les doigts ne sert à rien. Voici la liste
qui sépare, en entreprise, celui qu'on appelle de celui qu'on n'appelle pas.
Coche honnêtement.

**Déboguer** — lire une pile d'appels et savoir laquelle des lignes est à toi.
Poser un point d'arrêt conditionnel. Bissecter avec `git bisect`. Lire un
`strace` ou un `tcpdump` quand le programme ment. *→ le banc de débogage
entraîne le premier tiers ; le reste se pratique en vrai.*

**Mesurer** — profiler avant d'optimiser, toujours. Savoir lire un flamegraph.
Connaître les ordres de grandeur par cœur : cache L1 ~1 ns, RAM ~100 ns, SSD
~100 µs, un aller-retour réseau dans un datacenter ~500 µs, entre continents
~150 ms. Sans ces nombres, tu ne peux pas estimer, et donc tu ne peux pas
concevoir.

**Interroger une base** — `EXPLAIN` sur toute requête qui compte. Savoir ce
qu'est un index couvrant, pourquoi une fonction sur une colonne le désactive,
ce que coûte un `OFFSET 100000`. Les niveaux d'isolation, et lequel ta base
applique par défaut. *→ le banc de lecture couvre la lecture de requêtes.*

**Comprendre le réseau** — ce qui se passe entre l'URL et la page : DNS,
poignée de main TLS, HTTP, codes de statut, en-têtes de cache, CORS. Savoir
lire l'onglet réseau et distinguer lent-à-cause-du-serveur de
lent-à-cause-du-client.

**Tenir Unix** — tubes, redirections, descripteurs, signaux, codes de retour,
permissions. `grep`, `find`, `sed`, `awk`, `xargs`, `jq`. Ce n'est pas de
l'érudition : c'est ce qui transforme une question de trente minutes en une
ligne de commande.

**Git au-delà de cinq commandes** — le modèle objet (blob, tree, commit), ce
qu'est vraiment une branche, `rebase -i`, `reflog` pour récupérer ce qu'on
croyait perdu, `bisect`, résoudre un conflit sans paniquer.

**La concurrence** — race condition, deadlock, famine, ce que garantit ton
modèle mémoire. En JavaScript : la boucle d'événements, la microtâche contre la
macrotâche, pourquoi un `await` dans une boucle sérialise ce que tu croyais
paralléliser.

**Sécuriser** — le top 10 OWASP, mais surtout le réflexe : d'où vient cette
donnée, où va-t-elle, qui décide. Requêtes paramétrées, échappement à la sortie
et pas à l'entrée, secrets hors du dépôt et hors des couches d'image. *→ dix
lectures du banc entraînent le repérage.*

**Écrire** — le message de commit qui dit *pourquoi*, la description de PR qui
se relit dans six mois, le post-mortem sans coupable. Ce n'est pas mesurable,
donc ça n'entre pas dans le banc, et c'est pourtant ce qui fait le plus vite la
différence entre deux développeurs également compétents.

---

## VI. La direction

Concrètement, la semaine qui rend tout ça opérant :

- **Tous les jours, 10 minutes** — une séance du banc. C'est la mécanique, et
  c'est le seul élément qui exige d'être quotidien.
- **Tous les jours, 5 minutes** — le défi quotidien de DiffDojo. C'est la revue
  de code, servie mieux qu'on ne le ferait ici.
- **Une fois par semaine, une heure** — un texte de la section III. Vingt
  semaines et tu as tout le noyau.
- **Un chapitre par semaine** — le livre en cours de la section IV, dans
  l'ordre. Kleppmann d'abord si tu ne dois en lire qu'un.
- **Un système par trimestre** — CodeCrafters, ou ton propre « écris ton
  propre X ». Rien ne remplace avoir construit la chose dont tu parles.
- **En continu** — le vrai travail. Livrer, tenir en production, être en
  désaccord avec des gens.

L'ordre de ces six lignes est leur ordre de valeur inversé : le dernier compte
le plus, et les cinq premiers ne servent qu'à le rendre meilleur.

---

## VII. Ce que la culture ne remplace pas

Aucune de ces lectures ne remplace d'avoir cassé la production un vendredi
soir. Le savoir livresque te donne les noms des choses — et avoir le nom d'une
chose est ce qui permet de la voir venir la deuxième fois. C'est tout ce qu'il
promet, et c'est déjà énorme.

La progression réelle ressemble à ça : tu lis Parnas, tu ne comprends qu'à
moitié ; six mois plus tard tu vis un couplage qui te coûte trois jours ; et ce
jour-là seulement, le papier devient utile rétroactivement. **Lis-les tôt pour
qu'ils soient là quand l'expérience arrive.**
