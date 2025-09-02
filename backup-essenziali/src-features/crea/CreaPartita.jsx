import React, { useMemo, useState } from 'react';
import Section from '@ui/Section.jsx';
import { byPlayerFirstAlpha } from '@lib/names.js';
import { DEFAULT_RATING, uid } from '@lib/ids.js';
import { computeFromSets, rpaFactor } from '@lib/rpa.js';
import MatchRow from '@features/matches/MatchRow.jsx';
import { FormulaIntro } from '@ui/formulas/FormulaIntro.jsx';
import { FormulaExplainer } from '@ui/formulas/FormulaExplainer.jsx';

const toLocalInputValue = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  const dt = new Date(d);
  const y = dt.getFullYear(),
    m = pad(dt.getMonth() + 1),
    day = pad(dt.getDate());
  const hh = pad(dt.getHours()),
    mm = pad(dt.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
};

function PlayerSelect({ players, value, onChange, disabledIds, T }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${T.input} pr-8 w-full`}
    >
      <option value="">—</option>
      {players.map((p) => (
        <option key={p.id} value={p.id} disabled={disabledIds?.has(p.id)}>
          {p.name}
        </option>
      ))}
    </select>
  );
}

export default function CreaPartita({
  state,
  setState,
  playersById,
  onShowFormula,
  derivedMatches,
  T,
}) {
  const players = state.players;
  const playersAlpha = useMemo(() => [...players].sort(byPlayerFirstAlpha), [players]);

  const [a1, setA1] = useState('');
  const [a2, setA2] = useState('');
  const [b1, setB1] = useState('');
  const [b2, setB2] = useState('');
  const [sets, setSets] = useState([
    { a: '', b: '' },
    { a: '', b: '' },
    { a: '', b: '' },
  ]);
  const [when, setWhen] = useState(toLocalInputValue(new Date()));

  const rr = computeFromSets(sets);
  const ready = a1 && a2 && b1 && b2 && rr.winner;

  // Ranking coppie live
  const rA1 = a1 ? (playersById[a1]?.rating ?? DEFAULT_RATING) : null;
  const rA2 = a2 ? (playersById[a2]?.rating ?? DEFAULT_RATING) : null;
  const rB1 = b1 ? (playersById[b1]?.rating ?? DEFAULT_RATING) : null;
  const rB2 = b2 ? (playersById[b2]?.rating ?? DEFAULT_RATING) : null;
  const sumA = rA1 != null && rA2 != null ? rA1 + rA2 : null;
  const sumB = rB1 != null && rB2 != null ? rB1 + rB2 : null;
  const pairAText =
    sumA != null ? `${Math.round(sumA)} (${Math.round(rA1)} + ${Math.round(rA2)})` : '—';
  const pairBText =
    sumB != null ? `${Math.round(sumB)} (${Math.round(rB1)} + ${Math.round(rB2)})` : '—';

  const showPreviewFormula = () => {
    const nameA1 = playersById[a1]?.name || '—';
    const nameA2 = playersById[a2]?.name || '—';
    const nameB1 = playersById[b1]?.name || '—';
    const nameB2 = playersById[b2]?.name || '—';

    const sA1 = a1 ? (playersById[a1]?.rating ?? DEFAULT_RATING) : null;
    const sA2 = a2 ? (playersById[a2]?.rating ?? DEFAULT_RATING) : null;
    const sB1 = b1 ? (playersById[b1]?.rating ?? DEFAULT_RATING) : null;
    const sB2 = b2 ? (playersById[b2]?.rating ?? DEFAULT_RATING) : null;

    const sumA = sA1 != null && sA2 != null ? sA1 + sA2 : null;
    const sumB = sB1 != null && sB2 != null ? sB1 + sB2 : null;

    const rrLocal = computeFromSets(sets || []);

    if (!rrLocal.winner || sumA == null || sumB == null) {
      onShowFormula(
        <FormulaIntro
          sumA={sumA}
          sumB={sumB}
          teamALabel={`${nameA1} + ${nameA2}`}
          teamBLabel={`${nameB1} + ${nameB2}`}
        />
      );
      return;
    }

    const gap = rrLocal.winner === 'A' ? sumB - sumA : sumA - sumB;
    const factor = rpaFactor(gap);
    const GD =
      rrLocal.winner === 'A' ? rrLocal.gamesA - rrLocal.gamesB : rrLocal.gamesB - rrLocal.gamesA;
    const base = (sumA + sumB) / 100;
    const P = Math.round((base + GD) * factor);

    onShowFormula(
      <FormulaExplainer
        sumA={sumA}
        sumB={sumB}
        gap={gap}
        factor={factor}
        GD={GD}
        P={P}
        winner={rrLocal.winner}
        sets={sets}
        teamALabel={`${nameA1} + ${nameA2}`}
        teamBLabel={`${nameB1} + ${nameB2}`}
      />
    );
  };

  const addMatch = () => {
    if (!ready)
      return alert(
        'Seleziona 4 giocatori e inserisci i set (best of 3). Il risultato non può finire 1-1.'
      );
    const normSets = (sets || []).map((s) => ({ a: +(s?.a || 0), b: +(s?.b || 0) }));
    const date = new Date(when || Date.now()).toISOString();
    setState((s) => ({
      ...s,
      matches: [
        ...s.matches,
        { id: uid(), date, teamA: [a1, a2], teamB: [b1, b2], sets: normSets },
      ],
    }));
    setA1('');
    setA2('');
    setB1('');
    setB2('');
    setSets([
      { a: '', b: '' },
      { a: '', b: '' },
      { a: '', b: '' },
    ]);
    setWhen(toLocalInputValue(new Date()));
  };

  const delMatch = (id) => {
    if (!confirm('Cancellare la partita?')) return;
    setState((s) => ({ ...s, matches: s.matches.filter((m) => m.id !== id) }));
  };

  return (
    <>
      <Section title="Crea Partita" T={T}>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="font-medium flex items-center gap-2">
              Team A{' '}
              <span className={`text-xs ${T.subtext}`}>
                Ranking coppia: <b>{pairAText}</b>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <PlayerSelect
                T={T}
                players={playersAlpha}
                value={a1}
                onChange={setA1}
                disabledIds={new Set([a2, b1, b2].filter(Boolean))}
              />
              <PlayerSelect
                T={T}
                players={playersAlpha}
                value={a2}
                onChange={setA2}
                disabledIds={new Set([a1, b1, b2].filter(Boolean))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-medium flex items-center gap-2">
              Team B{' '}
              <span className={`text-xs ${T.subtext}`}>
                Ranking coppia: <b>{pairBText}</b>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <PlayerSelect
                T={T}
                players={playersAlpha}
                value={b1}
                onChange={setB1}
                disabledIds={new Set([a1, a2, b2].filter(Boolean))}
              />
              <PlayerSelect
                T={T}
                players={playersAlpha}
                value={b2}
                onChange={setB2}
                disabledIds={new Set([a1, a2, b1].filter(Boolean))}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr,1fr]">
          <div>
            <div className="font-medium mb-1">Data e ora</div>
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className={T.input}
            />
          </div>

          <div>
            <div className="font-medium mb-2">Risultato (best of 3)</div>
            <div className={`w-full overflow-x-auto rounded-xl ${T.border}`}>
              <table className="min-w-[420px] w-full text-sm">
                <thead>
                  <tr className="bg-black/5 dark:bg-white/10">
                    <th className="py-2 px-2 text-left">Set</th>
                    <th className="py-2 px-2 text-center">Team A</th>
                    <th className="py-2 px-2 text-center">Team B</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {[0, 1, 2].map((i) => (
                    <tr key={i}>
                      <td className="py-2 px-2">{i + 1}</td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="0"
                          className={`${T.input} w-24 text-center`}
                          value={sets[i].a}
                          onChange={(e) =>
                            setSets((prev) =>
                              prev.map((s, j) => (j === i ? { ...s, a: e.target.value } : s))
                            )
                          }
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="0"
                          className={`${T.input} w-24 text-center`}
                          value={sets[i].b}
                          onChange={(e) =>
                            setSets((prev) =>
                              prev.map((s, j) => (j === i ? { ...s, b: e.target.value } : s))
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={`mt-2 text-xs ${T.subtext}`}>
              Se dopo 2 set è 1–1, inserisci il 3° set per decidere.
            </div>
          </div>
        </div>

        <div className={`mt-2 text-sm ${T.subtext.replace('600', '300')}`}>
          Sets A-B: {rr.setsA}-{rr.setsB} | Games A-B: {rr.gamesA}-{rr.gamesB}{' '}
          {rr.winner && (
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${T.chip}`}>
              Vince {rr.winner}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button type="button" onClick={addMatch} className={T.btnPrimary}>
            Salva partita
          </button>
          <button type="button" onClick={showPreviewFormula} className={T.btnGhost}>
            Mostra formula punti
          </button>
        </div>
      </Section>

      <Section title="Ultime partite" T={T}>
        <div className="space-y-2">
          {(derivedMatches || [])
            .slice(-20)
            .reverse()
            .map((m) => (
              <MatchRow
                key={m.id}
                m={m}
                playersById={playersById}
                onShowFormula={onShowFormula}
                onDelete={() => delMatch(m.id)}
                T={T}
              />
            ))}
        </div>
      </Section>
    </>
  );
}
