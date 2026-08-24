/**
 * L'écran de kata.
 *
 * Départ à gauche, cible à droite, trois compteurs en haut, barre de progression
 * en bas. Rien d'autre : pendant un kata, tout pixel qui n'est pas du code est
 * une distraction facturée à l'utilisateur.
 *
 * Tab relance, Entrée passe au suivant — sans menu ni confirmation. La friction
 * entre deux essais est ce qui tue la répétition, et la répétition est le seul
 * mécanisme d'apprentissage du produit.
 */
import { useCallback, useEffect, useState } from 'react';
import Editeur from './Editeur';
import Compteurs from './banc/Compteurs';
import { arreter, lire, demarrer } from './banc/journal';
import { KATAS } from './katas';

/** Compare en ignorant les espaces de fin de ligne : l'éditeur en ajoute, pas l'humain. */
const normaliser = (t: string) => t.replace(/[ \t]+$/gm, '').trimEnd();

/** Part de la cible déjà atteinte, en caractères communs depuis le début. */
function progression(courant: string, cible: string) {
  const a = normaliser(courant);
  const b = normaliser(cible);
  let commun = 0;
  while (commun < a.length && commun < b.length && a[commun] === b[commun]) commun++;
  return Math.min(1, commun / Math.max(1, b.length));
}

export default function App() {
  const [index, setIndex] = useState(0);
  const [essai, setEssai] = useState(0);
  const [texte, setTexte] = useState(KATAS[0].depart);
  const [reussi, setReussi] = useState(false);
  const [vimActif, setVimActif] = useState(false);
  const [historique, setHistorique] = useState<Record<string, number[]>>({});

  const kata = KATAS[index];

  const relancer = useCallback(
    (nouvelIndex = index) => {
      setIndex(nouvelIndex);
      setTexte(KATAS[nouvelIndex].depart);
      setReussi(false);
      setEssai((n) => n + 1);
      demarrer();
    },
    [index],
  );

  const onChange = useCallback(
    (t: string) => {
      setTexte(t);
      if (!reussi && normaliser(t) === normaliser(kata.cible)) {
        arreter();
        const m = lire();
        setReussi(true);
        setHistorique((h) => ({ ...h, [kata.id]: [...(h[kata.id] ?? []), m.duree] }));
      }
    },
    [kata, reussi],
  );

  useEffect(() => {
    const clavier = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !e.shiftKey && reussi) {
        e.preventDefault();
        relancer();
      } else if (e.key === 'Enter' && reussi) {
        e.preventDefault();
        relancer((index + 1) % KATAS.length);
      }
    };
    window.addEventListener('keydown', clavier);
    return () => window.removeEventListener('keydown', clavier);
  }, [reussi, index, relancer]);

  const m = lire();
  const part = progression(texte, kata.cible);
  const temps = historique[kata.id] ?? [];

  return (
    <div className="ecran">
      <header className="barre">
        <div className="titre">
          <span className="kata-num">{String(index + 1).padStart(2, '0')}</span>
          <span>{kata.titre}</span>
        </div>
        <Compteurs />
        <label className="vim">
          <input type="checkbox" checked={vimActif} onChange={(e) => setVimActif(e.target.checked)} />
          vim
        </label>
      </header>

      <main className="volets">
        <section className="volet">
          <p className="volet-titre">départ — édite ici</p>
          <Editeur key={`${kata.id}-${essai}-${vimActif}`} depart={kata.depart} vimActif={vimActif} onChange={onChange} />
        </section>
        <section className="volet">
          <p className="volet-titre">cible</p>
          <pre className="cible">{kata.cible}</pre>
        </section>
      </main>

      <footer className="pied">
        <div className="jauge" aria-label="progression vers la cible">
          <div className="jauge-remplie" style={{ width: `${Math.round(part * 100)}%` }} />
        </div>
        {reussi ? (
          <div className="reussite">
            <strong>Réussi</strong> en {(m.duree / 1000).toFixed(1)} s · {m.frappes} frappes ·{' '}
            <span style={m.souris ? { color: 'var(--alerte)' } : undefined}>{m.souris} souris</span>
            <span className="geste">{kata.geste}</span>
            {temps.length > 1 && (
              <span className="courbe">
                {temps.map((t, i) => (
                  <span
                    key={i}
                    className="barre-essai"
                    style={{ height: `${Math.max(8, (t / Math.max(...temps)) * 34)}px` }}
                    title={`essai ${i + 1} — ${(t / 1000).toFixed(1)} s`}
                  />
                ))}
              </span>
            )}
            <span className="aide">
              <kbd>Tab</kbd> recommencer · <kbd>Entrée</kbd> suivant
            </span>
          </div>
        ) : (
          <div className="aide">{Math.round(part * 100)} % de la cible</div>
        )}
      </footer>
    </div>
  );
}
