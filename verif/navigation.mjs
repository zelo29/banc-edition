/**
 * Les reponses de navigation sont-elles VRAIES ?
 *
 * Une lecture s'execute, un debogage se reproduit. Une navigation n'a rien a
 * executer : sa reponse est un fait sur l'arbre. Ce harnais recalcule donc
 * chaque fait — ou est defini un symbole, qui l'appelle, combien de fichiers
 * importent un module — et le compare a ce que le fichier annonce.
 *
 * Deux garde-fous en plus de la reponse elle-meme :
 *
 *   - L'UNICITE. « Quelle fonction appelle X » n'a de sens que s'il n'y en a
 *     qu'une. Une epreuve a deux reponses justes n'est pas une epreuve, c'est
 *     un piege, et ca ne se voit pas en relisant.
 *   - LA NON-TRIVIALITE. Si le symbole cherche n'apparait que dans un seul
 *     fichier, la question ne demande aucune navigation : la premiere recherche
 *     venue la resout. On exige donc qu'elle ne suffise pas.
 *
 * Enfin, tout genre de preuve non traite ici fait echouer le harnais. C'est ce
 * qui empechera le generateur d'epreuves d'inventer une question que personne
 * ne sait verifier.
 */
import path from 'node:path';
import { NAVIGATIONS } from '../src/navigations/index.ts';
import { reponseJuste } from '../src/banc/epreuves.ts';

let ok = 0, ko = 0;
const v = (nom, attendu, obtenu) => {
  const bon = JSON.stringify(attendu) === JSON.stringify(obtenu);
  bon ? ok++ : ko++;
  console.log(`  ${bon ? 'OK  ' : 'ECHEC'} ${nom}`);
  if (!bon) console.log(`        attendu ${JSON.stringify(attendu)}\n        obtenu  ${JSON.stringify(obtenu)}`);
};

const nav = (id) => NAVIGATIONS.find((n) => n.id === id);
const lignes = (f) => f.code.split('\n');
const commentaire = (l) => /^\s*(\/\/|\*|\/\*)/.test(l);

/** Une declaration, et pas un `export { x } from` qui ne declare rien. */
const estDeclaration = (l, s) =>
  new RegExp(`^\\s*(?:export\\s+)?(?:async\\s+)?(?:function|class|const|let|var)\\s+${s}\\b`).test(l);

/** Le specificateur d'import resolu depuis le fichier qui l'ecrit. */
const resoudre = (chemin, specificateur) =>
  path.posix.normalize(path.posix.join(path.posix.dirname(chemin), specificateur));

const importsDe = (fichier) =>
  lignes(fichier)
    .map((l) => l.match(/^\s*import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/))
    .filter(Boolean)
    .map((m) => ({
      noms: m[1].split(',').map((n) => n.trim()).filter(Boolean),
      vers: resoudre(fichier.chemin, m[2]),
    }));

// --- les cinq genres de preuve ----------------------------------------------
const GENRES = {
  definition(n, p) {
    const trouves = n.fichiers.flatMap((f) =>
      lignes(f)
        .map((l, i) => ({ chemin: f.chemin, ligne: i + 1, texte: l }))
        .filter((x) => estDeclaration(x.texte, p.symbole)),
    );
    return { unique: trouves.length === 1, reponse: trouves[0]?.chemin, trouves };
  },

  appelant(n, p) {
    const appels = n.fichiers.flatMap((f) =>
      lignes(f)
        .map((l, i) => ({ fichier: f, ligne: i, texte: l }))
        .filter(
          (x) =>
            new RegExp(`\\b${p.symbole}\\s*\\(`).test(x.texte) &&
            !estDeclaration(x.texte, p.symbole) &&
            !commentaire(x.texte),
        ),
    );
    if (appels.length !== 1) return { unique: false, reponse: undefined, trouves: appels };
    // La fonction englobante : la declaration la plus proche AU-DESSUS de l'appel.
    const { fichier, ligne } = appels[0];
    const l = lignes(fichier);
    for (let i = ligne; i >= 0; i--) {
      const m =
        l[i].match(/^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/) ||
        l[i].match(/^\s*(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(/);
      if (m) return { unique: true, reponse: m[1], trouves: appels };
    }
    return { unique: false, reponse: undefined, trouves: appels };
  },

  importateurs(n, p) {
    const nb = n.fichiers.filter((f) =>
      importsDe(f).some((i) => i.vers.endsWith(p.module)),
    ).length;
    return { unique: true, reponse: String(nb), trouves: [nb] };
  },

  import(n, p) {
    const source = n.fichiers.find((f) => f.chemin === p.depuis);
    const vus = importsDe(source).filter((i) => i.noms.includes(p.symbole));
    return { unique: vus.length === 1, reponse: vus[0]?.vers, trouves: vus };
  },

  exportInutilise(n, p) {
    const module = n.fichiers.find((f) => f.chemin === p.module);
    const exportes = lignes(module)
      .map((l) => l.match(/^\s*export\s+(?:async\s+)?(?:function|class|const|let|var)\s+(\w+)/))
      .filter(Boolean)
      .map((m) => m[1]);
    const importes = new Set(
      n.fichiers
        .filter((f) => f !== module)
        .flatMap((f) => importsDe(f).filter((i) => i.vers === p.module).flatMap((i) => i.noms)),
    );
    const morts = exportes.filter((e) => !importes.has(e));
    return { unique: morts.length === 1, reponse: morts[0], trouves: morts };
  },
};

// --- chaque epreuve, recalculee ---------------------------------------------
for (const n of NAVIGATIONS) {
  const genre = GENRES[n.preuve.genre];
  if (!genre) {
    v(`« ${n.titre} » : le genre de preuve « ${n.preuve.genre} » est traité`, true, false);
    continue;
  }
  const { unique, reponse, trouves } = genre(n, n.preuve);
  v(`« ${n.titre} » : la question n’a qu’une seule réponse`, true, unique);
  v(`« ${n.titre} » : et c’est bien celle qui est annoncée`,
    true, reponse !== undefined && reponseJuste(String(reponse), n.reponses));
  if (!unique) console.log(`        trouvés : ${JSON.stringify(trouves)}`);
}

// --- la non-trivialite ------------------------------------------------------
// Si le symbole n'apparait que dans un fichier, aucune navigation n'est
// demandee : la premiere recherche venue rend la reponse.
for (const n of NAVIGATIONS) {
  const cible = n.preuve.symbole ?? n.preuve.module;
  const nom = cible.split('/').pop().replace(/\.js$/, '');
  const fichiers = n.fichiers.filter((f) => f.code.includes(nom) || f.chemin.includes(nom)).length;
  v(`« ${n.titre} » : le symbole traverse plusieurs fichiers`, true, fichiers >= 2);
}

// --- l'hygiene du contenu ---------------------------------------------------
v('6 navigations', 6, NAVIGATIONS.length);
v('aucun id en double', NAVIGATIONS.length, new Set(NAVIGATIONS.map((n) => n.id)).size);
v('chaque navigation a au moins trois fichiers', true,
  NAVIGATIONS.every((n) => n.fichiers.length >= 3));
v('aucun chemin en double dans un même arbre', true,
  NAVIGATIONS.every((n) => new Set(n.fichiers.map((f) => f.chemin)).size === n.fichiers.length));
v('chaque navigation a une question et une explication', true,
  NAVIGATIONS.every((n) => n.question.length > 8 && n.explication.length > 20));
v('chaque navigation annonce le format attendu', true,
  NAVIGATIONS.every((n) => typeof n.format === 'string' && n.format.length > 5));
v('les réponses déclarées sont en minuscules sans accent', true,
  NAVIGATIONS.every((n) => n.reponses.every((r) => r === r.toLowerCase() && !/[̀-ͯ]/.test(r.normalize('NFD')))));
v('chaque réponse déclarée est acceptée par le correcteur', true,
  NAVIGATIONS.every((n) => n.reponses.every((r) => reponseJuste(r, n.reponses))));
// Le garde-fou du generateur : un genre invente ne passe pas.
v('tous les genres de preuve utilisés sont implémentés', true,
  NAVIGATIONS.every((n) => typeof GENRES[n.preuve.genre] === 'function'));
v('les cinq genres déclarés sont tous exercés au moins une fois',
  5, new Set(NAVIGATIONS.map((n) => n.preuve.genre)).size);

console.log(`\n  ${ok} verifications passees, ${ko} echec(s)`);
process.exit(ko ? 1 : 0);
