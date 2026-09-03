/**
 * L'arbre du dépôt : le matériau du banc de navigation.
 *
 * Lire un fichier et chercher dans un arbre sont deux gestes différents. Le
 * premier a besoin d'un éditeur, le second a besoin de trois choses et pas une
 * de plus : la liste des fichiers, celui qu'on a ouvert, et une recherche.
 *
 * LA RECHERCHE NE DOIT PAS RÉPONDRE À LA PLACE DU LECTEUR, et elle n'est pas
 * bridée pour autant. Elle fait exactement ce que fait celle d'un éditeur —
 * compter les correspondances par fichier — et ce sont les épreuves qui sont
 * construites pour qu'elle ne suffise pas : quatre fichiers contiennent
 * `DELAI_MAX`, un seul le déclare. Brider l'outil aurait entraîné à naviguer
 * dans un dépôt qui n'existe pas ; le harnais vérifie donc plutôt qu'aucune
 * épreuve ne se résout par une recherche naïve.
 *
 * Le compteur par fichier est le seul élément d'interface qui enseigne quelque
 * chose ici : voir « 3 · 1 · 1 · 1 » réparti sur quatre fichiers est
 * exactement l'information qu'on lit dans un vrai dépôt, et apprendre à ne pas
 * ouvrir le fichier qui en a le plus est une bonne partie du geste.
 */
import { useMemo, useState } from 'react';
import { Code } from './Question';
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

  // `cle` remet l'arbre à zéro quand l'épreuve change : sans ça, on repartait
  // sur le fichier ouvert à l'épreuve précédente, et avec sa recherche encore
  // dans le champ.
  const [derniereCle, setDerniereCle] = useState(cle);
  if (derniereCle !== cle) {
    setDerniereCle(cle);
    setOuvert(0);
    setRecherche('');
  }

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
            className="depot-recherche"
            type="search"
            value={recherche}
            placeholder="chercher dans le dépôt"
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
