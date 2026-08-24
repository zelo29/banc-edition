/**
 * L'hôte CodeMirror. Il ne sait rien du kata : il reçoit un texte de départ,
 * signale chaque changement, et embarque le journal des gestes.
 *
 * L'autocomplétion et le linter sont volontairement absents : ils fausseraient
 * les compteurs (`input.complete` n'est pas une frappe) et entraîneraient le
 * mauvais geste. En mode kata, on mesure la personne, pas l'outil.
 */
import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { vim } from '@replit/codemirror-vim';
import { journalExtension } from './banc/journal';

interface Props {
  depart: string;
  vimActif: boolean;
  onChange: (texte: string) => void;
}

export default function Editeur({ depart, vimActif, onChange }: Props) {
  const hote = useRef<HTMLDivElement>(null);
  const vue = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!hote.current) return;

    const extensions = [
      ...(vimActif ? [vim()] : []),
      lineNumbers(),
      highlightActiveLine(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      javascript(),
      EditorView.updateListener.of((u) => {
        if (u.docChanged) onChange(u.state.doc.toString());
      }),
      journalExtension(),
      EditorView.theme({ '&': { fontSize: '14px', height: '100%' } }),
    ];

    const v = new EditorView({
      state: EditorState.create({ doc: depart, extensions }),
      parent: hote.current,
    });
    vue.current = v;
    v.focus();

    return () => {
      v.destroy();
      vue.current = null;
    };
    // Recréer l'éditeur à chaque kata : c'est le moyen le plus sûr de repartir
    // d'un état vierge, historique d'annulation compris.
  }, [depart, vimActif, onChange]);

  return <div className="editeur" ref={hote} />;
}
