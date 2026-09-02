/**
 * La coloration par langage.
 *
 * Le banc de lecture n'a rien de spécifique à JavaScript : un Dockerfile, une
 * requête SQL ou un script shell se lisent de la même façon — un extrait, une
 * question, une réponse exacte. Étendre le banc aux technologies du métier ne
 * demandait donc pas un nouveau banc, seulement du matériau neuf et de quoi le
 * colorer.
 *
 * La coloration n'est pas un ornement ici : on lit du code réel, et lire du SQL
 * en noir et blanc n'entraîne pas la même chose que lire du SQL dans un éditeur.
 */
import { StreamLanguage } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { sql } from '@codemirror/lang-sql';
import { yaml } from '@codemirror/lang-yaml';
import { css } from '@codemirror/lang-css';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { dockerFile } from '@codemirror/legacy-modes/mode/dockerfile';
import type { Extension } from '@codemirror/state';

export type Langage = 'js' | 'ts' | 'sql' | 'yaml' | 'css' | 'shell' | 'docker' | 'texte';

/**
 * `texte` rend un tableau vide, et c'est volontaire : une requête HTTP ou une
 * expression régulière n'ont pas de mode, et un mode approchant colorerait faux.
 */
export function modeDe(langage: Langage): Extension {
  switch (langage) {
    case 'js': return javascript();
    case 'ts': return javascript({ typescript: true });
    case 'sql': return sql();
    case 'yaml': return yaml();
    case 'css': return css();
    case 'shell': return StreamLanguage.define(shell);
    case 'docker': return StreamLanguage.define(dockerFile);
    case 'texte': return [];
  }
}

/** L'étiquette affichée sur l'épreuve : le lecteur doit savoir ce qu'il lit. */
export const NOM_LANGAGE: Record<Langage, string> = {
  js: 'javascript',
  ts: 'typescript',
  sql: 'sql',
  yaml: 'yaml',
  css: 'css',
  shell: 'bash',
  docker: 'dockerfile',
  texte: 'http',
};
