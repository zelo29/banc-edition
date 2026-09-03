/**
 * La séance : ce que l'outil décide à ta place.
 *
 * C'est le manque que ce module comble, et il n'est pas technique. Un banc qui
 * mesure sans diriger laisse une décision à prendre à chaque ouverture — quel
 * kata, combien de fois, jusqu'à quand — et cette décision, payée tous les
 * jours, est exactement ce qui empêche l'habitude de se former.
 *
 * Une séance a donc une taille fixe et connue d'avance. On sait ce qu'on engage
 * en la lançant, et on peut comparer celle d'aujourd'hui à celle d'hier : même
 * travail, temps qui descend.
 *
 * Le tirage n'est pas aléatoire. Il classe, dans cet ordre :
 *
 *   1. les gestes jamais rencontrés    — apprendre passe avant réviser
 *   2. les gestes vus mais pas acquis  — la dette, remboursée en priorité
 *   3. les gestes acquis               — entretien, du plus ancien au plus récent
 *
 * Et à l'intérieur du premier rang, du kata le moins cher au plus cher. Sans ce
 * détail, la toute première séance — celle qui décide si l'outil est rouvert un
 * jour — servait les cinq katas les plus lourds, 316 caractères d'édition. Elle
 * en fait maintenant 52.
 *
 * Le tri est stable et sans hasard : à état égal, deux séances se ressemblent,
 * et surtout aucun kata ne peut être oublié indéfiniment.
 */
// Extension explicite : les harnais de verif/ chargent ce fichier avec Node,
// qui ne devine pas l'extension comme le fait Vite.
import { cout, type Banc, type Epreuve } from './epreuves.ts';

/** Un essai réussi, tel qu'on le garde entre deux sessions. */
export interface Essai {
  /** fin de l'essai — sert à faire tourner les katas, du plus ancien au plus récent */
  quand: number;
  duree: number;
  frappes: number;
  souris: number;
  efficacite: number;
}

export type Historique = Record<string, Essai[]>;

/**
 * Au-dessus de ce seuil, le geste est tenu : le kata passe en test et son
 * indice disparaît. En dessous, il reste enseigné.
 *
 * 0,7 et non 1 : viser le parcours parfait ferait échouer tout le monde pour
 * une frappe de trop, et un seuil qu'on n'atteint jamais n'enseigne rien.
 */
export const SEUIL_ACQUIS = 0.7;

/** Cinq katas : assez pour sentir une progression, assez court pour être refait demain. */
export const TAILLE_SEANCE = 5;

/**
 * Un geste est acquis s'il a été tenu récemment — pas s'il l'a été une fois, il
 * y a trois semaines. On ne regarde donc que les trois derniers essais.
 */
export function acquis(essais: Essai[] | undefined): boolean {
  if (!essais?.length) return false;
  return essais.slice(-3).some((e) => e.efficacite >= SEUIL_ACQUIS);
}

/**
 * Le rang de priorité d'un kata : plus il est petit, plus le kata est dû.
 *
 * Le second terme ne départage que des katas de même rang, et n'a donc pas le
 * même sens partout : le coût du kata pour un geste neuf, la date du dernier
 * essai pour les autres.
 */
function rang(kata: Epreuve, historique: Historique): [number, number] {
  const essais = historique[kata.id] ?? [];
  if (!essais.length) return [0, cout(kata)];
  return [acquis(essais) ? 2 : 1, essais[essais.length - 1].quand ?? 0];
}

/**
 * Alterne les bancs, en gardant l'ordre reçu à l'intérieur de chacun.
 *
 * Le premier banc servi est celui dont l'épreuve la moins chère arrive en tête,
 * puis on tourne. Aucun hasard : à état égal, deux séances se ressemblent.
 */
function alterner(epreuves: Epreuve[]): Epreuve[] {
  const files = new Map<Banc, Epreuve[]>();
  for (const e of epreuves) {
    const file = files.get(e.banc);
    if (file) file.push(e);
    else files.set(e.banc, [e]);
  }
  const sortie: Epreuve[] = [];
  while (sortie.length < epreuves.length) {
    for (const file of files.values()) {
      const e = file.shift();
      if (e) sortie.push(e);
    }
  }
  return sortie;
}

export function tirer(katas: Epreuve[], taille: number, historique: Historique): Epreuve[] {
  const classe = [...katas].sort((a, b) => {
    const [ra, da] = rang(a, historique);
    const [rb, db] = rang(b, historique);
    return ra - rb || da - db;
  });

  // Le premier rang — les épreuves jamais rencontrées — est réordonné pour
  // alterner les bancs. « Le moins cher d'abord » était la bonne règle quand il
  // n'y avait qu'un banc ; avec quatre, elle laisse le banc le plus fourni
  // occuper toutes les séances. Vingt-six lectures suffisaient à repousser la
  // première navigation à la SEPTIÈME séance : un quart du produit invisible
  // pendant une semaine, sur un outil dont la seule question est de savoir s'il
  // sera rouvert.
  //
  // Ce qui ne change pas : le rang reste prioritaire — dette avant entretien —
  // et à l'intérieur d'un banc, du moins cher au plus cher. La première séance
  // reste courte, mais elle fait maintenant le tour de ce que le banc sait
  // faire au lieu de servir cinq fois la même chose.
  const jamaisVus = classe.filter((e) => !historique[e.id]?.length);
  const dejaVus = classe.filter((e) => historique[e.id]?.length);
  return [...alterner(jamaisVus), ...dejaVus].slice(0, taille);
}

/** Une étape terminée. Tout ce que le bilan a besoin de savoir. */
export interface EtapeFaite {
  banc: Banc;
  kataId: string;
  titre: string;
  geste: string;
  duree: number;
  frappes: number;
  souris: number;
  efficacite: number;
  minimum: number;
  reel: number;
  /** le geste était-il montré ? une réussite enseignée ne vaut pas une réussite testée */
  enseigne: boolean;
  /** a-t-on demandé la réponse ? une épreuve révélée ne compte jamais comme tenue */
  revele?: boolean;
  /** pour un débogage : la note de la réparation, affichée à part et jamais fondue dans le score */
  reparation?: { efficacite: number; minimum: number; reel: number };
}

export interface Bilan {
  duree: number;
  souris: number;
  efficacite: number;
  /**
   * Le seul geste qu'on retient de la séance : le plus coûteux.
   *
   * UN seul, jamais cinq. Une liste de cinq reproches ne se retient pas et ne se
   * travaille pas ; on repart avec la même chose qu'en arrivant, en plus
   * découragé.
   */
  aTravailler: EtapeFaite | null;
  /** les gestes passés au-dessus du seuil sans indice : ceux qui sont vraiment tenus */
  tenus: EtapeFaite[];
}

export function bilan(faites: EtapeFaite[]): Bilan {
  const duree = faites.reduce((n, e) => n + e.duree, 0);
  const souris = faites.reduce((n, e) => n + e.souris, 0);

  // L'efficacité de la séance se calcule sur les totaux, pas en moyennant des
  // moyennes : sinon un kata minuscule pèse autant qu'un kata de trente lignes.
  const minimum = faites.reduce((n, e) => n + e.minimum, 0);
  const reel = faites.reduce((n, e) => n + e.reel, 0);

  const pire = faites.reduce<EtapeFaite | null>(
    (p, e) => (p === null || e.efficacite < p.efficacite ? e : p),
    null,
  );

  return {
    duree,
    souris,
    efficacite: reel === 0 ? 1 : Math.min(1, minimum / reel),
    aTravailler: pire && pire.efficacite < SEUIL_ACQUIS ? pire : null,
    tenus: faites.filter((e) => !e.enseigne && !e.revele && e.efficacite >= SEUIL_ACQUIS),
  };
}

/** L'état d'un geste, vu de loin. */
export type Etat = 'tenu' | 'dette' | 'neuf';

export interface Ligne {
  id: string;
  titre: string;
  etat: Etat;
  essais: number;
  /** meilleure efficacité obtenue, ou null si jamais tenté */
  meilleur: number | null;
}

/**
 * La carte des gestes : où tu en es sur les douze, pas seulement sur les cinq
 * de la séance.
 *
 * Sans elle, vingt essais accumulés ne se voient nulle part et l'outil ne
 * répond pas à la seule question qui fait revenir : est-ce que je progresse ?
 * La dette passe en tête — c'est la seule partie sur laquelle on peut agir.
 */
export function carte(katas: Epreuve[], historique: Historique): Ligne[] {
  const rang: Record<Etat, number> = { dette: 0, neuf: 1, tenu: 2 };
  return katas
    .map((k) => {
      const essais = historique[k.id] ?? [];
      const etat: Etat = !essais.length ? 'neuf' : acquis(essais) ? 'tenu' : 'dette';
      return {
        id: k.id,
        titre: k.titre,
        etat,
        essais: essais.length,
        meilleur: essais.length ? Math.max(...essais.map((e) => e.efficacite)) : null,
      };
    })
    .sort((a, b) => rang[a.etat] - rang[b.etat] || (b.meilleur ?? 0) - (a.meilleur ?? 0));
}

const CLE = 'banc-edition:essais';

export function chargerHistorique(): Historique {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE) ?? '{}');
    return brut && typeof brut === 'object' ? brut : {};
  } catch {
    return {}; // stockage illisible ou désactivé : on repart de zéro, sans bruit
  }
}

export function enregistrer(historique: Historique): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(historique));
  } catch {
    // Navigation privée, quota plein : la séance en cours tient quand même,
    // elle ne survivra simplement pas au rechargement.
  }
}
