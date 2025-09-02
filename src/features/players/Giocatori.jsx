import React, { useMemo, useState } from 'react';
import Section from '@ui/Section.jsx';
import { DEFAULT_RATING, uid } from '@lib/ids.js';
import { byPlayerFirstAlpha } from '@lib/names.js';

export default function Giocatori({ state, setState, onOpenStats, playersById, T }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [startRank, setStartRank] = useState(String(DEFAULT_RATING));

  const players = Array.isArray(state?.players) ? state.players : [];
  const playersAlpha = useMemo(() => [...players].sort(byPlayerFirstAlpha), [players]);

  const add = () => {
    const fn = firstName.trim(); const ln = lastName.trim();
    if (!fn || !ln) return;
    const n = `${fn} ${ln}`.trim();
    const start = Number(startRank || DEFAULT_RATING) || DEFAULT_RATING;

    setState((s) => {
      const cur = Array.isArray(s?.players) ? s.players : [];
      return { ...(s || { players: [], matches: [] }), players: [...cur, { id: uid(), name: n, baseRating: start, rating: start }] };
    });

    setFirstName(''); setLastName(''); setStartRank(String(DEFAULT_RATING));
  };

  const remove = (id) => {
    if (!confirm('Rimuovere il giocatore?')) return;
    setState((s) => {
      const cur = Array.isArray(s?.players) ? s.players : [];
      return { ...(s || { players: [], matches: [] }), players: cur.filter((p) => p.id !== id) };
    });
  };

  return (
    <Section title="Giocatori" T={T}>
      <form onSubmit={(e) => { e.preventDefault(); add(); }} className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mb-4 items-stretch sm:items-end">
        <div className="flex flex-col flex-1 min-w-[140px]">
          <label className={`text-xs ${T.subtext}`}>Nome</label>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nome" className={`${T.input} w-full`} />
        </div>
        <div className="flex flex-col flex-1 min-w-[160px]">
          <label className={`text-xs ${T.subtext}`}>Cognome</label>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Cognome" className={`${T.input} w-full`} />
        </div>
        <div className="flex flex-col w-full sm:w-auto sm:min-w-[160px]">
          <label className={`text-xs ${T.subtext}`}>Ranking iniziale</label>
          <input type="number" value={startRank} onChange={(e) => setStartRank(e.target.value)} className={`${T.input} w-full`} />
        </div>
        <button type="submit" className={T.btnPrimary}>Aggiungi</button>
      </form>

      <div className="grid md:grid-cols-2 gap-2">
        {playersAlpha.length === 0 ? (
          <div className={`text-sm ${T.subtext}`}>Nessun giocatore presente.</div>
        ) : (
          playersAlpha.map((p) => {
            const liveRating = playersById?.[p.id]?.rating ?? p.rating ?? DEFAULT_RATING;
            return (
              <div key={p.id} className={`rounded-xl ${T.cardBg} ${T.border} p-3 flex items-center justify-between`}>
                <div className="min-w-0">
                  <button type="button" onClick={() => onOpenStats?.(p.id)} className="font-medium hover:opacity-80 transition truncate">{p.name}</button>
                  <div className={`text-xs ${T.subtext}`}>Ranking: {Number(liveRating).toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button type="button" onClick={() => onOpenStats?.(p.id)} className={T.link}>Statistiche</button>
                  <button type="button" onClick={() => remove(p.id)} className="text-rose-500 hover:opacity-80 text-sm">Elimina</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Section>
  );
}

