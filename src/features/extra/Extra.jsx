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
      {/* La gestione della modalità circolo è visibile SOLO se il pannello è sbloccato */}
      {unlocked ? (
        <div className={`rounded-2xl ${T.cardBg} ${T.border} p-3 mb-4`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="font-medium">Modalità Circolo</div>
              <div className={`text-sm ${T.subtext}`}>
                {clubMode
                  ? 'Attiva — le tab amministrative (Giocatori, Crea Partita, Prenotazione Campi, Crea Tornei) sono visibili.'
                  : 'Disattiva — solo Classifica e Statistiche sono visibili agli utenti.'}
              </div>
            </div>
            <div className="flex gap-2">
              {!clubMode ? (
                <button type="button" className={T.btnPrimary} onClick={() => setClubMode(true)}>
                  Attiva
                </button>
              ) : (
                <button
                  type="button"
                  className={T.btnGhost}
                  onClick={() => setClubMode(false)}
                >
                  Disattiva
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={`rounded-2xl ${T.cardBg} ${T.border} p-3 mb-4`}>
          <div className="font-medium mb-1">Modalità Circolo</div>
          <div className={`text-sm ${T.subtext}`}>
            Sblocca il pannello per abilitare o disabilitare la Modalità Circolo.
          </div>
        </div>
      )}

      {/* Pannello sblocco + azioni cloud */}
      {!unlocked ? (
        <form
          onSubmit={tryUnlock}
          className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end mb-3"
        >
          <div className="flex-1 min-w-[200px]">
            <label className={`text-xs ${T.subtext}`}>Password pannello (Paris2025)</label>
            <input
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="Inserisci password"
              className={`${T.input} w-full`}
            />
          </div>
          <button type="submit" className={T.btnPrimary}>
            Sblocca pannello
          </button>
          <button type="button" className={T.btnGhost} onClick={forceSave}>
            Forza salva su cloud
          </button>
          <button type="button" className={T.btnGhost} onClick={forceLoad}>
            Forza carica da cloud
          </button>
        </form>
      ) : (
        <div className="mb-3 flex gap-2">
          <button type="button" className={T.btnGhost} onClick={lockPanel}>
            Blocca pannello
          </button>
          <button type="button" className={T.btnGhost} onClick={forceSave}>
            Forza salva su cloud
          </button>
          <button type="button" className={T.btnGhost} onClick={forceLoad}>
            Forza carica da cloud
          </button>
        </div>
      )}

      {!unlocked ? (
        <div className={`text-xs ${T.subtext}`}>
          Sblocca per accedere a Backup/Import, sincronizzazione Cloud, gestione campi e parametri
          prenotazioni.
        </div>
      ) : (
        <>
          {/* Lega + cloud */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 mb-3">
            <span className="text-sm">Lega:</span>
            <input
              className={`${T.input} w-full sm:w-64`}
              value={leagueId}
              placeholder="lega-andrea-2025"
              onChange={(e) => setLeagueId(e.target.value)}
            />
            <div className="flex gap-2">
              <button type="button" className={T.btnGhost} onClick={forceSave}>
                Forza salva su cloud
              </button>
              <button type="button" className={T.btnGhost} onClick={forceLoad}>
                Forza carica da cloud
              </button>
            </div>
          </div>
          {cloudMsg && <div className={`text-xs ${T.subtext} mb-4`}>{cloudMsg}</div>}

          {/* Backup / export */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button type="button" className={T.btnPrimary} onClick={exportJSON}>
              Backup JSON
            </button>
            <label className={`${T.btnGhost} cursor-pointer`}>
              Import JSON
              <input
                type="file"
                className="hidden"
                accept="application/json"
                onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0])}
              />
            </label>
            <button type="button" className={T.btnGhost} onClick={exportCSVClassifica}>
              Export Classifica CSV
            </button>
            <button type="button" className={T.btnGhost} onClick={exportCSVMatches}>
              Export Partite CSV
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium ring-1 ring-rose-500/40 text-rose-500 hover:bg-rose-500/10 transition"
              onClick={resetAll}
            >
              Rigenera simulazione
            </button>
          </div>

          {/* Campi (senza promo) */}
          <div className={`rounded-2xl ${T.cardBg} ${T.border} p-3 mb-4`}>
            <div className="font-medium mb-2">Campi</div>
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end mb-3">
              <div className="flex-1">
                <label className={`text-xs ${T.subtext}`}>Nuovo campo</label>
                <input
                  value={newCourt}
                  onChange={(e) => setNewCourt(e.target.value)}
                  className={T.input}
                  placeholder="Es. Campo 4 (Coperto)"
                />
              </div>
              <button type="button" className={T.btnGhost} onClick={addCourt}>
                Aggiungi
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              {(state.courts || []).map((c) => (
                <div key={c.id} className={`rounded-xl ${T.cardBg} ${T.border} p-3`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{c.name}</div>
                    </div>
                    <button
                      type="button"
                      className="text-rose-500 text-sm hover:underline shrink-0"
                      onClick={() => removeCourt(c.id)}
                    >
                      Rimuovi
                    </button>
                  </div>
                </div>
              ))}
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
