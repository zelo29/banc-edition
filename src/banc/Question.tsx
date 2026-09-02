/**
 * Le panneau de question, commun aux bancs de lecture et de débogage.
 *
 * Le code à gauche, la question à droite, un champ de réponse. Le chronomètre
 * part dès l'affichage : ici, lire EST le travail, contrairement au banc
 * d'édition où le temps de lecture de l'énoncé n'est pas facturé.
 *
 * Une mauvaise réponse ne bloque pas et ne punit pas — elle se compte. C'est
 * elle qui enseigne : le temps dit si tu lis vite, le nombre de tentatives dit
 * si tu as lu ou si tu as deviné.
 *
 * Le composant ne connaît ni l'un ni l'autre banc : il reçoit une question, des
 * réponses acceptées, et un symptôme quand il y en a un.
 */
import { useEffect, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers } from '@codemirror/view';
import { modeDe, type Langage } from './langages';
import { armerChrono, lireChrono } from './chrono';
import { reponseJuste } from './epreuves';

interface Props {
  /** l'identifiant de l'épreuve : il remet le panneau à zéro quand il change */
  cle: string;
  question: string;
  /** Ce qu'on attend — affiché dans le champ, là où on tape. */
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
          EditorView.theme({ '&': { fontSize: '14px', height: '100%' } }),
        ],
      }),
      parent: hote.current,
    });
    return () => vue.destroy();
  }, [source, langage]);

  return <div className="editeur" ref={hote} />;
}

export default function Question({ cle, question, format, reponses, symptome, fige, onReussite }: Props) {
  const [saisie, setSaisie] = useState('');
  const [essais, setEssais] = useState(0);
  const [refuse, setRefuse] = useState(false);
  const champ = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSaisie('');
    setEssais(0);
    setRefuse(false);
    armerChrono();
    champ.current?.focus();
  }, [cle]);

  const repondre = (e: React.FormEvent) => {
    e.preventDefault();
    if (fige || !saisie.trim()) return;
    const n = essais + 1;
    setEssais(n);
    if (reponseJuste(saisie, reponses)) {
      onReussite({ duree: lireChrono(), essais: n, revele: false });
      return;
    }
    // On efface la saisie mais on ne dit pas où est l'erreur : le seul retour
    // utile est « relis », pas « c'est plus haut ».
    setSaisie('');
    setRefuse(true);
    window.setTimeout(() => setRefuse(false), 420);
  };

  return (
    <section className="volet volet-question">
      <p className="volet-titre">{symptome ? 'symptôme' : 'question'}</p>
      <div className="question">
        {symptome && <p className="symptome">{symptome}</p>}
        <p className="question-texte">
          {question}
          {/* Le format est répété ici, à côté de la question et pas en pied de
              page : on perdait des tentatives à deviner ce qu'on devait taper. */}
          <span className="attendu">{format}</span>
        </p>
        <form onSubmit={repondre} className="reponse">
          <input
            ref={champ}
            className={refuse ? 'refuse' : undefined}
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            placeholder={format}
            spellCheck={false}
            autoComplete="off"
            disabled={fige}
            aria-label="ta réponse"
          />
          <button type="submit" disabled={fige}>
            répondre
          </button>
        </form>
        {essais > 0 && (
          <p className="tentatives">
            {essais} tentative{essais > 1 ? 's' : ''}
            {essais > 1 && <span className="tentatives-note"> — relis, ne devine pas</span>}
          </p>
        )}

        {/* Bloquer sans issue n'enseigne rien : au bout de deux tentatives, la
            sortie s'ouvre. Elle coûte l'épreuve — elle ne comptera pas comme
            tenue — mais on repart en ayant vu la réponse plutôt qu'en abandonnant. */}
        {essais >= 2 && !fige && (
          <button
            type="button"
            className="renoncer"
            onClick={() => onReussite({ duree: lireChrono(), essais, revele: true })}
          >
            je ne sais pas — montre-moi
          </button>
        )}
      </div>
    </section>
  );
}

export { Code };
