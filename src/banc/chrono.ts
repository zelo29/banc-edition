/**
 * Le chronomètre des épreuves à question.
 *
 * Le banc d'édition n'a pas ce problème : son journal ne compte que des gestes,
 * et une transaction ne se produit pas quand on n'est pas là. Une lecture, elle,
 * n'a rien à compter — alors une horloge partie à l'affichage tourne pendant la
 * nuit et enregistre quatre heures de « lecture » pour un exercice de trente
 * secondes. C'est arrivé, et ça rend la mesure inutilisable.
 *
 * Le temps ne s'accumule donc que pendant qu'on est là, ce qui suppose deux
 * conditions :
 *
 *   - l'onglet est visible ;
 *   - la dernière activité clavier ou souris date de moins de trois minutes.
 *
 * Le seuil est volontairement généreux, et c'est le point délicat : lire est
 * précisément l'activité où on ne touche à rien. Un seuil serré effacerait le
 * temps de lecture réel, ce qui serait pire que le défaut qu'on corrige. Trois
 * minutes ne prétendent donc pas mesurer la présence — elles BORNENT une
 * absence : quatre heures d'onglet abandonné s'enregistrent comme trois
 * minutes, et non comme quatre heures.
 *
 * Quand l'inactivité est constatée, on suspend au moment où elle a été acquise
 * — dernière activité plus le seuil — et pas à l'instant du constat, qui peut
 * venir des heures trop tard.
 */

/** L'horloge, remplaçable par les harnais de vérification. */
let maintenant = () => Date.now();

/** Au-delà, on considère que la personne n'est plus devant l'écran. */
const INACTIVITE = 180_000;

let cumul = 0;
/** Instant de reprise, ou `null` quand le chronomètre est suspendu. */
let depuis: number | null = null;
let derniereActivite = 0;

function reprendre() {
  if (depuis === null) depuis = maintenant();
}

function suspendre(a: number) {
  if (depuis !== null) {
    cumul += Math.max(0, a - depuis);
    depuis = null;
  }
}

/** Ferme la fenêtre d'inactivité en cours, s'il y en a une. */
function verifier() {
  if (depuis !== null && maintenant() - derniereActivite > INACTIVITE) {
    suspendre(derniereActivite + INACTIVITE);
  }
}

function surActivite() {
  verifier();
  derniereActivite = maintenant();
  reprendre();
}

export function armerChrono() {
  cumul = 0;
  depuis = null;
  derniereActivite = maintenant();
  reprendre();
}

export function lireChrono(): number {
  verifier();
  return cumul + (depuis !== null ? maintenant() - depuis : 0);
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) suspendre(maintenant());
    else surActivite();
  });
  for (const evt of ['keydown', 'pointerdown', 'pointermove', 'wheel'] as const) {
    window.addEventListener(evt, surActivite, { passive: true });
  }
}

/** Pour les vérifications : injecte une horloge et remet le compteur à zéro. */
export function _horloge(f: () => number) {
  maintenant = f;
  cumul = 0;
  depuis = null;
  derniereActivite = 0;
}

/** Pour les vérifications : le seuil au-delà duquel on borne une absence. */
export const _INACTIVITE = INACTIVITE;

/** Pour les vérifications : simule une activité de l'utilisateur. */
export const _activite = surActivite;
