// =============================================
// FILE: src/app/App.jsx
// =============================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { loadLeague, saveLeague, subscribeLeague } from '@services/cloud.js';
import { completeMagicLinkIfPresent, onAuth } from '@services/auth.jsx';

import { themeTokens, LOGO_URL } from '@lib/theme.js';
import { LS_KEY } from '@lib/ids.js';
import { recompute } from '@lib/ranking.js';

import NavTabs from '@ui/NavTabs.jsx';
import Modal from '@ui/Modal.jsx';

import Classifica from '@features/classifica/Classifica.jsx';
import Giocatori from '@features/players/Giocatori.jsx';
import CreaPartita from '@features/crea/CreaPartita.jsx';
import StatisticheGiocatore from '@features/stats/StatisticheGiocatore.jsx';
import PrenotazioneCampi from '@features/prenota/PrenotazioneCampi.jsx';
import Extra from '@features/extra/Extra.jsx';
import CreaTornei from '@features/tornei/CreaTornei.jsx';
import Profile from '@features/profile/Profile.jsx';
import AuthPanel from '@features/auth/AuthPanel.jsx';

import { getDefaultBookingConfig, makeSeed } from '@data/seed.js';

export default function App() {
  // Tema
  const [theme, setTheme] = useState(localStorage.getItem('ml-theme') || 'dark');
  const T = useMemo(() => themeTokens(theme), [theme]);
  useEffect(() => {
    try {
      localStorage.setItem('ml-theme', theme);
    } catch {
      void 0;
    }
  }, [theme]);

  // League
  const [leagueId, setLeagueId] = useState(
    localStorage.getItem(LS_KEY + '-leagueId') || 'lega-andrea-2025'
  );
  useEffect(() => localStorage.setItem(LS_KEY + '-leagueId', leagueId), [leagueId]);

  // Club mode (protetta da unlock nel pannello Extra)
  const [clubMode, setClubMode] = useState(() => {
    try {
      const unlocked = sessionStorage.getItem('ml-extra-unlocked') === '1';
      const saved = sessionStorage.getItem('ml-club-mode') === '1';
      return unlocked && saved;
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      if (clubMode) sessionStorage.setItem('ml-club-mode', '1');
      else sessionStorage.removeItem('ml-club-mode');
    } catch {
      void 0;
    }
  }, [clubMode]);

  // Stato
  const [state, setState] = useState(null);
  const [updatingFromCloud, setUpdatingFromCloud] = useState(false);

  // Auth (per NavTabs e Profilo)
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuth(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Carica il profilo utente da Firestore
        try {
          const { getUserProfile } = await import('@services/auth.jsx');
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error loading user profile:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    completeMagicLinkIfPresent().catch(() => {});
  }, []);

  // clientId + mute snapshot
  const clientIdRef = useRef(null);
  if (!clientIdRef.current) {
    const saved = (() => {
      try {
        return localStorage.getItem('ml-client-id');
      } catch {
        return null;
      }
    })();
    if (saved) clientIdRef.current = saved;
    else {
      const nid = Math.random().toString(36).slice(2, 10);
      clientIdRef.current = nid;
      try {
        localStorage.setItem('ml-client-id', nid);
      } catch {
        void 0;
      }
    }
  }
  const muteCloudUntilRef = useRef(0);

  const setStateSafe = (updater) => {
    setState((prev) => {
      const base = typeof updater === 'function' ? updater(prev) : updater;
      const stamp = Date.now();
      const nextRev = (prev?._rev || 0) + 1;
      muteCloudUntilRef.current = stamp + 2000; // 2s
      return { ...base, _updatedAt: stamp, _rev: nextRev, _lastWriter: clientIdRef.current };
    });
  };

  // load iniziale
  useEffect(() => {
    (async () => {
      try {
        const fromCloud = await loadLeague(leagueId);
        const valid =
          fromCloud &&
          typeof fromCloud === 'object' &&
          Array.isArray(fromCloud.players) &&
          Array.isArray(fromCloud.matches);
        if (valid) {
          const migrated = { ...fromCloud };
          if (!Array.isArray(migrated.courts)) migrated.courts = [];
          if (!Array.isArray(migrated.bookings)) migrated.bookings = [];
          if (!migrated.bookingConfig) migrated.bookingConfig = getDefaultBookingConfig();
          if (!migrated.bookingConfig.pricing)
            migrated.bookingConfig.pricing = getDefaultBookingConfig().pricing;
          if (!migrated.bookingConfig.addons)
            migrated.bookingConfig.addons = getDefaultBookingConfig().addons;
          setState(migrated);
          try {
            localStorage.setItem(LS_KEY, JSON.stringify(migrated));
          } catch {
            void 0;
          }
        } else {
          const initial = makeSeed();
          setState(initial);
          // Se non sei loggato, questo può fallire (ok): le regole bloccano write
          try {
            await saveLeague(leagueId, {
              ...initial,
              _updatedAt: Date.now(),
              _rev: 1,
              _lastWriter: clientIdRef.current,
            });
          } catch {
            void 0;
          }
        }
      } catch (e) {
        console.warn('initial load error:', e);
        const fallback = makeSeed();
        setState(fallback);
      }
    })();
  }, [leagueId]);

  // sync snapshot
  useEffect(() => {
    if (!leagueId) return;
    let unsub = null;
    try {
      unsub = subscribeLeague(leagueId, (cloudState) => {
        const valid =
          cloudState &&
          typeof cloudState === 'object' &&
          Array.isArray(cloudState.players) &&
          Array.isArray(cloudState.matches);
        if (!valid) return;
        if (Date.now() < muteCloudUntilRef.current) return;

        const migrated = { ...cloudState };
        if (!Array.isArray(migrated.courts)) migrated.courts = [];
        if (!Array.isArray(migrated.bookings)) migrated.bookings = [];
        if (!migrated.bookingConfig) migrated.bookingConfig = getDefaultBookingConfig();
        if (!migrated.bookingConfig.pricing)
          migrated.bookingConfig.pricing = getDefaultBookingConfig().pricing;
        if (!migrated.bookingConfig.addons)
          migrated.bookingConfig.addons = getDefaultBookingConfig().addons;

        setUpdatingFromCloud(true);
        setState((prev) => {
          const localRev = prev?._rev ?? 0,
            cloudRev = migrated?._rev ?? 0;
          const localTs = prev?._updatedAt ?? 0,
            cloudTs = migrated?._updatedAt ?? 0;
          const cloudIsNewer = cloudRev > localRev || (cloudRev === localRev && cloudTs > localTs);
          return cloudIsNewer ? migrated : prev;
        });
        setUpdatingFromCloud(false);
      });
    } catch (e) {
      console.warn('subscribe err:', e);
    }
    return () => unsub && unsub();
  }, [leagueId]);

  // save (con check contenuto)
  useEffect(() => {
    if (!state || updatingFromCloud) return;

    // Confronta solo i dati rilevanti, escludendo i metadata (_updatedAt, _rev, ecc)
    const relevantFields = ['players', 'matches', 'courts', 'bookings', 'bookingConfig'];
    const hasChanges =
      !localStorage.getItem(LS_KEY) ||
      relevantFields.some(
        (field) =>
          JSON.stringify(state[field]) !==
          JSON.stringify(JSON.parse(localStorage.getItem(LS_KEY))[field])
      );

    if (hasChanges) {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(state));
        const toSave = { ...state, _updatedAt: Date.now(), _lastWriter: clientIdRef.current };
        const t = setTimeout(() => {
          saveLeague(leagueId, toSave).catch(() => void 0);
        }, 800);
        return () => clearTimeout(t);
      } catch {
        void 0;
      }
    }
  }, [state, leagueId, updatingFromCloud]);

  // routing
  const [active, setActive] = useState('classifica');
  const [formulaText, setFormulaText] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');

  useEffect(() => {
    if (!clubMode && new Set(['giocatori', 'crea', 'prenota', 'tornei']).has(active))
      setActive('classifica');
  }, [clubMode, active]);

  const derived = useMemo(
    () =>
      state ? recompute(state.players || [], state.matches || []) : { players: [], matches: [] },
    [state]
  );
  const playersById = useMemo(
    () => Object.fromEntries((derived.players || []).map((p) => [p.id, p])),
    [derived]
  );
  const openStats = (pid) => {
    setSelectedPlayerId(pid);
    setActive('stats');
  };

  // Verifica se l'utente ha completato il profilo obbligatorio
  const isProfileComplete = userProfile && userProfile.firstName && userProfile.phone;

  // Se l'utente non è autenticato o il profilo non è completo, mostra la pagina di autenticazione
  if (authLoading) {
    return (
      <div
        className={`min-h-screen ${T.pageBg} ${T.text} flex items-center justify-center`}
        data-theme={theme}
      >
        <div className="text-lg">Caricamento...</div>
      </div>
    );
  }

  if (!user || !isProfileComplete) {
    return (
      <div className={`min-h-screen ${T.pageBg} ${T.text}`} data-theme={theme}>
        <style>{`
          [data-theme="dark"] input[type="date"]::-webkit-calendar-picker-indicator,
          [data-theme="dark"] input[type="time"]::-webkit-calendar-picker-indicator,
          [data-theme="dark"] input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(1); }
        `}</style>

        <header className={`sticky top-0 z-20 ${T.headerBg}`}>
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <img
                src={LOGO_URL}
                alt="Marsica Padel"
                className="h-8 w-auto rounded-md shadow shrink-0"
              />
              <div className="text-lg sm:text-2xl font-bold tracking-wide truncate">
                Marsica{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">
                  Padel
                </span>{' '}
                League
              </div>
            </div>
            <button
              type="button"
              aria-label="Cambia tema"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className={`ml-1 px-3 py-1.5 rounded-xl text-sm transition ring-1 ${T.ghostRing} shrink-0`}
              title={theme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        {theme === 'dark' && (
          <div className="pointer-events-none fixed inset-x-0 top-0 h-40 bg-gradient-to-b from-emerald-500/20 to-transparent blur-2xl" />
        )}

        <main className="max-w-2xl mx-auto px-3 sm:px-4 py-5 sm:py-6">
          <AuthPanel T={T} user={user} userProfile={userProfile} setUserProfile={setUserProfile} />
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${T.pageBg} ${T.text}`} data-theme={theme}>
      <style>{`
        [data-theme="dark"] input[type="date"]::-webkit-calendar-picker-indicator,
        [data-theme="dark"] input[type="time"]::-webkit-calendar-picker-indicator,
        [data-theme="dark"] input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(1); }
      `}</style>

      <header className={`sticky top-0 z-20 ${T.headerBg}`}>
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img
              src={LOGO_URL}
              alt="Marsica Padel"
              className="h-8 w-auto rounded-md shadow shrink-0"
            />
            <div className="text-lg sm:text-2xl font-bold tracking-wide truncate">
              Marsica{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">
                Padel
              </span>{' '}
              League
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <NavTabs active={active} setActive={setActive} clubMode={clubMode} T={T} user={user} />
            <button
              type="button"
              aria-label="Cambia tema"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className={`ml-1 px-3 py-1.5 rounded-xl text-sm transition ring-1 ${T.ghostRing} shrink-0`}
              title={theme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {theme === 'dark' && (
        <div className="pointer-events-none fixed inset-x-0 top-0 h-40 bg-gradient-to-b from-emerald-500/20 to-transparent blur-2xl" />
      )}

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-5 sm:py-6">
        {!state ? (
          <div className="p-6">Caricamento…</div>
        ) : (
          <>
            {active === 'giocatori' && clubMode && (
              <Giocatori
                T={T}
                state={state}
                setState={setStateSafe}
                onOpenStats={openStats}
                playersById={playersById}
              />
            )}
            {active === 'classifica' && (
              <Classifica
                T={T}
                players={derived.players}
                matches={derived.matches}
                onOpenStats={openStats}
              />
            )}
            {active === 'crea' && clubMode && (
              <CreaPartita
                T={T}
                state={state}
                setState={setStateSafe}
                playersById={playersById}
                onShowFormula={setFormulaText}
                derivedMatches={derived.matches}
              />
            )}
            {active === 'stats' && (
              <StatisticheGiocatore
                T={T}
                players={derived.players}
                matches={derived.matches}
                selectedPlayerId={selectedPlayerId}
                onSelectPlayer={setSelectedPlayerId}
                onShowFormula={setFormulaText}
              />
            )}
            {active === 'prenota' && clubMode && (
              <PrenotazioneCampi
                T={T}
                state={state}
                setState={setStateSafe}
                players={derived.players}
                playersById={playersById}
              />
            )}
            {active === 'tornei' && clubMode && <CreaTornei T={T} />}

            {active === 'profile' && <Profile T={T} />}
            {active === 'auth' && <AuthPanel T={T} />}

            {active === 'extra' && (
              <Extra
                T={T}
                state={state}
                setState={setStateSafe}
                derived={derived}
                leagueId={leagueId}
                setLeagueId={setLeagueId}
                clubMode={clubMode}
                setClubMode={setClubMode}
              />
            )}
          </>
        )}
      </main>

      <Modal
        open={!!formulaText}
        onClose={() => setFormulaText('')}
        title="Formula calcolo punti (RPA) – Spiegazione"
        T={T}
      >
        {formulaText}
      </Modal>
    </div>
  );
}
