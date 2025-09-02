// =============================================
// FILE: src/features/stats/StatisticheGiocatore.jsx
// =============================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Section from '@ui/Section.jsx';
import ShareButtons from '@ui/ShareButtons.jsx';
import ModernAreaChart from '@ui/charts/ModernAreaChart.jsx';
import { byPlayerFirstAlpha, surnameOf, IT_COLLATOR } from '@lib/names.js';
import { DEFAULT_RATING } from '@lib/ids.js';
import { computeFromSets } from '@lib/rpa.js';
import { FormulaRPA } from '@ui/formulas/FormulaRPA.jsx';

export default function StatisticheGiocatore({
  players,
  matches,
  selectedPlayerId,
  onSelectPlayer,
  onShowFormula,
  T,
}) {
  const statsRef = useRef(null);
  const [pid, setPid] = useState(selectedPlayerId || players[0]?.id || '');
  const [comparePlayerId, setComparePlayerId] = useState('');
  // Filtri periodo richiesti: 1w, 2w, 30d, 3m, 6m, all
  const [timeFilter, setTimeFilter] = useState('all');
  // Match espanso nello storico
  const [expandedMatchId, setExpandedMatchId] = useState(null);

  useEffect(() => {
    if (selectedPlayerId) setPid(selectedPlayerId);
  }, [selectedPlayerId]);

  const nameById = (id) => players.find((p) => p.id === id)?.name || id;
  const player = players.find((p) => p.id === pid) || null;
  const comparePlayer = players.find((p) => p.id === comparePlayerId) || null;

  // Filtro temporale per le partite
  const filteredMatches = useMemo(() => {
    if (timeFilter === 'all') return matches;
    const now = new Date();
    const from = new Date();
    switch (timeFilter) {
      case '1w':
        from.setDate(now.getDate() - 7);
        break;
      case '2w':
        from.setDate(now.getDate() - 14);
        break;
      case '30d':
        from.setDate(now.getDate() - 30);
        break;
      case '3m':
        from.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        from.setMonth(now.getMonth() - 6);
        break;
      default:
        return matches;
    }
    return (matches || []).filter((m) => new Date(m.date) >= from);
  }, [matches, timeFilter]);

  const sortedByRating = useMemo(() => [...players].sort((a, b) => b.rating - a.rating), [players]);
  const position = player ? sortedByRating.findIndex((p) => p.id === player.id) + 1 : null;
  const totalPlayed = (player?.wins || 0) + (player?.losses || 0);
  const winPct = totalPlayed ? Math.round((player.wins / totalPlayed) * 100) : 0;

  // Statistiche avanzate del giocatore (usa filteredMatches)
  const advancedStats = useMemo(() => {
    if (!pid) return null;

    const playerMatches = (filteredMatches || []).filter(
      (m) => (m.teamA || []).includes(pid) || (m.teamB || []).includes(pid)
    );

    if (playerMatches.length === 0) return null;

    let maxWinStreak = 0;
    let maxLoseStreak = 0;
    let currentWinStreak = 0;
    let currentLoseStreak = 0;
    let wins = 0;
    let losses = 0;
    let totalDelta = 0;
    let gamesWon = 0;
    let gamesLost = 0;
    let closeMatches = 0; // 2-1 o 1-2
    let dominantWins = 0; // 2-0

    const sortedMatches = [...playerMatches].sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedMatches.forEach((m) => {
      const isA = (m.teamA || []).includes(pid);
      const won = (isA && m.winner === 'A') || (!isA && m.winner === 'B');
      const delta = isA ? m.deltaA || 0 : m.deltaB || 0;

      totalDelta += delta;

      if (won) {
        wins++;
        currentWinStreak++;
        currentLoseStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);

        if ((isA && m.setsA === 2 && m.setsB === 0) || (!isA && m.setsB === 2 && m.setsA === 0)) {
          dominantWins++;
        }
      } else {
        losses++;
        currentLoseStreak++;
        currentWinStreak = 0;
        maxLoseStreak = Math.max(maxLoseStreak, currentLoseStreak);
      }

      // Calcola close matches (2-1 o 1-2)
      if ((m.setsA === 2 && m.setsB === 1) || (m.setsA === 1 && m.setsB === 2)) {
        closeMatches++;
      }

      // Calcola games
      if (isA) {
        gamesWon += m.gamesA || 0;
        gamesLost += m.gamesB || 0;
      } else {
        gamesWon += m.gamesB || 0;
        gamesLost += m.gamesA || 0;
      }
    });

    // Streak attuale sul periodo filtrato (continua finché non cambia risultato)
    let currentStreakCount = 0;
    let lastResult = null;
    for (let i = sortedMatches.length - 1; i >= 0; i--) {
      const m = sortedMatches[i];
      const isA = (m.teamA || []).includes(pid);
      const won = (isA && m.winner === 'A') || (!isA && m.winner === 'B');
      if (lastResult === null) {
        lastResult = won;
        currentStreakCount = 1;
      } else if (lastResult === won) {
        currentStreakCount++;
      } else {
        break;
      }
    }

    const avgDelta = totalDelta / playerMatches.length;
    const gameEfficiency = gamesWon + gamesLost > 0 ? (gamesWon / (gamesWon + gamesLost)) * 100 : 0;
    const dominanceRate = wins > 0 ? (dominantWins / wins) * 100 : 0;
    const clutchRate = closeMatches > 0 ? ((wins - dominantWins) / closeMatches) * 100 : 0;

    return {
      wins,
      losses,
      winRate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0,
      currentStreak:
        lastResult === null ? 0 : lastResult ? currentStreakCount : -currentStreakCount,
      maxWinStreak,
      maxLoseStreak,
      avgDelta: Math.round(avgDelta * 10) / 10,
      gameEfficiency: Math.round(gameEfficiency * 10) / 10,
      dominanceRate: Math.round(dominanceRate * 10) / 10,
      clutchRate: Math.round(clutchRate * 10) / 10,
      totalMatches: playerMatches.length,
      closeMatches,
      dominantWins,
    };
  }, [pid, filteredMatches]);

  // Nessun radar o barre: design semplificato come richiesto

  const StatCard = ({ label, value, sub, trend, color = 'default' }) => {
    const colorClasses = {
      default: '',
      success: 'text-green-600 dark:text-green-400',
      danger: 'text-red-600 dark:text-red-400',
      warning: 'text-yellow-600 dark:text-yellow-400',
      primary: 'text-blue-600 dark:text-blue-400',
    };

    return (
      <div className={`rounded-2xl ${T.cardBg} ${T.border} p-4 text-center`}>
        <div className={`text-xs uppercase tracking-wide ${T.subtext}`}>{label}</div>
        <div className={`text-3xl font-bold leading-tight ${colorClasses[color]}`}>
          {value}
          {trend && (
            <span
              className={`text-xs ml-1 ${trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-500'}`}
            >
              {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'}
            </span>
          )}
        </div>
        {sub ? <div className={`text-xs ${T.subtext} mt-1`}>{sub}</div> : null}
      </div>
    );
  };

  const playersAlpha = useMemo(() => [...players].sort(byPlayerFirstAlpha), [players]);

  // Timeline rating personale
  const timeline = useMemo(() => {
    if (!pid) return [];
    const current = new Map(
      players.map((p) => [
        p.id,
        Number(p.baseRating ?? p.startRating ?? p.rating ?? DEFAULT_RATING),
      ])
    );
    const points = [];
    points.push({
      date: null,
      label: 'Start',
      rating: Math.round(current.get(pid) ?? DEFAULT_RATING),
    });

    const byDate = [...(filteredMatches || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
    for (const m of byDate) {
      const rr = computeFromSets(m.sets);
      const add = (id, d) => current.set(id, (current.get(id) ?? DEFAULT_RATING) + d);
      const deltaA = m.deltaA ?? 0,
        deltaB = m.deltaB ?? 0;
      add(m.teamA[0], deltaA);
      add(m.teamA[1], deltaA);
      add(m.teamB[0], deltaB);
      add(m.teamB[1], deltaB);
      if (m.teamA.includes(pid) || m.teamB.includes(pid)) {
        points.push({
          date: new Date(m.date),
          label: new Date(m.date).toLocaleString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
          rating: Math.round(current.get(pid) ?? DEFAULT_RATING),
        });
      }
    }
    return points;
  }, [pid, players, filteredMatches]);

  const partnerAndOppStats = useMemo(() => {
    if (!pid) return { mates: [], opps: [] };
    const played = (filteredMatches || []).filter(
      (m) => (m.teamA || []).includes(pid) || (m.teamB || []).includes(pid)
    );
    const matesMap = new Map();
    const oppsMap = new Map();

    const bump = (map, id, won) => {
      if (!id) return;
      const cur = map.get(id) || { wins: 0, losses: 0 };
      if (won) cur.wins++;
      else cur.losses++;
      map.set(id, cur);
    };

    for (const m of played) {
      const isA = (m.teamA || []).includes(pid);
      const won = (isA && m.winner === 'A') || (!isA && m.winner === 'B');
      const mate = isA
        ? (m.teamA || []).find((x) => x !== pid)
        : (m.teamB || []).find((x) => x !== pid);
      const foes = isA ? m.teamB || [] : m.teamA || [];
      if (mate) bump(matesMap, mate, won);
      for (const f of foes) bump(oppsMap, f, won);
    }

    const toArr = (map) =>
      [...map.entries()]
        .map(([id, v]) => {
          const total = v.wins + v.losses;
          const wp = total ? Math.round((v.wins / total) * 100) : 0;
          return { id, name: nameById(id), wins: v.wins, losses: v.losses, total, winPct: wp };
        })
        .sort(
          (a, b) => b.total - a.total || b.winPct - a.winPct || IT_COLLATOR.compare(a.name, b.name)
        );

    return { mates: toArr(matesMap), opps: toArr(oppsMap) };
  }, [pid, filteredMatches, players]);

  const RecordBar = ({ wins, losses }) => {
    const total = wins + losses || 1;
    const w = Math.round((wins / total) * 100);
    const l = 100 - w;
    return (
      <div className="w-full h-2 rounded-full overflow-hidden flex">
        <div style={{ width: `${w}%` }} className="bg-emerald-500" />
        <div style={{ width: `${l}%` }} className="bg-rose-500" />
      </div>
    );
  };

  const PersonRow = ({ item }) => (
    <div className={`rounded-xl ${T.cardBg} ${T.border} p-3 flex items-center gap-3`}>
      <div className="min-w-0 flex-1">
        <div className="font-medium truncate">{item.name}</div>
        <div className={`text-xs ${T.subtext}`}>
          {item.total} partite • Win rate {item.winPct}%
        </div>
      </div>
      <div className="w-24 sm:w-32">
        <RecordBar wins={item.wins} losses={item.losses} />
      </div>
      <div className="text-xs shrink-0">
        <span className="text-emerald-500 font-semibold">+{item.wins}</span>
        <span className={`mx-1 ${T.subtext}`}>/</span>
        <span className="text-rose-500 font-semibold">-{item.losses}</span>
      </div>
    </div>
  );

  // UI helpers

  const buildCaption = () => {
    const lines = [
      `Statistiche — ${player ? player.name : ''}`,
      `Rating: ${player ? Math.round(player.rating) : '-'}`,
      `Record: ${advancedStats?.wins || 0}–${advancedStats?.losses || 0} (${Math.round(advancedStats?.winRate || 0)}%)`,
      `Game Eff.: ${advancedStats ? advancedStats.gameEfficiency : 0}% • Δ medio: ${advancedStats ? advancedStats.avgDelta : 0}`,
      '#MarsicaPadel #Padel',
    ];
    return lines.join('\n');
  };
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#stats-${pid || ''}`
      : '';

  return (
    <Section
      title="Statistiche giocatore"
      right={
        <ShareButtons
          size="sm"
          title={`Statistiche — ${player ? player.name : ''}`}
          url={shareUrl}
          captureRef={statsRef}
          captionBuilder={buildCaption}
          T={T}
        />
      }
      T={T}
    >
      <div ref={statsRef}>
        {/* Header con controlli */}
        <div className="grid md:grid-cols-5 gap-3 mb-6 items-end">
          <div className="md:col-span-1">
            <div className={`text-xs font-medium ${T.subtext} mb-1`}>Giocatore</div>
            <select
              value={pid}
              onChange={(e) => {
                setPid(e.target.value);
                onSelectPlayer?.(e.target.value);
              }}
              className={`${T.input} w-full`}
            >
              {playersAlpha.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <div className={`text-xs font-medium ${T.subtext} mb-1`}>Periodo</div>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className={`${T.input} w-full`}
            >
              <option value="1w">1 settimana</option>
              <option value="2w">2 settimane</option>
              <option value="30d">30 giorni</option>
              <option value="3m">3 mesi</option>
              <option value="6m">6 mesi</option>
              <option value="all">Tutto</option>
            </select>
          </div>
          <StatCard label="Posizione" value={position ?? '-'} />
          <StatCard
            label="Rating"
            value={player ? Math.round(player.rating) : '-'}
            color="primary"
          />
          <StatCard
            label="Win Rate"
            value={`${advancedStats ? Math.round(advancedStats.winRate) : 0}%`}
            sub={`${advancedStats?.wins || 0}–${advancedStats?.losses || 0}`}
          />
        </div>
        {/* Metriche chiave richieste */}
        {advancedStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard
              label="Efficienza game"
              value={`${advancedStats.gameEfficiency}%`}
              sub="% game vinti"
              color="primary"
            />
            <StatCard
              label="Δ medio"
              value={
                advancedStats.avgDelta > 0
                  ? `+${advancedStats.avgDelta}`
                  : `${advancedStats.avgDelta}`
              }
              sub="punti per partita"
              color={advancedStats.avgDelta >= 0 ? 'success' : 'danger'}
            />
            <StatCard
              label="Streak migliori"
              value={`${advancedStats.maxWinStreak}`}
              sub="vittorie consecutive"
              color="success"
            />
            <StatCard
              label="Streak attive"
              value={
                advancedStats.currentStreak > 0
                  ? `+${advancedStats.currentStreak}`
                  : `${advancedStats.currentStreak}`
              }
              sub={
                advancedStats.currentStreak === 0
                  ? 'equilibrio'
                  : advancedStats.currentStreak > 0
                    ? 'vittorie'
                    : 'sconfitte'
              }
              color={
                advancedStats.currentStreak > 0
                  ? 'success'
                  : advancedStats.currentStreak < 0
                    ? 'danger'
                    : 'default'
              }
            />
          </div>
        )}

        {/* Grafico rating */}
        <div className={`rounded-2xl ${T.cardBg} ${T.border} p-4 mb-6`}>
          <div className="font-medium mb-3 flex items-center justify-between">
            <span>Andamento rating</span>
            <span className="text-xs text-gray-500">
              {timeFilter === 'all' ? 'Tutte le partite' : `Periodo attivo`}
            </span>
          </div>
          <ModernAreaChart
            data={timeline}
            dataKey="rating"
            chartId={`player-${pid}`}
            color="success"
            title="Evoluzione del rating"
          />
        </div>

        {/* Confronto diretto */}
        <div className={`rounded-2xl ${T.cardBg} ${T.border} p-4 mb-6`}>
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium">Confronto diretto</div>
            <select
              value={comparePlayerId}
              onChange={(e) => setComparePlayerId(e.target.value)}
              className={`${T.input} max-w-sm`}
            >
              <option value="">Seleziona un giocatore…</option>
              {playersAlpha
                .filter((p) => p.id !== pid)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>

          {comparePlayerId ? (
            (() => {
              const cp = players.find((p) => p.id === comparePlayerId);
              // Calcola advanced per compare usando gli stessi filtri
              const cmpMatches = (filteredMatches || []).filter(
                (m) => (m.teamA || []).includes(cp.id) || (m.teamB || []).includes(cp.id)
              );
              let cWins = 0,
                cLosses = 0,
                cTotalDelta = 0,
                cGamesWon = 0,
                cGamesLost = 0;
              let cMaxWin = 0,
                cMaxLose = 0,
                cCurWin = 0,
                cCurLose = 0;
              const cmpSorted = [...cmpMatches].sort((a, b) => new Date(a.date) - new Date(b.date));
              cmpSorted.forEach((m) => {
                const isA = (m.teamA || []).includes(cp.id);
                const won = (isA && m.winner === 'A') || (!isA && m.winner === 'B');
                const delta = isA ? m.deltaA || 0 : m.deltaB || 0;
                if (won) {
                  cWins++;
                  cCurWin++;
                  cCurLose = 0;
                  cMaxWin = Math.max(cMaxWin, cCurWin);
                } else {
                  cLosses++;
                  cCurLose++;
                  cCurWin = 0;
                  cMaxLose = Math.max(cMaxLose, cCurLose);
                }
                if (isA) {
                  cGamesWon += m.gamesA || 0;
                  cGamesLost += m.gamesB || 0;
                } else {
                  cGamesWon += m.gamesB || 0;
                  cGamesLost += m.gamesA || 0;
                }
                cTotalDelta += delta;
              });
              let cCurrentStreak = 0;
              let last = null;
              for (let i = cmpSorted.length - 1; i >= 0; i--) {
                const m = cmpSorted[i];
                const isA = (m.teamA || []).includes(cp.id);
                const won = (isA && m.winner === 'A') || (!isA && m.winner === 'B');
                if (last === null) {
                  last = won;
                  cCurrentStreak = 1;
                } else if (last === won) {
                  cCurrentStreak++;
                } else break;
              }
              cCurrentStreak = last === null ? 0 : last ? cCurrentStreak : -cCurrentStreak;
              const cWinRate =
                cWins + cLosses > 0 ? Math.round((cWins / (cWins + cLosses)) * 100) : 0;
              const cGameEff =
                cGamesWon + cGamesLost > 0
                  ? Math.round((cGamesWon / (cGamesWon + cGamesLost)) * 1000) / 10
                  : 0;
              const cAvgDelta =
                cWins + cLosses > 0 ? Math.round((cTotalDelta / (cWins + cLosses)) * 10) / 10 : 0;

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`border-b ${T.border} ${T.tableHeadText}`}>
                        <th className="text-left py-2">Metrica</th>
                        <th className="text-center py-2">{player?.name || '-'}</th>
                        <th className="text-center py-2">{cp?.name || '-'}</th>
                        <th className="text-center py-2">Diff</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-black/5 dark:border-white/5">
                        <td className="py-2 font-medium">Rating</td>
                        <td className="text-center py-2">
                          {player ? Math.round(player.rating) : '-'}
                        </td>
                        <td className="text-center py-2">{cp ? Math.round(cp.rating) : '-'}</td>
                        <td className="text-center py-2">
                          {player && cp ? Math.round(player.rating - cp.rating) : '-'}
                        </td>
                      </tr>
                      <tr className="border-b border-black/5 dark:border-white/5">
                        <td className="py-2 font-medium">Win Rate</td>
                        <td className="text-center py-2">
                          {advancedStats ? Math.round(advancedStats.winRate) : 0}%
                        </td>
                        <td className="text-center py-2">{cWinRate}%</td>
                        <td className="text-center py-2">
                          {advancedStats ? Math.round(advancedStats.winRate - cWinRate) : 0}%
                        </td>
                      </tr>
                      <tr className="border-b border-black/5 dark:border-white/5">
                        <td className="py-2 font-medium">Partite giocate</td>
                        <td className="text-center py-2">
                          {advancedStats ? advancedStats.totalMatches : 0}
                        </td>
                        <td className="text-center py-2">{cWins + cLosses}</td>
                        <td className="text-center py-2">
                          {advancedStats ? advancedStats.totalMatches - (cWins + cLosses) : 0}
                        </td>
                      </tr>
                      <tr className="border-b border-black/5 dark:border-white/5">
                        <td className="py-2 font-medium">Efficienza game</td>
                        <td className="text-center py-2">
                          {advancedStats ? advancedStats.gameEfficiency : 0}%
                        </td>
                        <td className="text-center py-2">{cGameEff}%</td>
                        <td className="text-center py-2">
                          {advancedStats
                            ? Math.round((advancedStats.gameEfficiency - cGameEff) * 10) / 10
                            : 0}
                          %
                        </td>
                      </tr>
                      <tr className="border-b border-black/5 dark:border-white/5">
                        <td className="py-2 font-medium">Δ medio</td>
                        <td className="text-center py-2">
                          {advancedStats ? advancedStats.avgDelta : 0}
                        </td>
                        <td className="text-center py-2">{cAvgDelta}</td>
                        <td className="text-center py-2">
                          {advancedStats
                            ? Math.round((advancedStats.avgDelta - cAvgDelta) * 10) / 10
                            : 0}
                        </td>
                      </tr>
                      <tr className="border-b border-black/5 dark:border-white/5">
                        <td className="py-2 font-medium">Streak migliori</td>
                        <td className="text-center py-2">
                          {advancedStats ? advancedStats.maxWinStreak : 0}
                        </td>
                        <td className="text-center py-2">{cMaxWin}</td>
                        <td className="text-center py-2">
                          {advancedStats ? advancedStats.maxWinStreak - cMaxWin : 0}
                        </td>
                      </tr>
                      <tr className="border-b border-black/5 dark:border-white/5">
                        <td className="py-2 font-medium">Streak peggiori</td>
                        <td className="text-center py-2">
                          {advancedStats ? advancedStats.maxLoseStreak : 0}
                        </td>
                        <td className="text-center py-2">{cMaxLose}</td>
                        <td className="text-center py-2">
                          {advancedStats ? advancedStats.maxLoseStreak - cMaxLose : 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 font-medium">Streak attive</td>
                        <td className="text-center py-2">
                          {advancedStats ? advancedStats.currentStreak : 0}
                        </td>
                        <td className="text-center py-2">{cCurrentStreak}</td>
                        <td className="text-center py-2">
                          {advancedStats ? advancedStats.currentStreak - cCurrentStreak : 0}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })()
          ) : (
            <div className={`text-sm ${T.subtext}`}>
              Seleziona un giocatore per confrontare le statistiche
            </div>
          )}
        </div>

        {/* Storico partite nel periodo */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">
              Storico partite {timeFilter !== 'all' ? '(periodo filtrato)' : ''}
            </div>
            <div className="text-xs text-gray-500">
              {
                (filteredMatches || []).filter(
                  (m) => (m.teamA || []).includes(pid) || (m.teamB || []).includes(pid)
                ).length
              }{' '}
              partite
            </div>
          </div>
          <div className="space-y-3">
            {(filteredMatches || [])
              .filter((m) => (m.teamA || []).includes(pid) || (m.teamB || []).includes(pid))
              .slice()
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((m) => {
                const isA = (m.teamA || []).includes(pid);
                const delta = isA ? (m.deltaA ?? 0) : (m.deltaB ?? 0);
                const won = (isA && m.winner === 'A') || (!isA && m.winner === 'B');
                const selfTeam = (isA ? m.teamA : m.teamB)
                  .map((id) => surnameOf(nameById(id)))
                  .join(' & ');
                const oppTeam = (isA ? m.teamB : m.teamA)
                  .map((id) => surnameOf(nameById(id)))
                  .join(' & ');
                const selfTeamFull = (isA ? m.teamA : m.teamB)
                  .map((id) => nameById(id))
                  .join(' & ');
                const oppTeamFull = (isA ? m.teamB : m.teamA).map((id) => nameById(id)).join(' & ');
                const selfCls = won
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-rose-600 dark:text-rose-400 font-semibold';
                const oppCls = won
                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                  : 'text-emerald-600 dark:text-emerald-400 font-semibold';
                const isExpanded = expandedMatchId === m.id;

                return (
                  <div
                    key={m.id}
                    className={`rounded-xl ${T.cardBg} ${T.border} overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-blue-500/40 dark:ring-blue-400/60' : ''}`}
                  >
                    {/* Riga compatta cliccabile */}
                    <div
                      className="p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpandedMatchId(isExpanded ? null : m.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setExpandedMatchId((prev) => (prev === m.id ? null : m.id));
                        }
                      }}
                      aria-expanded={isExpanded}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${won ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200'}`}
                          >
                            {won ? '✓ Vittoria' : '✗ Sconfitta'}
                          </span>
                          {m.date && (
                            <span className="text-xs text-gray-500 dark:text-gray-300">
                              {new Date(m.date).toLocaleDateString('it-IT', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </span>
                          )}
                        </div>
                        <div className="text-sm mb-1">
                          <span className={`${selfCls} font-medium`}>{selfTeam}</span>
                          <span className={`mx-2 text-gray-500 dark:text-gray-300`}>vs</span>
                          <span className={`${oppCls} font-medium`}>{oppTeam}</span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-200">
                          Sets {isA ? m.setsA : m.setsB}-{isA ? m.setsB : m.setsA} • Games{' '}
                          {isA ? m.gamesA : m.gamesB}-{isA ? m.gamesB : m.gamesA}
                        </div>
                      </div>
                      <div className="shrink-0 text-right flex items-center gap-2">
                        <div>
                          <div
                            className={`text-lg font-bold ${delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
                          >
                            {delta >= 0 ? '+' : ''}
                            {Math.round(delta)}
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">punti</div>
                        </div>
                        <div className="text-gray-400 dark:text-gray-300 text-sm">
                          {isExpanded ? '▲' : '▼'}
                        </div>
                      </div>
                    </div>

                    {/* Dettagli espansi - versione compatta */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 dark:border-gray-500 bg-gray-50 dark:bg-gray-700">
                        <div className="p-4 space-y-4">
                          {/* Squadre */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div
                              className={`p-3 rounded-lg border-2 ${won ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-900/40' : 'border-gray-300 bg-white dark:border-gray-500 dark:bg-gray-600'}`}
                            >
                              <div className="font-semibold text-gray-900 dark:text-white mb-1">
                                {selfTeamFull}
                              </div>
                              <div className="text-xs text-gray-700 dark:text-gray-200">
                                Sets: {isA ? m.setsA : m.setsB} • Games: {isA ? m.gamesA : m.gamesB}
                              </div>
                            </div>
                            <div
                              className={`p-3 rounded-lg border-2 ${!won ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-900/40' : 'border-gray-300 bg-white dark:border-gray-500 dark:bg-gray-600'}`}
                            >
                              <div className="font-semibold text-gray-900 dark:text-white mb-1">
                                {oppTeamFull}
                              </div>
                              <div className="text-xs text-gray-700 dark:text-gray-200">
                                Sets: {isA ? m.setsB : m.setsA} • Games: {isA ? m.gamesB : m.gamesA}
                              </div>
                            </div>
                          </div>

                          {/* Set dettaglio compatto */}
                          {Array.isArray(m.sets) && m.sets.length > 0 && (
                            <div>
                              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                Set per set:
                              </div>
                              <div className="flex gap-2">
                                {m.sets.map((s, i) => (
                                  <span
                                    key={i}
                                    className="px-3 py-2 bg-white dark:bg-gray-600 rounded-lg text-sm border-2 border-gray-200 dark:border-gray-400 text-gray-900 dark:text-white font-medium"
                                  >
                                    {s.a}-{s.b}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Formula compatta */}
                          <div className="border-t border-gray-300 dark:border-gray-500 pt-4">
                            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                              Calcolo punti RPA:
                            </div>
                            <div className="text-sm space-y-2 text-gray-800 dark:text-gray-100">
                              <div className="bg-white dark:bg-gray-600 p-2 rounded border dark:border-gray-500">
                                <strong>Rating:</strong> A={Math.round(m.sumA || 0)} vs B=
                                {Math.round(m.sumB || 0)} (Gap: {Math.round(m.gap || 0)})
                              </div>
                              <div className="bg-white dark:bg-gray-600 p-2 rounded border dark:border-gray-500">
                                <strong>Calcolo:</strong> Base: {(m.base || 0).toFixed(1)} • DG:{' '}
                                {m.gd || 0} • Factor: {(m.factor || 1).toFixed(2)}
                              </div>
                              <div className="bg-white dark:bg-gray-600 p-2 rounded border dark:border-gray-500">
                                <strong>Risultato:</strong>{' '}
                                <span
                                  className={`font-bold text-lg ${delta >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}
                                >
                                  {delta >= 0 ? '+' : ''}
                                  {Math.round(delta)} punti
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </Section>
  );
}
