import React, { useMemo, useRef, useState } from 'react';
import Section from '@ui/Section.jsx';
import { TrendArrow } from '@ui/TrendArrow.jsx';
import ModernMultiLineChart from '@ui/charts/ModernMultiLineChart.jsx';
import ShareButtons from '@ui/ShareButtons.jsx';
import { buildPodiumTimeline } from '@lib/ranking.js';

export default function Classifica({ players, matches, onOpenStats, T }) {
  const classificaRef = useRef(null);
  const [selectedTopCount, setSelectedTopCount] = useState(3);
  const [showAllPlayers, setShowAllPlayers] = useState(false);

  // Classifica generale (RPA)
  const rows = useMemo(
    () =>
      [...players]
        .map((p) => ({
          ...p,
          winRate: (p.wins || 0) + (p.losses || 0)
            ? ((p.wins || 0) / ((p.wins || 0) + (p.losses || 0))) * 100
            : 0,
        }))
        .sort((a, b) => b.rating - a.rating),
    [players]
  );

  // Classifica Coppie
  const couplesStats = useMemo(() => {
    const couples = new Map();
    
    matches.forEach(match => {
      // Ogni match ha teamA e teamB con 2 giocatori ciascuno
      [match.teamA, match.teamB].forEach(team => {
        const [p1, p2] = team.sort(); // Ordina per ID per consistenza
        const coupleKey = `${p1}_${p2}`;
        
        if (!couples.has(coupleKey)) {
          const player1 = players.find(p => p.id === p1);
          const player2 = players.find(p => p.id === p2);
          couples.set(coupleKey, {
            key: coupleKey,
            players: [player1?.name || 'Unknown', player2?.name || 'Unknown'],
            wins: 0,
            losses: 0,
            matches: 0
          });
        }
        
        const couple = couples.get(coupleKey);
        couple.matches++;
        
        // Determina se hanno vinto
        const isTeamA = match.teamA.includes(p1) && match.teamA.includes(p2);
        const teamAWins = match.sets.reduce((acc, set) => acc + (set.a > set.b ? 1 : 0), 0);
        const teamBWins = match.sets.reduce((acc, set) => acc + (set.b > set.a ? 1 : 0), 0);
        
        if ((isTeamA && teamAWins > teamBWins) || (!isTeamA && teamBWins > teamAWins)) {
          couple.wins++;
        } else {
          couple.losses++;
        }
      });
    });

    return Array.from(couples.values())
      .map(couple => ({
        ...couple,
        winRate: couple.matches > 0 ? (couple.wins / couple.matches) * 100 : 0
      }))
      .sort((a, b) => b.winRate - a.winRate);
  }, [players, matches]);

  // Classifica Efficienza
  const efficiencyStats = useMemo(() => {
    const playerStats = new Map();
    
    matches.forEach(match => {
      const allPlayers = [...match.teamA, ...match.teamB];
      const teamAWins = match.sets.reduce((acc, set) => acc + (set.a > set.b ? 1 : 0), 0);
      const teamBWins = match.sets.reduce((acc, set) => acc + (set.b > set.a ? 1 : 0), 0);
      
      const winningTeam = teamAWins > teamBWins ? match.teamA : match.teamB;
      const losingTeam = teamAWins > teamBWins ? match.teamB : match.teamA;
      
      // Calcola i game totali per efficienza
      const totalGamesA = match.sets.reduce((acc, set) => acc + set.a, 0);
      const totalGamesB = match.sets.reduce((acc, set) => acc + set.b, 0);
      
      // Assegna statistiche ai team
      match.teamA.forEach(playerId => {
        if (!playerStats.has(playerId)) {
          const player = players.find(p => p.id === playerId);
          playerStats.set(playerId, {
            id: playerId,
            name: player?.name || 'Unknown',
            wins: 0,
            losses: 0,
            gamesWon: 0,
            gamesLost: 0,
            matches: 0
          });
        }
        const stats = playerStats.get(playerId);
        stats.matches++;
        if (teamAWins > teamBWins) {
          stats.wins++;
          stats.gamesWon += totalGamesA;
          stats.gamesLost += totalGamesB;
        } else {
          stats.losses++;
          stats.gamesWon += totalGamesA;
          stats.gamesLost += totalGamesB;
        }
      });
      
      match.teamB.forEach(playerId => {
        if (!playerStats.has(playerId)) {
          const player = players.find(p => p.id === playerId);
          playerStats.set(playerId, {
            id: playerId,
            name: player?.name || 'Unknown',
            wins: 0,
            losses: 0,
            gamesWon: 0,
            gamesLost: 0,
            matches: 0
          });
        }
        const stats = playerStats.get(playerId);
        stats.matches++;
        if (teamBWins > teamAWins) {
          stats.wins++;
          stats.gamesWon += totalGamesB;
          stats.gamesLost += totalGamesA;
        } else {
          stats.losses++;
          stats.gamesWon += totalGamesB;
          stats.gamesLost += totalGamesA;
        }
      });
    });

    return Array.from(playerStats.values())
      .filter(player => player.matches >= 3) // Minimo 3 partite
      .map(player => ({
        ...player,
        winRate: (player.wins / player.matches) * 100,
        gameEfficiency: (player.gamesWon / (player.gamesWon + player.gamesLost)) * 100,
        efficiency: ((player.wins / player.matches) * 0.7 + (player.gamesWon / (player.gamesWon + player.gamesLost)) * 0.3) * 100
      }))
      .sort((a, b) => b.efficiency - a.efficiency);
  }, [players, matches]);

  // Classifica Streak positive e Ingiocabili
  const streakStats = useMemo(() => {
    const playerStreaks = new Map();
    
    // Ordina le partite per data
    const sortedMatches = [...matches].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sortedMatches.forEach(match => {
      const teamAWins = match.sets.reduce((acc, set) => acc + (set.a > set.b ? 1 : 0), 0);
      const teamBWins = match.sets.reduce((acc, set) => acc + (set.b > set.a ? 1 : 0), 0);
      
      const winners = teamAWins > teamBWins ? match.teamA : match.teamB;
      const losers = teamAWins > teamBWins ? match.teamB : match.teamA;
      
      [...match.teamA, ...match.teamB].forEach(playerId => {
        if (!playerStreaks.has(playerId)) {
          const player = players.find(p => p.id === playerId);
          playerStreaks.set(playerId, {
            id: playerId,
            name: player?.name || 'Unknown',
            currentStreak: 0,
            bestWinStreak: 0,
            worstLossStreak: 0,
            streakType: 'none', // 'win', 'loss', 'none'
            isActive: true,
            totalWins: 0,
            totalLosses: 0,
            totalMatches: 0
          });
        }
        
        const playerData = playerStreaks.get(playerId);
        const isWinner = winners.includes(playerId);
        playerData.totalMatches++;
        
        if (isWinner) {
          playerData.totalWins++;
          if (playerData.streakType === 'win') {
            playerData.currentStreak++;
          } else {
            playerData.currentStreak = 1;
            playerData.streakType = 'win';
          }
          if (playerData.currentStreak > playerData.bestWinStreak) {
            playerData.bestWinStreak = playerData.currentStreak;
          }
        } else {
          playerData.totalLosses++;
          if (playerData.streakType === 'loss') {
            playerData.currentStreak++;
          } else {
            playerData.currentStreak = 1;
            playerData.streakType = 'loss';
          }
          if (playerData.currentStreak > playerData.worstLossStreak) {
            playerData.worstLossStreak = playerData.currentStreak;
          }
        }
      });
    });

    const positiveStreaks = Array.from(playerStreaks.values())
      .filter(player => player.bestWinStreak > 0)
      .sort((a, b) => {
        if (b.bestWinStreak !== a.bestWinStreak) return b.bestWinStreak - a.bestWinStreak;
        if (a.streakType === 'win' && b.streakType !== 'win') return -1;
        if (b.streakType === 'win' && a.streakType !== 'win') return 1;
        return b.currentStreak - a.currentStreak;
      });

    // Classifica "Ingiocabili" - Minor rapporto sconfitte/partite giocate
    const ingiocabili = Array.from(playerStreaks.values())
      .filter(player => player.totalMatches >= 3) // Minimo 3 partite
      .map(player => ({
        ...player,
        lossRatio: player.totalMatches > 0 ? (player.totalLosses / player.totalMatches) * 100 : 0,
        winRate: player.totalMatches > 0 ? (player.totalWins / player.totalMatches) * 100 : 0
      }))
      .sort((a, b) => {
        // Ordina per minor rapporto sconfitte (migliori primi)
        if (a.lossRatio !== b.lossRatio) return a.lossRatio - b.lossRatio;
        // A parità, privilegia chi ha giocato di più
        return b.totalMatches - a.totalMatches;
      });

    return { positive: positiveStreaks, ingiocabili: ingiocabili };
  }, [players, matches]);

  const topPlayers = rows.slice(0, selectedTopCount);
  const topIds = topPlayers.map((p) => p.id);
  const topKeys = topPlayers.map((p) => p.name);
  const topRankings = topPlayers.map((p, index) => ({ name: p.name, position: index + 1 }));
  const chartData = useMemo(() => buildPodiumTimeline(players, matches, topIds), [players, matches, topIds]);

  const buildCaption = () => {
    const lines = [
      'Classifica Marsica Padel League',
      ...topPlayers.map((p, i) => `${i + 1}. ${p.name} — ${Math.round(p.rating)} pt`),
      '#MarsicaPadel #Padel',
    ];
    return lines.join('\n');
  };
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#classifica` : '';

  return (
    <Section
      title="Dashboard Classifiche"
      right={<ShareButtons size="sm" title="Classifica Marsica Padel League" url={shareUrl} captureRef={classificaRef} captionBuilder={buildCaption} T={T} />}
      T={T}
    >
      <div ref={classificaRef} className="space-y-8">
        
        {/* Ranking RPA Card */}
        <div className={`rounded-2xl ${T.cardBg} ${T.border} p-6`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <h3 className="text-lg font-semibold">Ranking RPA</h3>
            </div>
            <button
              onClick={() => setShowAllPlayers(!showAllPlayers)}
              className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                showAllPlayers 
                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                  : 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {showAllPlayers ? '📊 Mostra Top 10' : '📋 Mostra Tutti'}
            </button>
          </div>
          
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full text-sm">
              <thead>
                <tr className={`text-left border-b ${T.border} ${T.tableHeadText}`}>
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Giocatore</th>
                  <th className="py-2 pr-3">Ranking</th>
                  <th className="py-2 pr-3">Vittorie</th>
                  <th className="py-2 pr-3">Sconfitte</th>
                  <th className="py-2 pr-3">% Vittorie</th>
                </tr>
              </thead>
              <tbody>
                {(showAllPlayers ? rows : rows.slice(0, 10)).map((p, idx) => (
                  <tr key={p.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5">
                    <td className="py-2 pr-3">{idx + 1}</td>
                    <td className="py-2 pr-3">
                      <button className={T.link} onClick={() => onOpenStats(p.id)}>{p.name}</button>
                    </td>
                    <td className="py-2 pr-3 font-semibold">
                      {p.rating.toFixed(2)}
                      <TrendArrow total={p.trend5Total} pos={p.trend5Pos} neg={p.trend5Neg} />
                    </td>
                    <td className="py-2 pr-3">{p.wins || 0}</td>
                    <td className="py-2 pr-3">{p.losses || 0}</td>
                    <td className="py-2 pr-3">{p.winRate.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Indicatore se ci sono più giocatori */}
            {!showAllPlayers && rows.length > 10 && (
              <div className="mt-3 text-center">
                <button
                  onClick={() => setShowAllPlayers(true)}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                >
                  ... e altri {rows.length - 10} giocatori
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="font-medium">Andamento del ranking</div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Mostra:</span>
              <select 
                value={selectedTopCount} 
                onChange={(e) => setSelectedTopCount(Number(e.target.value))}
                className={`text-xs px-2 py-1 rounded-md border ${T.input}`}
              >
                <option value={3}>Top 3</option>
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
              </select>
            </div>
          </div>
          <ModernMultiLineChart 
            data={chartData} 
            seriesKeys={topKeys} 
            chartId="classifica"
            title={`Evoluzione del Top ${selectedTopCount}`}
            selectedCount={selectedTopCount}
            playerRankings={topRankings}
          />
        </div>

        {/* Grid per le altre classifiche */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Coppie Card */}
          <div className={`rounded-2xl ${T.cardBg} ${T.border} p-6`}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">👥</span>
              <h3 className="text-lg font-semibold">Migliori Coppie</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className={`text-left border-b ${T.border} ${T.tableHeadText}`}>
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Coppia</th>
                    <th className="py-2 pr-3">V/S</th>
                    <th className="py-2 pr-3">%</th>
                  </tr>
                </thead>
                <tbody>
                  {couplesStats.slice(0, 8).map((couple, idx) => (
                    <tr key={couple.key} className="border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5">
                      <td className="py-2 pr-3">{idx + 1}</td>
                      <td className="py-2 pr-3 font-medium text-xs">
                        {couple.players[0]} & {couple.players[1]}
                      </td>
                      <td className="py-2 pr-3 text-xs">
                        <span className="text-green-600 dark:text-green-400">{couple.wins}</span>
                        /
                        <span className="text-red-600 dark:text-red-400">{couple.losses}</span>
                      </td>
                      <td className="py-2 pr-3 font-semibold">{couple.winRate.toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Efficienza Card */}
          <div className={`rounded-2xl ${T.cardBg} ${T.border} p-6`}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">⚡</span>
              <h3 className="text-lg font-semibold">Classifica Efficienza</h3>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Combinazione di % vittorie (70%) e % game vinti (30%)
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className={`text-left border-b ${T.border} ${T.tableHeadText}`}>
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Giocatore</th>
                    <th className="py-2 pr-3">Eff.</th>
                    <th className="py-2 pr-3">V/S</th>
                  </tr>
                </thead>
                <tbody>
                  {efficiencyStats.slice(0, 8).map((player, idx) => (
                    <tr key={player.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5">
                      <td className="py-2 pr-3">{idx + 1}</td>
                      <td className="py-2 pr-3">
                        <button className={T.link + " text-xs"} onClick={() => onOpenStats(player.id)}>{player.name}</button>
                      </td>
                      <td className="py-2 pr-3 font-bold text-blue-600 dark:text-blue-400">{player.efficiency.toFixed(1)}%</td>
                      <td className="py-2 pr-3 text-xs">
                        <span className="text-green-600 dark:text-green-400">{player.wins}</span>
                        /
                        <span className="text-red-600 dark:text-red-400">{player.losses}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Streak Positive Card */}
          <div className={`rounded-2xl ${T.cardBg} ${T.border} p-6`}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🔥</span>
              <h3 className="text-lg font-semibold">Streak Vittorie</h3>
            </div>
            
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-800 dark:text-green-200">
                Migliori serie consecutive di vittorie
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className={`text-left border-b ${T.border} ${T.tableHeadText}`}>
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Giocatore</th>
                    <th className="py-2 pr-3">Miglior</th>
                    <th className="py-2 pr-3">Stato</th>
                  </tr>
                </thead>
                <tbody>
                  {streakStats.positive.slice(0, 8).map((player, idx) => (
                    <tr key={player.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5">
                      <td className="py-2 pr-3">{idx + 1}</td>
                      <td className="py-2 pr-3">
                        <button className={T.link + " text-xs"} onClick={() => onOpenStats(player.id)}>{player.name}</button>
                      </td>
                      <td className="py-2 pr-3 font-bold text-green-600 dark:text-green-400">
                        {player.bestWinStreak}
                      </td>
                      <td className="py-2 pr-3">
                        {player.streakType === 'win' ? (
                          <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                            🔥 +{player.currentStreak}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ingiocabili Card */}
          <div className={`rounded-2xl ${T.cardBg} ${T.border} p-6`}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🛡️</span>
              <h3 className="text-lg font-semibold">Ingiocabili</h3>
            </div>
            
            <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-xs text-purple-800 dark:text-purple-200">
                Minor rapporto sconfitte/partite giocate
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className={`text-left border-b ${T.border} ${T.tableHeadText}`}>
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Giocatore</th>
                    <th className="py-2 pr-3">% Sconf.</th>
                    <th className="py-2 pr-3">V/S</th>
                  </tr>
                </thead>
                <tbody>
                  {streakStats.ingiocabili.slice(0, 8).map((player, idx) => (
                    <tr key={player.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5">
                      <td className="py-2 pr-3">{idx + 1}</td>
                      <td className="py-2 pr-3">
                        <button className={T.link + " text-xs"} onClick={() => onOpenStats(player.id)}>{player.name}</button>
                      </td>
                      <td className="py-2 pr-3 font-bold text-purple-600 dark:text-purple-400">
                        {player.lossRatio.toFixed(1)}%
                      </td>
                      <td className="py-2 pr-3 text-xs">
                        <span className="text-green-600 dark:text-green-400">{player.totalWins}</span>
                        /
                        <span className="text-red-600 dark:text-red-400">{player.totalLosses}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </Section>
  );
}

