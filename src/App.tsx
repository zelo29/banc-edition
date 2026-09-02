/**
 * L'écran de séance.
 *
 * Cinq épreuves, enchaînées toutes seules, puis un bilan qui ne retient qu'UN
 * geste. Aucun menu, aucun choix : la décision « qu'est-ce que je travaille
 * aujourd'hui », payée à chaque ouverture, est ce qui empêche l'habitude de se
 * former. C'est le tirage de `seance.ts` qui décide.
 *
 * Deux bancs cohabitent — éditer et lire — et la séance ne fait pas la
 * différence : elle tire des épreuves. Seul cet écran sait laquelle afficher.
 *
 * Tant qu'un geste n'est pas acquis, il est MONTRÉ. Un banc qui juge sans jamais
 * montrer n'entraîne personne.
 *
 * Ctrl+Entrée recommence l'étape, de partout. Échap aussi, hors de l'éditeur.
 * Tab, jamais : c'est un geste de kata, et le lui prendre annulait des réussites.
 */
import { useCallback, useEffect, useState } from 'react';
import Editeur from './Editeur';
import Compteurs from './banc/Compteurs';
import Question, { Code } from './banc/Question';
import { armer, arreter, lire } from './banc/journal';
import { lireChrono } from './banc/chrono';
import { NOM_LANGAGE } from './banc/langages';
import { progression, score } from './banc/score';
import { EPREUVES, type Epreuve } from './banc/epreuves';
import {
  acquis,
  bilan,
  carte,
  chargerHistorique,
  enregistrer,
  tirer,
  TAILLE_SEANCE,
  type EtapeFaite,
  type Historique,
} from './banc/seance';
import { TOUCHES_VOLEES } from './banc/raccourcis';

/**
 * Le temps d'affichage du résultat avant l'enchaînement automatique. Assez pour
 * lire « 68 % », pas assez pour avoir à décider quoi que ce soit.
 */
const PAUSE = 1600;
/** Une lecture mérite plus : on y affiche ce qu'il fallait voir. */
const PAUSE_LECTURE = 4200;

/** Compare en ignorant les espaces de fin de ligne : l'éditeur en ajoute, pas l'humain. */
const normaliser = (t: string) => t.replace(/[ \t]+$/gm, '').trimEnd();

export default function App() {
  const [historique, setHistorique] = useState<Historique>(chargerHistorique);
  const [seance, setSeance] = useState(() => tirer(EPREUVES, TAILLE_SEANCE, historique));
  const [etape, setEtape] = useState(0);
  const [faites, setFaites] = useState<EtapeFaite[]>([]);
  const [phase, setPhase] = useState<'kata' | 'bilan'>('kata');

  const [texte, setTexte] = useState(() => {
    const e = seance[0];
    return e.banc === 'edition' ? e.depart : '';
  });
  const [fini, setFini] = useState<EtapeFaite | null>(null);
  const [essai, setEssai] = useState(0);
  const [vimActif, setVimActif] = useState(false);
  const [enseigne, setEnseigne] = useState(() => !acquis(historique[seance[0].id]));

  // Un débogage se fait en deux temps : localiser, puis réparer. Pointer une
  // ligne ne laisse rien dans les mains — c'est l'édition de la correction qui
  // fait qu'on repart avec le geste, et pas seulement avec la bonne réponse.
  const [reparation, setReparation] = useState(false);
  const [diagnostic, setDiagnostic] = useState<{ duree: number; essais: number; revele: boolean } | null>(null);

  const epreuve = seance[etape];

  const ouvrir = useCallback((e: Epreuve, hist: Historique) => {
    setReparation(false);
    setDiagnostic(null);
    setTexte(e.banc === 'edition' ? e.depart : '');
    setEnseigne(!acquis(hist[e.id]));
    setFini(null);
    setEssai((n) => n + 1);
    armer();
  }, []);

  const recommencer = useCallback(() => {
    ouvrir(epreuve, historique);
  }, [epreuve, historique, ouvrir]);

  const avancer = useCallback(() => {
    if (etape + 1 >= seance.length) {
      setPhase('bilan');
      setFini(null);
      return;
    }
    setEtape(etape + 1);
    ouvrir(seance[etape + 1], historique);
  }, [etape, seance, historique, ouvrir]);

  // Le tirage suivant tient compte de ce qui vient d'être fait : une épreuve
  // ratée revient tout de suite, une épreuve tenue passe en entretien.
  const nouvelleSeance = useCallback(() => {
    const tiree = tirer(EPREUVES, TAILLE_SEANCE, historique);
    setSeance(tiree);
    setEtape(0);
    setFaites([]);
    setPhase('kata');
    ouvrir(tiree[0], historique);
  }, [historique, ouvrir]);

  /** Enregistre une réussite, quel que soit le banc. */
  const reussir = useCallback(
    (faite: EtapeFaite) => {
      setFini(faite);
      setFaites((f) => [...f, faite]);
      setHistorique((h) => {
        const suite = {
          ...h,
          [faite.kataId]: [
            ...(h[faite.kataId] ?? []),
            {
              quand: Date.now(),
              duree: faite.duree,
              frappes: faite.frappes,
              souris: faite.souris,
              efficacite: faite.efficacite,
            },
          ],
        };
        enregistrer(suite);
        return suite;
      });
    },
    [],
  );

  const onChange = useCallback(
    (t: string) => {
      setTexte(t);
      if (fini || phase !== 'kata') return;

      const depart = epreuve.banc === 'edition' ? epreuve.depart : epreuve.code;
      const cible =
        epreuve.banc === 'edition'
          ? epreuve.cible
          : epreuve.banc === 'debogage' && reparation
            ? epreuve.correction
            : null;
      if (cible === null || normaliser(t) !== normaliser(cible)) return;

      arreter();
      const m = lire();
      const s = score(depart, cible, m.caracteres);

      if (epreuve.banc === 'edition') {
        reussir({
          banc: 'edition',
          kataId: epreuve.id,
          titre: epreuve.titre,
          geste: epreuve.geste,
          duree: m.duree,
          frappes: m.frappes,
          souris: m.souris,
          efficacite: s.efficacite,
          minimum: s.minimum,
          reel: s.reel,
          enseigne,
        });
        return;
      }

      // Débogage : la note de l'épreuve est celle du DIAGNOSTIC — c'est ce que
      // ce banc entraîne. L'efficacité de la réparation est affichée à part, et
      // jamais fondue dedans : deux échelles dans un seul chiffre n'enseignent
      // plus rien, c'est la règle du produit depuis le premier compteur.
      const d = diagnostic!;
      reussir({
        banc: 'debogage',
        kataId: epreuve.id,
        titre: epreuve.titre,
        geste: epreuve.geste,
        duree: d.duree + m.duree,
        frappes: m.frappes,
        souris: m.souris,
        efficacite: d.revele ? 0 : 1 / d.essais,
        minimum: 1,
        reel: d.essais,
        enseigne,
        revele: d.revele,
        reparation: { efficacite: s.efficacite, minimum: s.minimum, reel: s.reel },
      });
    },
    [epreuve, fini, phase, enseigne, reussir, reparation, diagnostic],
  );

  // Lecture et débogage se mesurent autrement : le minimum est UNE réponse, le
  // réel est le nombre de réponses données. Juste du premier coup vaut 100 %.
  const onReponse = useCallback(
    ({ duree, essais, revele }: { duree: number; essais: number; revele: boolean }) => {
      if (fini || epreuve.banc === 'edition') return;

      // Le diagnostic n'est que la moitié d'un débogage : on enchaîne sur la
      // réparation, où la version correcte sert de cible. On repart donc TOUJOURS
      // en ayant écrit le correctif — y compris quand on a renoncé à trouver.
      if (epreuve.banc === 'debogage') {
        setDiagnostic({ duree, essais, revele });
        setReparation(true);
        setTexte(epreuve.code);
        setEssai((n) => n + 1);
        armer();
        return;
      }

      reussir({
        banc: 'lecture',
        kataId: epreuve.id,
        titre: epreuve.titre,
        geste: epreuve.geste,
        duree,
        frappes: 0,
        souris: 0,
        efficacite: revele ? 0 : 1 / essais,
        minimum: 1,
        reel: essais,
        enseigne,
        revele,
      });
    },
    [epreuve, fini, enseigne, reussir],
  );

  useEffect(() => {
    if (!fini || phase !== 'kata') return;
    const id = setTimeout(avancer, fini.banc === 'lecture' ? PAUSE_LECTURE : PAUSE);
    return () => clearTimeout(id);
  }, [fini, phase, avancer]);

  useEffect(() => {
    const clavier = (e: KeyboardEvent) => {
      const dansEditeur = !!(e.target as HTMLElement)?.closest?.('.cm-editor');
      const dansChamp = (e.target as HTMLElement)?.tagName === 'INPUT';

      // Firefox s'approprie Ctrl+D, Ctrl+J, Ctrl+H… qui sont des gestes de kata.
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && TOUCHES_VOLEES.has(e.key.toLowerCase())) {
        e.preventDefault();
      }

      if (phase === 'bilan') {
        if (e.key === 'Tab' || e.key === 'Enter') {
          e.preventDefault();
          nouvelleSeance();
        }
        return;
      }

      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        recommencer();
        return;
      }

      // Entrée valide une réponse de lecture : ne pas la lui prendre.
      if (e.key === 'Enter' && fini) {
        e.preventDefault();
        avancer();
        return;
      }

      if (e.key === 'Escape' && (!dansEditeur || fini) && !dansChamp) {
        e.preventDefault();
        recommencer();
      }
    };
    window.addEventListener('keydown', clavier);
    return () => window.removeEventListener('keydown', clavier);
  }, [phase, fini, recommencer, avancer, nouvelleSeance]);

  if (phase === 'bilan') {
    const b = bilan(faites);
    const lignes = carte(EPREUVES, historique);
    const dette = lignes.filter((l) => l.etat === 'dette');
    const tenus = lignes.filter((l) => l.etat === 'tenu').length;
    const neufs = lignes.filter((l) => l.etat === 'neuf').length;

    return (
      <div className="ecran ecran-bilan">
        <div className="bilan">
          <p className="bilan-titre">séance terminée</p>
          <p className="bilan-chiffres">
            <span>{(b.duree / 1000).toFixed(0)} s</span>
            <span>{(b.efficacite * 100).toFixed(0)} % d’efficacité</span>
            <span style={b.souris ? { color: 'var(--alerte)' } : undefined}>{b.souris} souris</span>
          </p>

          {b.aTravailler ? (
            <div className="bilan-geste">
              <p className="bilan-etiquette">le geste à travailler</p>
              <p className="bilan-conseil">{b.aTravailler.geste}</p>
              <p className="bilan-detail">
                sur « {b.aTravailler.titre} » —{' '}
                {b.aTravailler.banc === 'lecture'
                  ? `${b.aTravailler.reel} tentatives, une seule suffisait`
                  : `${b.aTravailler.reel} caractères brassés, ${b.aTravailler.minimum} suffisaient`}
              </p>
            </div>
          ) : (
            <div className="bilan-geste">
              <p className="bilan-etiquette">rien à corriger</p>
              <p className="bilan-conseil">Les cinq gestes sont tenus. Reviens demain.</p>
            </div>
          )}

          <ul className="bilan-liste">
            {faites.map((e) => (
              <li key={e.kataId}>
                <span className="bilan-nom">
                  <i className={`puce ${e.banc}`} title={e.banc} />
                  {e.titre}
                </span>
                <span className="bilan-barre">
                  <i style={{ width: `${Math.round(e.efficacite * 100)}%` }} />
                </span>
                <span className="bilan-pct">{(e.efficacite * 100).toFixed(0)} %</span>
                {e.enseigne && (
                  <span className="bilan-marque" title="le geste était montré : ça ne compte pas comme tenu">
                    montré
                  </span>
                )}
              </li>
            ))}
          </ul>

          <div className="carte">
            <p className="bilan-etiquette">tes {lignes.length} gestes</p>
            <div className="carte-points">
              {lignes.map((l) => (
                <i
                  key={l.id}
                  className={`pastille ${l.etat}`}
                  title={
                    l.etat === 'neuf'
                      ? `${l.titre} — jamais rencontré`
                      : `${l.titre} — ${(l.meilleur! * 100).toFixed(0)} % au mieux, ${l.essais} essai${l.essais > 1 ? 's' : ''}`
                  }
                />
              ))}
            </div>
            <p className="carte-compte">
              <b>{tenus}</b> tenus · <b className="en-dette">{dette.length}</b> en dette ·{' '}
              <b>{neufs}</b> à découvrir
            </p>
            {dette.length > 0 && (
              <p className="carte-dette">en dette : {dette.map((l) => l.titre).join(' · ')}</p>
            )}
          </div>

          <p className="aide">
            <kbd>Tab</kbd> nouvelle séance
          </p>
        </div>
      </div>
    );
  }

  // Un débogage bascule en édition dès que le diagnostic est posé : même
  // éditeur, même mesure, la version correcte en cible.
  const enEdition = epreuve.banc === 'edition' || (epreuve.banc === 'debogage' && reparation);
  const depart = epreuve.banc === 'edition' ? epreuve.depart : epreuve.banc === 'debogage' ? epreuve.code : '';
  const cible = epreuve.banc === 'edition' ? epreuve.cible : epreuve.banc === 'debogage' ? epreuve.correction : '';
  const part = enEdition ? progression(texte, depart, cible) : 0;

  return (
    <div className="ecran">
      <header className="barre">
        <div className="titre">
          <span className="points" aria-label={`épreuve ${etape + 1} sur ${seance.length}`}>
            {seance.map((e, i) => (
              <i key={e.id} className={i < etape ? 'fait' : i === etape ? 'courant' : ''} />
            ))}
          </span>
          <span className={`banc-nom ${epreuve.banc}`}>{epreuve.banc}</span>
          <span>{epreuve.titre}</span>
        </div>
        {epreuve.banc === 'edition' ? <Compteurs /> : <ChronoLecture cle={epreuve.id} />}
        <label className="vim">
          <input
            type="checkbox"
            checked={vimActif}
            onChange={(e) => setVimActif(e.target.checked)}
            disabled={epreuve.banc !== 'edition'}
          />
          vim
        </label>
      </header>

      {reparation && epreuve.banc === 'debogage' ? (
        <p className="indice indice-cause">
          <span className="indice-etiquette">cause</span>
          {epreuve.explication}
        </p>
      ) : (
        enseigne && (
          <p className="indice">
            <span className="indice-etiquette">geste</span>
            {epreuve.geste}
          </p>
        )
      )}

      <main className="volets">
        {enEdition ? (
          <>
            <section className="volet">
              <p className="volet-titre">{reparation ? 'répare ici' : 'départ — édite ici'}</p>
              <Editeur
                key={`${epreuve.id}-${essai}-${vimActif}`}
                depart={depart}
                vimActif={vimActif}
                onChange={onChange}
              />
            </section>
            <section className="volet">
              <p className="volet-titre">{reparation ? 'la version correcte' : 'cible'}</p>
              <pre className="cible">{cible}</pre>
            </section>
          </>
        ) : (
          <>
            <section className="volet">
              <p className="volet-titre">
                {epreuve.banc === 'debogage' ? 'le code fautif' : 'lis ce code'}
                <span className="langage">{NOM_LANGAGE[epreuve.langage]}</span>
              </p>
              <Code key={`${epreuve.id}-${essai}`} source={epreuve.code} langage={epreuve.langage} />
            </section>
            <Question
              key={`${epreuve.id}-${essai}`}
              cle={epreuve.id}
              question={epreuve.question}
              format={epreuve.format}
              reponses={epreuve.reponses}
              symptome={epreuve.banc === 'debogage' ? epreuve.symptome : undefined}
              fige={fini !== null}
              onReussite={onReponse}
            />
          </>
        )}
      </main>

      <footer className="pied">
        <div className="jauge" aria-label="progression vers la cible">
          <div className="jauge-remplie" style={{ width: `${Math.round(part * 100)}%` }} />
        </div>

        {fini ? (
          <div className="reussite">
            <span className="efficacite" title="minimum théorique / réel">
              {(fini.efficacite * 100).toFixed(0)} %<small>efficacité</small>
            </span>
            {fini.banc === 'debogage' ? (
              <>
                <span className="detail">
                  {fini.revele ? (
                    <b>réponse révélée</b>
                  ) : (
                    <>
                      diagnostic : {fini.reel} tentative{fini.reel > 1 ? 's' : ''}
                    </>
                  )}{' '}
                  · {(fini.duree / 1000).toFixed(1)} s
                </span>
                {fini.reparation && (
                  <span className="detail">
                    réparation : {(fini.reparation.efficacite * 100).toFixed(0)} % —{' '}
                    {fini.reparation.minimum} caractères suffisaient, {fini.reparation.reel} brassés
                  </span>
                )}
              </>
            ) : fini.banc === 'edition' ? (
              <>
                <span className="detail">
                  {(fini.duree / 1000).toFixed(1)} s · {fini.frappes} frappes ·{' '}
                  <span style={fini.souris ? { color: 'var(--alerte)' } : undefined}>
                    {fini.souris} souris
                  </span>
                </span>
                <span className="detail">
                  {fini.minimum} caractères suffisaient, {fini.reel} brassés
                  {fini.reel > fini.minimum && (
                    <>
                      {' '}
                      — <b>{fini.reel - fini.minimum} pour rien</b>
                    </>
                  )}
                </span>
              </>
            ) : (
              <>
                <span className="detail">
                  {(fini.duree / 1000).toFixed(1)} s · {fini.reel} tentative
                  {fini.reel > 1 ? 's' : ''}
                </span>
                <span className="detail explication">
                  {(epreuve as Extract<Epreuve, { banc: 'lecture' | 'debogage' }>).explication}
                </span>
              </>
            )}
          </div>
        ) : (
          <div className="aide">
            {enEdition
              ? `${Math.round(part * 100)} % de la cible`
              : epreuve.banc === 'debogage'
                ? 'remonte du symptôme à la ligne, puis tu la répareras'
                : 'réponds en un mot, un nombre, ou un numéro de ligne'}
            <span className="detail">
              <kbd>Ctrl+Entrée</kbd> recommencer
            </span>
          </div>
        )}
      </footer>
    </div>
  );
}

/**
 * Le chronomètre des lectures : le journal ne mesure que des gestes d'édition.
 *
 * Il lit le même compteur que la mesure — pas une horloge parallèle — pour que
 * ce qui s'affiche soit exactement ce qui sera enregistré.
 */
function ChronoLecture({ cle }: { cle: string }) {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    setMs(0);
    const id = setInterval(() => setMs(lireChrono()), 250);
    return () => clearInterval(id);
  }, [cle]);
  const s = Math.floor(ms / 1000);
  return (
    <div className="compteurs">
      <div className="compteur">
        <span className="compteur-valeur">
          {String(Math.floor(s / 60)).padStart(2, '0')}:{String(s % 60).padStart(2, '0')}
        </span>
        <span className="compteur-etiquette">temps</span>
      </div>
    </div>
  );
}
