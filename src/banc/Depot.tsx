/**
 * L'arbre du dépôt : le matériau du banc de navigation.
 *
 * Lire un fichier et chercher dans un arbre sont deux gestes différents. Le
 * premier a besoin d'un éditeur, le second a besoin de trois choses et pas une
 * de plus : la liste des fichiers, celui qu'on a ouvert, et une recherche.
 *
 * TOUT SE FAIT AU CLAVIER, et ce n'était pas le cas.
 *
 * La première version n'offrait que le clic pour changer de fichier — sur un
 * banc dont toute la promesse est le geste, et qui pénalise la souris partout
 * ailleurs. Un banc qui entraîne à chercher dans un arbre et qui n'offre que la
 * souris pour l'ouvrir n'entraîne pas à chercher : il entraîne à cliquer.
 * `depot-clavier.ts` porte les touches, choisies chez VS Code pour qu'elles
 * servent ailleurs qu'ici.
 *
 * Les numéros sont écrits en face des fichiers. Un raccourci qu'on ne voit pas
 * n'existe pas : il faudrait le lire dans un README pour s'en servir, et
 * personne ne lit un README au milieu d'un chronomètre.
 *
 * LA RECHERCHE NE DOIT PAS RÉPONDRE À LA PLACE DU LECTEUR, et elle n'est pas
 * bridée pour autant. Elle fait exactement ce que fait celle d'un éditeur —
 * compter les correspondances par fichier — et ce sont les épreuves qui sont
 * construites pour qu'elle ne suffise pas : quatre fichiers contiennent
 * `DELAI_MAX`, un seul le déclare. Brider l'outil aurait entraîné à naviguer
 * dans un dépôt qui n'existe pas ; le harnais vérifie donc plutôt qu'aucune
 * épreuve ne se résout par une recherche naïve.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Code } from './Question';
import { actionDepot, suivant } from './depot-clavier';
import type { Fichier } from '../navigations/index';

/** Le nombre de correspondances, insensible à la casse comme celle d'un éditeur. */
function compter(code: string, quoi: string): number {
  if (quoi.length < 2) return 0;
  const bas = code.toLowerCase();
  const cherche = quoi.toLowerCase();
  let n = 0;
  for (let i = bas.indexOf(cherche); i !== -1; i = bas.indexOf(cherche, i + cherche.length)) n++;
  return n;
}

export default function Depot({ fichiers, cle }: { fichiers: Fichier[]; cle: string }) {
  const [ouvert, setOuvert] = useState(0);
  const [recherche, setRecherche] = useState('');
  const champ = useRef<HTMLInputElement>(null);

  // `cle` remet l'arbre à zéro quand l'épreuve change : sans ça, on repartait
  // sur le fichier ouvert à l'épreuve précédente, et avec sa recherche encore
  // dans le champ.
  const [derniereCle, setDerniereCle] = useState(cle);
  if (derniereCle !== cle) {
    setDerniereCle(cle);
    setOuvert(0);
    setRecherche('');
  }

  useEffect(() => {
    const clavier = (e: KeyboardEvent) => {
      const dansRecherche = e.target === champ.current;
      const action = actionDepot(e, fichiers.length, dansRecherche);
      if (!action) return;
      e.preventDefault();

      if (action.quoi === 'ouvrir') setOuvert(action.index);
      else if (action.quoi === 'deplacer') setOuvert((n) => suivant(n, action.pas, fichiers.length));
      // `focus()` avant `select()` : la sélection seule ne donne pas le focus de
      // façon fiable, et Ctrl+P sélectionnait donc le texte d'un champ où l'on
      // n'écrivait pas — la frappe suivante partait dans la réponse.
      else if (action.quoi === 'chercher') {
        champ.current?.focus();
        champ.current?.select();
      }
      else {
        // Le champ de réponse appartient à `Question`, qui est un frère rendu
        // par `App`. Le viser par le DOM plutôt que de faire descendre une ref
        // à travers deux composants pour une seule ligne : la classe est
        // stable, et le couplage inverse serait pire que celui-ci.
        champ.current?.blur();
        document.querySelector<HTMLInputElement>('.reponse input')?.focus();
      }
    };
    window.addEventListener('keydown', clavier);
    return () => window.removeEventListener('keydown', clavier);
  }, [fichiers.length]);

  const trouvailles = useMemo(
    () => fichiers.map((f) => compter(f.code, recherche)),
    [fichiers, recherche],
  );
  const total = trouvailles.reduce((n, x) => n + x, 0);
  const fichier = fichiers[ouvert];

  return (
    <section className="volet volet-depot">
      <p className="volet-titre">
        trouve où
        <span className="langage">{fichiers.length} fichiers</span>
      </p>

      <div className="depot">
        <div className="depot-arbre">
          <input
            ref={champ}
            className="depot-recherche"
            type="search"
            value={recherche}
            placeholder="chercher — Ctrl+P"
            aria-label="chercher dans le dépôt"
            onChange={(e) => setRecherche(e.target.value)}
          />
          <ul>
            {fichiers.map((f, i) => (
              <li key={f.chemin}>
                <button
                  type="button"
                  className={i === ouvert ? 'ouvert' : undefined}
                  onClick={() => setOuvert(i)}
                >
                  {i < 9 && <kbd className="depot-touche">{i + 1}</kbd>}
                  <span className="depot-chemin">{f.chemin}</span>
                  {trouvailles[i] > 0 && <span className="depot-compte">{trouvailles[i]}</span>}
                </button>
              </li>
            ))}
          </ul>
          {/* Une recherche sans résultat doit le dire. Un champ qui ne réagit
              pas laisse croire qu'on a mal tapé, et on retape au lieu de
              chercher autre chose. */}
          {recherche.length >= 2 && (
            <p className="depot-resultat">
              {total === 0
                ? 'aucune correspondance'
                : `${total} correspondance${total > 1 ? 's' : ''} dans ${
                    trouvailles.filter(Boolean).length
                  } fichier${trouvailles.filter(Boolean).length > 1 ? 's' : ''}`}
            </p>
          )}
        </div>

        <div className="depot-fichier">
          <Code key={fichier.chemin} source={fichier.code} langage={fichier.langage} />
        </div>
      </div>
    </section>
  );
}
