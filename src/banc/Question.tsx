/**
 * Le panneau de question, commun aux bancs de lecture et de débogage.
 *
 * Le code d'un côté, la question de l'autre, un champ de réponse. Le chronomètre
 * part dès l'affichage : ici, lire EST le travail, contrairement au banc
 * d'édition où le temps de lecture de l'énoncé n'est pas facturé.
 *
 * Une mauvaise réponse ne bloque pas et ne punit pas — elle se compte. C'est
 * elle qui enseigne : le temps dit si tu lis vite, le nombre de tentatives dit
 * si tu as lu ou si tu as deviné.
 *
 * Le composant ne connaît ni l'un ni l'autre banc : il reçoit une question, des
 * réponses acceptées, et un symptôme quand il y en a un.
 *
 * Trois choses ont été reprises, et les trois punissaient l'honnêteté :
 *
 *   - « je ne sais pas » ne s'ouvrait qu'après DEUX tentatives. On forçait donc
 *     à inventer deux réponses avant d'avoir le droit de dire qu'on ne sait pas.
 *     Un banc qui mesure si tu as lu ou deviné ne peut pas commencer par
 *     obliger à deviner. La sortie est là dès la première seconde, son coût est
 *     écrit dessus.
 *   - une réponse refusée vidait le champ. Un `/` oublié coûtait alors tout le
 *     texte à retaper ET une tentative — soit la moitié de la note, pour une
 *     faute de frappe qui n'apprend rien sur la lecture de code. La saisie reste
 *     et sort sélectionnée : retaper par-dessus coûte exactement ce que ça
 *     coûtait, corriger ne coûte plus rien.
 *   - le seul retour d'un refus était une secousse de 420 ms. Qui regarde
 *     ailleurs à cet instant n'apprend jamais que sa réponse a été refusée, et
 *     un lecteur d'écran n'en sait rien du tout.
 */
import { useEffect, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers } from '@codemirror/view';
import { modeDe, type Langage } from './langages';
import { themeLecture } from './theme';
import { armerChrono, lireChrono } from './chrono';
import { reponseJuste } from './epreuves';

interface Props {
  /** l'identifiant de l'épreuve : il remet le panneau à zéro quand il change */
  cle: string;
  question: string;
  /** Ce qu'on attend — annoncé à côté du champ, là où le regard est. */
  format: string;
  reponses: string[];
  /** le fait observé, quand l'épreuve part d'une panne plutôt que d'une question */
  symptome?: string;
  fige: boolean;
  onReussite: (r: { duree: number; essais: number; revele: boolean }) => void;
}

/** Le code, en lecture seule mais coloré : on lit du vrai code, pas du texte. */
function Code({ source, langage }: { source: string; langage: Langage }) {
  const hote = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hote.current) return;
    const vue = new EditorView({
      state: EditorState.create({
        doc: source,
        extensions: [
          lineNumbers(),
          modeDe(langage),
          EditorState.readOnly.of(true),
          EditorView.editable.of(false),
          themeLecture(),
        ],
      }),
      parent: hote.current,
    });
    // Une vue qui prend la hauteur de son contenu ne declenche aucun
    // redimensionnement en s'inserant, donc aucune reprise de mesure : les cases
    // de la gouttiere gardent la hauteur devinee a la construction et les
    // numeros de ligne finissent tasses en haut, a cote du code qu'ils numerotent.
    const mesure = requestAnimationFrame(() => vue.requestMeasure());
    return () => {
      cancelAnimationFrame(mesure);
      vue.destroy();
    };
  }, [source, langage]);

  return <div className="editeur editeur-lecture" ref={hote} />;
}

export default function Question({ cle, question, format, reponses, symptome, fige, onReussite }: Props) {
  const [saisie, setSaisie] = useState('');
  const [essais, setEssais] = useState(0);
  /** un refus est-il en cours ? il tient jusqu'à la frappe suivante, pas 420 ms */
  const [refuse, setRefuse] = useState(false);
  /** la secousse, elle, doit retomber pour pouvoir être rejouée au refus suivant */
  const [secousse, setSecousse] = useState(false);
  const champ = useRef<HTMLInputElement>(null);
  const minuteur = useRef<number>();

  useEffect(() => {
    setSaisie('');
    setEssais(0);
    setRefuse(false);
    setSecousse(false);
    armerChrono();
    champ.current?.focus();
  }, [cle]);

  useEffect(() => () => window.clearTimeout(minuteur.current), []);

  const repondre = (e: React.FormEvent) => {
    e.preventDefault();
    if (fige || !saisie.trim()) return;
    const n = essais + 1;
    setEssais(n);
    if (reponseJuste(saisie, reponses)) {
      onReussite({ duree: lireChrono(), essais: n, revele: false });
      return;
    }
    // On ne dit toujours pas OÙ est l'erreur : le seul retour utile est
    // « relis », pas « c'est plus haut ». Mais on le dit, et on le laisse écrit.
    setRefuse(true);
    setSecousse(true);
    window.clearTimeout(minuteur.current);
    minuteur.current = window.setTimeout(() => setSecousse(false), 420);
    champ.current?.select();
  };

  // Renoncer sans avoir rien tenté compte quand même pour une tentative : sinon
  // l'épreuve entre au bilan avec un réel de zéro, et une séance où l'on a tout
  // fait montrer remonterait à 100 % d'efficacité.
  const renoncer = () => onReussite({ duree: lireChrono(), essais: Math.max(1, essais), revele: true });

  return (
    <section className="volet volet-question">
      <p className="volet-titre">{symptome ? 'symptôme' : 'question'}</p>
      <div className="question">
        {symptome && <p className="symptome">{symptome}</p>}
        <p className="question-texte">{question}</p>

        <form onSubmit={repondre} className="reponse">
          {/* Le format était écrit deux fois — sous la question ET dans le
              champ — et l'un des deux disparaissait à la première touche. Une
              seule fois, en étiquette : une étiquette reste pendant qu'on tape,
              un texte de remplacement non. */}
          <label className="reponse-etiquette" htmlFor="champ-reponse">
            ta réponse <span className="attendu">{format}</span>
          </label>
          <div className="reponse-ligne">
            <input
              id="champ-reponse"
              ref={champ}
              className={`${refuse ? 'refuse' : ''} ${secousse ? 'secoue' : ''}`.trim() || undefined}
              value={saisie}
              onChange={(e) => {
                setSaisie(e.target.value);
                setRefuse(false);
              }}
              spellCheck={false}
              autoComplete="off"
              disabled={fige}
              aria-invalid={refuse}
              aria-describedby="retour-reponse"
            />
            <button type="submit" disabled={fige}>
              répondre
            </button>
          </div>
        </form>

        {/* Rendu en permanence, et de hauteur réservée : un retour qui apparaît
            fait sauter le bouton du dessous sous le doigt. `role="status"` pour
            que le refus soit annoncé, et pas seulement secoué. */}
        <p id="retour-reponse" className={`tentatives ${refuse ? 'tentatives-refus' : ''}`} role="status">
          {refuse && <b>non — relis, ne devine pas.</b>}
          {essais > 0 && (
            <span className="tentatives-compte">
              {essais} tentative{essais > 1 ? 's' : ''}
            </span>
          )}
        </p>

        {/* Elle est là dès le début : forcer deux réponses inventées avant
            d'avoir le droit de dire « je ne sais pas » fabriquait exactement le
            geste que ce banc cherche à mesurer. Elle coûte l'épreuve, et c'est
            écrit dessus — assez pour ne pas la prendre par confort. */}
        {!fige && (
          <button type="button" className="renoncer" onClick={renoncer}>
            je ne sais pas — montre-moi
            <small>l’épreuve ne comptera pas comme tenue</small>
          </button>
        )}
      </div>
    </section>
  );
}

export { Code };
