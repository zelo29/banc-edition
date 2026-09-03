/**
 * L'hôte CodeMirror. Il ne sait rien du kata : il reçoit un texte de départ,
 * signale chaque changement, et embarque le journal des gestes.
 *
 * L'autocomplétion et le linter sont volontairement absents : ils fausseraient
 * les compteurs (`input.complete` n'est pas une frappe) et entraîneraient le
 * mauvais geste. En mode kata, on mesure la personne, pas l'outil.
 *
 * Les gestes que les katas nomment, eux, doivent exister : c'est `raccourcis.ts`
 * qui les apporte, CodeMirror ne connaissant ni Ctrl+D, ni Ctrl+J, ni Ctrl+H.
 */
import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  drawSelection,
  keymap,
  lineNumbers,
  highlightActiveLine,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { vim } from '@replit/codemirror-vim';
import { journalExtension } from './banc/journal';
import { raccourcisKata } from './banc/raccourcis';
import { themeEditeur } from './banc/theme';

interface Props {
  depart: string;
  vimActif: boolean;
  onChange: (texte: string) => void;
}

export default function Editeur({ depart, vimActif, onChange }: Props) {
  const hote = useRef<HTMLDivElement>(null);
  const vue = useRef<EditorView | null>(null);

  // Le rappel passe par une référence, et n'entre donc pas dans les dépendances
  // de l'effet. Sinon un simple changement d'identité de `onChange` — App le
  // recrée dès que le kata est terminé — détruit et reconstruit l'éditeur, et
  // le volet gauche revient au texte de départ à l'instant même de la réussite.
  const rappel = useRef(onChange);
  rappel.current = onChange;

  useEffect(() => {
    if (!hote.current) return;

    const extensions = [
      // En vim, joindre c'est `J` et supprimer une ligne c'est `dd` : lui voler
      // Ctrl+D pour y mettre un geste VS Code casserait le mode sans rien
      // apprendre. Les deux jeux de gestes ne cohabitent donc pas.
      ...(vimActif ? [vim()] : [raccourcisKata()]),
      lineNumbers(),
      highlightActiveLine(),
      // Sans ces deux-là, le multi-curseur n'existe pas : CodeMirror refuse
      // silencieusement toute sélection secondaire (`addRange` rend une seule
      // plage), et le curseur natif du navigateur n'en dessinerait qu'un de
      // toute façon. Deux katas — Ctrl+D et Ctrl+Alt+↓ — en dépendent
      // entièrement.
      EditorState.allowMultipleSelections.of(true),
      drawSelection(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      javascript(),
      EditorView.updateListener.of((u) => {
        if (u.docChanged) rappel.current(u.state.doc.toString());
      }),
      journalExtension(),
      // Sans lui, CodeMirror se croit sur fond clair : curseur noir invisible et
      // selection blanche sous du texte blanc. Voir `banc/theme.ts`.
      themeEditeur(),
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
  }, [depart, vimActif]);

  return <div className="editeur" ref={hote} />;
}
