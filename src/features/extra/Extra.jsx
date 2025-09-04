// =============================================
// FILE: src/features/extra/Extra.jsx
// =============================================
import React, { useEffect, useState } from 'react';
import Section from '@ui/Section.jsx';
import { loadLeague, saveLeague } from '@services/cloud.js';
import { toCSV, downloadBlob } from '@lib/csv.js';
import { getDefaultBookingConfig } from '@data/seed.js';

// NB: RulesEditor aggiornato con selezione campi
import RulesEditor from '@features/prenota/RulesEditor.jsx';

export default function Extra({
  state,
  setState,
  derived,
  leagueId,
  setLeagueId,
  clubMode,
  setClubMode,
  T
}) {
  const [cloudMsg, setCloudMsg] = React.useState('');

  // === Sblocco pannello (gate amministrazione)
  const [pwd, setPwd] = useState('');
  const [unlocked, setUnlocked] = useState(() => {
    try { return sessionStorage.getItem('ml-extra-unlocked') === '1'; } catch { return false; }
  });
  const tryUnlock = (e) => {
    e?.preventDefault?.();
    if (pwd === 'Paris2025') {
      setUnlocked(true);
      try { sessionStorage.setItem('ml-extra-unlocked', '1'); } catch {}
      // opzionale: non forzo subito clubMode; l’utente lo attiva qui dentro
    } else {
      alert('Password errata');
    }
  };
  const lockPanel = () => {
    setUnlocked(false);
    setPwd('');
    try { sessionStorage.removeItem('ml-extra-unlocked'); } catch {}
    // lascio inalterato clubMode; l’utente può disattivarlo manualmente se vuole
  };

  async function forceSave() {
    try {
      await saveLeague(leagueId, { ...state, _updatedAt: Date.now() });
      setCloudMsg(`✅ Salvato su cloud: leagues/${leagueId}`);
    } catch (e) {
      setCloudMsg(`❌ Errore salvataggio: ${e?.message || e}`);
    }
  }
  async function forceLoad() {
    try {
      const cloud = await loadLeague(leagueId);
      if (cloud && typeof cloud === 'object') {
        setState(cloud);
        setCloudMsg(`✅ Caricato dal cloud: leagues/${leagueId}`);
      } else {
        setCloudMsg('⚠️ Documento non trovato sul cloud');
      }
    } catch (e) {
      setCloudMsg(`❌ Errore caricamento: ${e?.message || e}`);
    }
  }

  const exportJSON = () =>
    downloadBlob(
      'paris-league-backup.json',
      new Blob([JSON.stringify(state, null, 2)], { type: 'application/json;charset=utf-8' })
    );
  const importJSON = (file) => {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        setState(JSON.parse(fr.result));
        alert('Import riuscito!');
      } catch {
        alert('File non valido');
      }
    };
    fr.readAsText(file);
  };

  const exportCSVClassifica = () => {
    const rows = derived.players
      .slice()
      .sort((a, b) => b.rating - a.rating)
      .map((p, i) => ({
        pos: i + 1,
        name: p.name,
        rating: p.rating.toFixed(2),
        wins: p.wins || 0,
        losses: p.losses || 0
      }));
    if (!rows.length) return alert('Nessun dato da esportare.');
    downloadBlob('classifica.csv', new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8' }));
  };
  const exportCSVMatches = () => {
    const rows = derived.matches.map((m) => ({
      date: new Date(m.date).toLocaleString(),
      teamA: m.teamA.join('+'),
      teamB: m.teamB.join('+'),
      sets: (m.sets || [])
        .map((s) => `${s.a}-${s.b}`)
        .join(' '),
      gamesA: m.gamesA,
      gamesB: m.gamesB,
      winner: m.winner,
      deltaA: m.deltaA?.toFixed(2) ?? '',
      deltaB: m.deltaB?.toFixed(2) ?? ''
    }));
    if (!rows.length) return alert('Nessuna partita da esportare.');
    downloadBlob('partite.csv', new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8' }));
  };

  const resetAll = () => {
    if (!confirm('Rigenerare simulazione iniziale?')) return;
    import('@data/seed.js').then(({ makeSeed }) => setState(makeSeed()));
  };

  // === Campi (nessun toggle promo: rimosso)
  const [newCourt, setNewCourt] = useState('');
  const addCourt = () => {
    const name = newCourt.trim();
    if (!name) return;
    setState((s) => ({
      ...s,
      courts: [
        ...(s.courts || []),
        { id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2), name }
      ]
    }));
    setNewCourt('');
  };
  const removeCourt = (id) => {
    if (!confirm('Rimuovere il campo? Le prenotazioni collegate saranno conservate.')) return;
    setState((s) => ({
      ...s,
      courts: (s.courts || []).filter((c) => c.id !== id)
    }));
  };

  // === Config prenotazioni
  const cfg = state.bookingConfig || getDefaultBookingConfig();
  const [cfgDraft, setCfgDraft] = useState(() => ({ ...cfg }));
  useEffect(() => {
    setCfgDraft((prev) => {
      try {
        const prevJson = JSON.stringify(prev);
        const cfgJson = JSON.stringify(cfg);
        return prevJson === cfgJson ? { ...cfg } : prev;
      } catch {
        return prev;
      }
    });
  }, [state.bookingConfig]);

  const saveCfg = () => {
    let durations = cfgDraft.defaultDurations;
    if (typeof durations === 'string')
      durations = durations
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !Number.isNaN(n) && n > 0);
    const normalized = {
      ...cfgDraft,
      slotMinutes: Math.max(5, Number(cfgDraft.slotMinutes) || 30),
      dayStartHour: Math.min(23, Math.max(0, Number(cfgDraft.dayStartHour) || 8)),
      dayEndHour: Math.min(24, Math.max(1, Number(cfgDraft.dayEndHour) || 23)),
      defaultDurations: durations && durations.length ? durations : [60, 90, 120]
    };
    setState((s) => ({ ...s, bookingConfig: normalized }));
    alert('Parametri salvati!');
  };
  const resetCfg = () => setCfgDraft(getDefaultBookingConfig());

  const pricing = cfgDraft.pricing || getDefaultBookingConfig().pricing;
  const setPricing = (p) => setCfgDraft((c) => ({ ...c, pricing: p }));
  const setFullRules = (rules) => setPricing({ ...pricing, full: rules });
  const setDiscountRules = (rules) => setPricing({ ...pricing, discounted: rules });
  const addons = cfgDraft.addons || getDefaultBookingConfig().addons;

  return (
    <Section title="Extra – Impostazioni" T={T}>
      {/* Modalità Circolo */}
      {unlocked ? (
        <div className={`rounded-2xl ${T.cardBg} ${T.border} p-4 mb-6`}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎛️</span>
              <div>
                <div className="font-semibold text-lg">Modalità Circolo</div>
                <div className={`text-sm ${T.subtext}`}>
                  {clubMode
                    ? '✅ Attiva — le tab amministrative sono visibili'
                    : '❌ Disattiva — solo Classifica e Statistiche sono visibili'}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {!clubMode ? (
                <button type="button" className={`${T.btnPrimary} flex-1 sm:flex-none`} onClick={() => setClubMode(true)}>
                  🚀 Attiva Modalità Circolo
                </button>
              ) : (
                <button
                  type="button"
                  className={`${T.btnGhost} flex-1 sm:flex-none`}
                  onClick={() => setClubMode(false)}
                >
                  🔒 Disattiva Modalità Circolo
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={`rounded-2xl ${T.cardBg} ${T.border} p-4 mb-6`}>
          <div className="text-center">
            <div className="text-4xl mb-2">🔐</div>
            <div className="font-semibold mb-2">Modalità Circolo</div>
            <div className={`text-sm ${T.subtext}`}>
              Sblocca il pannello per gestire la Modalità Circolo e altre impostazioni avanzate.
            </div>
          </div>
        </div>
      )}

      {/* Pannello sblocco */}
      {!unlocked ? (
        <div className={`rounded-2xl ${T.cardBg} ${T.border} p-4 mb-6`}>
          <form onSubmit={tryUnlock} className="space-y-4">
            <div>
              <label className={`text-sm font-medium ${T.text} mb-2 block`}>
                🔑 Password Amministratore
              </label>
              <input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="Inserisci password"
                className={`${T.input} w-full`}
              />
              <div className={`text-xs ${T.subtext} mt-1`}>
                Contatta l'amministratore per la password
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button type="submit" className={`${T.btnPrimary} flex-1`}>
                🔓 Sblocca Pannello
              </button>
            </div>
          </form>
          
          {/* Cloud actions sempre disponibili */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="font-medium mb-3 flex items-center gap-2">
              ☁️ Azioni Cloud (sempre disponibili)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button type="button" className={`${T.btnGhost} w-full`} onClick={forceSave}>
                💾 Forza Salva su Cloud
              </button>
              <button type="button" className={`${T.btnGhost} w-full`} onClick={forceLoad}>
                📥 Forza Carica da Cloud
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Pannello sbloccato */}
          <div className={`rounded-2xl ${T.cardBg} ${T.border} p-4 mb-6`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <div className="font-semibold">Pannello Sbloccato</div>
                  <div className={`text-sm ${T.subtext}`}>Accesso completo alle impostazioni</div>
                </div>
              </div>
              <button type="button" className={`${T.btnGhost} w-full sm:w-auto`} onClick={lockPanel}>
                🔒 Blocca Pannello
              </button>
            </div>
          </div>

          {/* Cloud e Lega */}
          <div className={`rounded-2xl ${T.cardBg} ${T.border} p-4 mb-6`}>
            <div className="font-semibold mb-4 flex items-center gap-2">
              ☁️ Sincronizzazione Cloud
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`text-sm font-medium ${T.text} mb-2 block`}>
                  ID Lega
                </label>
                <input
                  className={`${T.input} w-full`}
                  value={leagueId}
                  placeholder="lega-andrea-2025"
                  onChange={(e) => setLeagueId(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button type="button" className={`${T.btnGhost} w-full`} onClick={forceSave}>
                  💾 Salva su Cloud
                </button>
                <button type="button" className={`${T.btnGhost} w-full`} onClick={forceLoad}>
                  📥 Carica da Cloud
                </button>
              </div>
              
              {cloudMsg && (
                <div className={`text-sm p-3 rounded-lg ${
                  cloudMsg.includes('✅') 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                }`}>
                  {cloudMsg}
                </div>
              )}
            </div>
          </div>

          {/* Backup e Export */}
          <div className={`rounded-2xl ${T.cardBg} ${T.border} p-4 mb-6`}>
            <div className="font-semibold mb-4 flex items-center gap-2">
              💾 Backup e Export
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <button type="button" className={`${T.btnPrimary} w-full`} onClick={exportJSON}>
                📁 Backup JSON
              </button>
              <label className={`${T.btnGhost} cursor-pointer w-full flex items-center justify-center`}>
                📤 Import JSON
                <input
                  type="file"
                  className="hidden"
                  accept="application/json"
                  onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0])}
                />
              </label>
              <button type="button" className={`${T.btnGhost} w-full`} onClick={exportCSVClassifica}>
                📊 Export Classifica
              </button>
              <button type="button" className={`${T.btnGhost} w-full`} onClick={exportCSVMatches}>
                🎾 Export Partite
              </button>
              <button
                type="button"
                className="w-full inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium ring-1 ring-rose-500/40 text-rose-500 hover:bg-rose-500/10 transition"
                onClick={resetAll}
              >
                🔄 Rigenera Demo
              </button>
            </div>
          </div>

          {/* Gestione Campi */}
          <div className={`rounded-2xl ${T.cardBg} ${T.border} p-4 mb-6`}>
            <div className="font-semibold mb-4 flex items-center gap-2">
              🏟️ Gestione Campi
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    value={newCourt}
                    onChange={(e) => setNewCourt(e.target.value)}
                    className={`${T.input} w-full`}
                    placeholder="Es. Campo 4 (Coperto)"
                  />
                </div>
                <button type="button" className={`${T.btnGhost} w-full sm:w-auto`} onClick={addCourt}>
                  ➕ Aggiungi Campo
                </button>
              </div>
              
              <div className="space-y-3">
                {(state.courts || []).length === 0 ? (
                  <div className={`text-center py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl`}>
                    <div className="text-3xl mb-2">🏟️</div>
                    <div className={`text-sm ${T.subtext}`}>Nessun campo configurato</div>
                  </div>
                ) : (
                  (state.courts || []).map((c) => (
                    <div key={c.id} className={`rounded-xl border border-gray-200 dark:border-gray-600 p-3 flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🎾</span>
                        <div className="font-medium">{c.name}</div>
                      </div>
                      <button
                        type="button"
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded text-sm transition-colors"
                        onClick={() => removeCourt(c.id)}
                      >
                        🗑️ Rimuovi
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Parametri prenotazioni + Regole tariffarie per-campo */}
          <div
            className={`rounded-2xl ${T.cardBg} ${T.border} p-3`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault();
            }}
          >
            <div className="font-medium mb-2">Prenotazioni — Parametri</div>
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <div className="flex flex-col">
                <label className={`text-xs ${T.subtext}`}>Minuti slot</label>
                <input
                  type="number"
                  value={cfgDraft.slotMinutes}
                  onChange={(e) =>
                    setCfgDraft((c) => ({ ...c, slotMinutes: Number(e.target.value) }))
                  }
                  className={T.input}
                />
              </div>
              <div className="flex flex-col">
                <label className={`text-xs ${T.subtext}`}>Apertura (ora)</label>
                <input
                  type="number"
                  value={cfgDraft.dayStartHour}
                  onChange={(e) =>
                    setCfgDraft((c) => ({ ...c, dayStartHour: Number(e.target.value) }))
                  }
                  className={T.input}
                />
              </div>
              <div className="flex flex-col">
                <label className={`text-xs ${T.subtext}`}>Chiusura (ora)</label>
                <input
                  type="number"
                  value={cfgDraft.dayEndHour}
                  onChange={(e) =>
                    setCfgDraft((c) => ({ ...c, dayEndHour: Number(e.target.value) }))
                  }
                  className={T.input}
                />
              </div>
            </div>

            {/* Editor regole con selezione campi */}
            <div className="grid md:grid-cols-2 gap-3">
              <RulesEditor
                title="Fasce — Prezzo Pieno"
                list={pricing.full || []}
                onChange={setFullRules}
                courts={state.courts || []}
                T={T}
              />

              <RulesEditor
                title="Fasce — Scontato"
                list={pricing.discounted || []}
                onChange={setDiscountRules}
                courts={state.courts || []}
                T={T}
              />
            </div>

            <div className="mt-4 rounded-xl p-3 border border-white/10">
              <div className="font-medium mb-2">Opzioni per prenotazione (costo fisso)</div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <input
                    id="cfg-lighting-enabled"
                    type="checkbox"
                    checked={!!addons.lightingEnabled}
                    onChange={(e) =>
                      setCfgDraft((c) => ({
                        ...c,
                        addons: { ...c.addons, lightingEnabled: e.target.checked }
                      }))
                    }
                  />
                  <label htmlFor="cfg-lighting-enabled" className="cursor-pointer">
                    Abilita Illuminazione
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${T.subtext}`}>Costo Illuminazione</span>
                  <input
                    type="number"
                    className={`${T.input} w-28`}
                    value={addons.lightingFee || 0}
                    onChange={(e) =>
                      setCfgDraft((c) => ({
                        ...c,
                        addons: { ...c.addons, lightingFee: Number(e.target.value) || 0 }
                      }))
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="cfg-heating-enabled"
                    type="checkbox"
                    checked={!!addons.heatingEnabled}
                    onChange={(e) =>
                      setCfgDraft((c) => ({
                        ...c,
                        addons: { ...c.addons, heatingEnabled: e.target.checked }
                      }))
                    }
                  />
                  <label htmlFor="cfg-heating-enabled" className="cursor-pointer">
                    Abilita Riscaldamento
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${T.subtext}`}>Costo Riscaldamento</span>
                  <input
                    type="number"
                    className={`${T.input} w-28`}
                    value={addons.heatingFee || 0}
                    onChange={(e) =>
                      setCfgDraft((c) => ({
                        ...c,
                        addons: { ...c.addons, heatingFee: Number(e.target.value) || 0 }
                      }))
                    }
                  />
                </div>
              </div>
              <div className={`text-xs ${T.subtext} mt-2`}>
                Nota: l’<b>Illuminazione</b> e il <b>Riscaldamento</b> sono opzioni per prenotazione (prezzo
                fisso, non a tempo).
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button type="button" className={T.btnPrimary} onClick={saveCfg}>
                Salva parametri
              </button>
              <button type="button" className={T.btnGhost} onClick={resetCfg}>
                Ripristina default
              </button>
            </div>
          </div>

          <div className={`text-xs ${T.subtext} mt-3`}>
            I dati sono salvati <b>in locale</b> (localStorage) e, se configurato, <b>anche su Firestore</b>{' '}
            nel documento <code>leagues/{leagueId}</code>.
          </div>
        </>
      )}
    </Section>
  );
}
