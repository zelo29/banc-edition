/**
 * Les trois compteurs : temps, frappes, souris.
 *
 * La souris est affichée À PART et jamais fondue dans un score unique —
 * « efficacité 0,34 · souris ×8 » enseigne quelque chose, « score 412 » n'enseigne
 * rien. Elle passe en alerte dès le premier usage : c'est le seul jugement que
 * les compteurs se permettent.
 */
import { useEffect, useState } from 'react';
import { observer, type Mesures } from './journal';

const chrono = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

function Compteur({ valeur, etiquette, alerte }: { valeur: string; etiquette: string; alerte?: boolean }) {
  return (
    <div className="compteur">
      <span className="compteur-valeur" style={alerte ? { color: 'var(--alerte)' } : undefined}>
        {valeur}
      </span>
      <span className="compteur-etiquette">{etiquette}</span>
    </div>
  );
}

export default function Compteurs() {
  const [m, setM] = useState<Mesures | null>(null);
  const [, battre] = useState(0);

  useEffect(() => observer(setM), []);

  // Le journal n'émet que sur transaction : sans ce battement, le chronomètre
  // resterait figé entre deux frappes.
  useEffect(() => {
    if (!m?.enCours) return;
    const id = setInterval(() => battre((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [m?.enCours]);

  if (!m) return null;

  return (
    <div className="compteurs" style={{ opacity: m.enCours ? 1 : 0.5 }}>
      <Compteur valeur={chrono(m.duree)} etiquette="temps" />
      <Compteur valeur={String(m.frappes)} etiquette="frappes" />
      <Compteur valeur={String(m.souris)} etiquette="souris" alerte={m.souris > 0} />
    </div>
  );
}
