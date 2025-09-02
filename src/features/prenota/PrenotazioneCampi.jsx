// =============================================
// FILE: src/features/prenota/PrenotazioneCampi.jsx
// =============================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Section from '@ui/Section.jsx';
import Modal from '@ui/Modal.jsx';
import { euro, euro2 } from '@lib/format.js';
import { sameDay, floorToSlot, addMinutes, overlaps } from '@lib/date.js';
import { computePrice, getRateInfo } from '@lib/pricing.js';

export default function PrenotazioneCampi({ state, setState, players, playersById, T }) {
  const cfg = state.bookingConfig;
  const [day, setDay] = useState(() => floorToSlot(new Date(), cfg.slotMinutes));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const courts = Array.isArray(state?.courts) ? state.courts : [];
  const bookings = Array.isArray(state?.bookings) ? state.bookings : [];

  // Default duration for new bookings: prefer 90' if available, otherwise first configured or 90'
  const defaultDuration = useMemo(() => {
    const list = Array.isArray(cfg?.defaultDurations) ? cfg.defaultDurations : [];
    if (list.includes(90)) return 90;
    if (list.length > 0) return list[0];
    return 90;
  }, [cfg]);

  const goToday = () => setDay(floorToSlot(new Date(), cfg.slotMinutes));
  const goOffset = (days) =>
    setDay((d) => {
      const nd = new Date(d);
      nd.setDate(nd.getDate() + days);
      return nd;
    });
  const setDayFromInput = (value) => {
    const [y, m, dd] = value.split('-').map(Number);
    const d = new Date(day);
    d.setFullYear(y);
    d.setMonth(m - 1);
    d.setDate(dd);
    d.setHours(0, 0, 0, 0);
    setDay(d);
  };

  const dayStart = new Date(day);
  dayStart.setHours(cfg.dayStartHour, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(cfg.dayEndHour, 0, 0, 0);

  const timeSlots = [];
  for (let t = new Date(dayStart); t < dayEnd; t = addMinutes(t, cfg.slotMinutes)) {
    timeSlots.push(new Date(t));
  }

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const dayLabel = `${cap(new Intl.DateTimeFormat('it-IT', { weekday: 'long' }).format(day))} - ${String(
    day.getDate()
  ).padStart(2, '0')} ${new Intl.DateTimeFormat('it-IT', { month: 'long' }).format(day)} ${day.getFullYear()}`;

  const dayBookings = useMemo(
    () =>
      bookings
        .filter((b) => sameDay(new Date(b.start), day))
        .sort((a, b) => new Date(a.start) - new Date(b.start)),
    [bookings, day]
  );

  const bookingsByCourt = useMemo(() => {
    const map = new Map(courts.map((c) => [c.id, []]));
    for (const b of dayBookings) {
      const arr = map.get(b.courtId) || [];
      arr.push(b);
      map.set(b.courtId, arr);
    }
    return map;
  }, [dayBookings, courts]);

  const dayRates = useMemo(() => timeSlots.map((t) => getRateInfo(t, cfg, null).rate), [timeSlots, cfg]);
  const minRate = useMemo(() => Math.min(...dayRates), [dayRates]);
  const maxRate = useMemo(() => Math.max(...dayRates), [dayRates]);
  const greenAlphaForRate = (rate) => {
    if (!isFinite(minRate) || !isFinite(maxRate) || minRate === maxRate) return 0.18;
    const x = (rate - minRate) / (maxRate - minRate);
    return 0.12 + x * 0.22;
  };

  const playersAlpha = useMemo(
    () => [...players].sort((a, b) => (a.name || '').localeCompare(b.name, 'it', { sensitivity: 'base' })),
    [players]
  );
  const playersNameById = (id) => playersById?.[id]?.name || '';
  const findPlayerIdByName = (name) => {
    const n = (name || '').trim().toLowerCase();
    if (!n) return null;
    const found = playersAlpha.find((p) => p.name.trim().toLowerCase() === n);
    return found?.id || null;
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    courtId: '',
    start: null,
  duration: defaultDuration,
    p1Name: '',
    p2Name: '',
    p3Name: '',
    p4Name: '',
    guest1: '',
    guest2: '',
    note: '',
    bookedBy: '',
    useLighting: false,
    useHeating: false,
  });

  function openCreate(courtId, start) {
    const startRounded = floorToSlot(start, cfg.slotMinutes);
    setEditingId(null);
    setForm({
      courtId,
      start: startRounded,
  duration: defaultDuration,
      p1Name: '',
      p2Name: '',
      p3Name: '',
      p4Name: '',
      guest1: '',
      guest2: '',
      note: '',
      bookedBy: '',
      useLighting: false,
      useHeating: false,
    });
    setModalOpen(true);
  }

  function openEdit(booking) {
    setEditingId(booking.id);
    const start = new Date(booking.start);
    const namesFromIds = (booking.players || []).map(playersNameById);
    const playerNames = booking.playerNames && booking.playerNames.length ? booking.playerNames : namesFromIds;
    setForm({
      courtId: booking.courtId,
      start,
      duration: booking.duration,
      p1Name: playerNames[0] || '',
      p2Name: playerNames[1] || '',
      p3Name: playerNames[2] || '',
      p4Name: playerNames[3] || '',
      guest1: booking.guestNames?.[0] || '',
      guest2: booking.guestNames?.[1] || '',
      note: booking.note || '',
      bookedBy: booking.bookedByName || '',
      useLighting: !!booking.addons?.lighting,
      useHeating: !!booking.addons?.heating,
    });
    setModalOpen(true);
  }

  function existingOverlap(courtId, start, duration, ignoreId = null) {
    const blockStart = new Date(start);
    const blockEnd = addMinutes(start, duration);
    const list = bookingsByCourt.get(courtId) || [];
    return list.find((b) => {
      if (ignoreId && b.id === ignoreId) return false;
      const bStart = new Date(b.start);
      const bEnd = addMinutes(new Date(b.start), b.duration);
      return overlaps(blockStart, blockEnd, bStart, bEnd);
    });
  }

  const prevP1Ref = useRef('');
  useEffect(() => {
    const p1 = form.p1Name?.trim() || '';
    const prev = prevP1Ref.current;
    if ((!form.bookedBy?.trim() || form.bookedBy?.trim() === prev) && p1) {
      setForm((f) => ({ ...f, bookedBy: p1 }));
    }
    prevP1Ref.current = p1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.p1Name]);

  function saveBooking() {
    if (!form.courtId || !form.start) {
      alert('Seleziona campo e orario.');
      return;
    }
    const start = floorToSlot(form.start, cfg.slotMinutes);
    const now = new Date();
    if (start < now) {
      alert('Non puoi prenotare nel passato.');
      return;
    }
    const ignoreId = editingId || null;
    if (existingOverlap(form.courtId, start, form.duration, ignoreId)) {
      alert('Esiste già una prenotazione che si sovrappone su questo campo.');
      return;
    }

    const pNames = [form.p1Name, form.p2Name, form.p3Name, form.p4Name]
      .map((s) => (s || '').trim())
      .filter(Boolean);
    const pIds = pNames.map(findPlayerIdByName).filter(Boolean);
    const guests = [form.guest1, form.guest2].map((s) => (s || '').trim()).filter(Boolean);
    const bookedByName = (form.bookedBy && form.bookedBy.trim()) || pNames[0] || guests[0] || '';

    const price = computePrice(
      start,
      form.duration,
      cfg,
      { lighting: !!form.useLighting, heating: !!form.useHeating },
      form.courtId
    );

    const baseBooking = {
      courtId: form.courtId,
      start: start.toISOString(),
      duration: form.duration,
      players: pIds,
      playerNames: pNames,
      guestNames: guests,
      price,
      note: form.note?.trim() || '',
      bookedByName,
      addons: { lighting: !!form.useLighting, heating: !!form.useHeating },
      status: 'booked',
    };

    if (!editingId) {
      const booking = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        createdAt: Date.now(),
        ...baseBooking,
      };
      setState((s) => ({ ...s, bookings: [...(s.bookings || []), booking] }));
    } else {
      setState((s) => ({
        ...s,
        bookings: (s.bookings || []).map((b) => (b.id === editingId ? { ...b, ...baseBooking, updatedAt: Date.now() } : b)),
      }));
    }
    setModalOpen(false);
  }

  function cancelBooking(id) {
    if (!confirm('Cancellare la prenotazione?')) return;
    setState((s) => ({ ...s, bookings: (s.bookings || []).filter((b) => b.id !== id) }));
  }

  const courtName = (id) => courts.find((c) => c.id === id)?.name || id;
  const initials = (name) =>
    (name || '')
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .join('')
      .slice(0, 3)
      .toUpperCase();

  const SLOT_H = 52; // px

  function renderCell(courtId, t) {
    const list = bookingsByCourt.get(courtId) || [];
    const hit = list.find((b) => {
      const bStart = new Date(b.start);
      const bEnd = addMinutes(new Date(b.start), b.duration);
      return overlaps(bStart, bEnd, t, addMinutes(t, cfg.slotMinutes));
    });

    // --- SLOT NON PRENOTABILE SE PRECEDE UNA PRENOTAZIONE ---
    const hasNextBooking = list.some((b) => {
      const bStart = new Date(b.start);
      return bStart.getTime() === addMinutes(t, cfg.slotMinutes).getTime();
    });
    if (!hit && hasNextBooking) {
      // Slot non prenotabile, precede una prenotazione
      const startLabel = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return (
        <div className="relative w-full h-9 rounded-lg ring-1 text-[11px] font-medium bg-gray-300 dark:bg-gray-700 opacity-60 cursor-not-allowed border-dashed border-2 border-gray-400 flex items-center justify-center" title="Slot non prenotabile: precede una prenotazione">
          <span className="absolute inset-0 grid place-items-center text-[11px] opacity-90">{startLabel}</span>
        </div>
      );
    }

    // --- SLOT LIBERO ---
    if (!hit) {
      const info = getRateInfo(t, cfg, courtId);
      const alpha = greenAlphaForRate(info.rate);
      const isDiscounted = info.source === 'discounted';
      const startLabel = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return (
        <button
          type="button"
          onClick={() => openCreate(courtId, t)}
          className="relative w-full h-9 rounded-lg ring-1 text-[11px] font-medium"
          style={{ background: `rgba(16,185,129,${alpha})`, borderColor: `rgba(16,185,129,0.35)` }}
          title={isDiscounted ? 'Fascia scontata' : 'Tariffa standard'}
        >
          {isDiscounted && (
            <span
              className="absolute top-0.5 right-0.5 px-1.5 py-[1px] rounded-full text-[10px] leading-none"
              style={{
                background: 'rgba(16,185,129,0.9)',
                color: '#0b0b0b',
                border: '1px solid rgba(16,185,129,0.6)',
              }}
            >
              ★ Promo
            </span>
          )}
          {/* Orario di inizio sempre visibile su tutti gli slot liberi */}
          <span className="absolute inset-0 grid place-items-center text-[11px] opacity-90">{startLabel}</span>
        </button>
      );
    }

    // --- SLOT OCCUPATO ---
    const start = new Date(hit.start);
    const end = addMinutes(start, hit.duration);
    const isStart = t.getTime() === start.getTime();
    if (!isStart) return <div className="w-full h-9" />;

    const rowSpan = Math.ceil((end - t) / (cfg.slotMinutes * 60 * 1000));
    const totalHeight = rowSpan * SLOT_H - 6;
    const labelPlayers = (hit.playerNames && hit.playerNames.length
      ? hit.playerNames
      : (hit.players || []).map((pid) => playersById?.[pid]?.name || '—')
    )
      .concat(hit.guestNames || [])
      .slice(0, 4);

    // Icone semplici emoji senza sfondo
    const lampIcon = (
      <span className="text-2xl">
        💡
      </span>
    );
    const fireIcon = (
      <span className="text-2xl">
        🔥
      </span>
    );

    return (
      <div className="w-full h-9 relative">
        <button
          type="button"
          onClick={() => openEdit(hit)}
          className="absolute left-0 right-0 px-2 py-2 ring-1 text-left text-[13px] font-semibold flex flex-col justify-center"
          style={{
            top: 0,
            height: `${totalHeight}px`,
            background: 'rgba(220, 38, 127, 0.35)',
            borderColor: 'rgba(220, 38, 127, 0.6)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
          title={`${courtName(hit.courtId)} — ${start.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })} (${hit.duration}′) • clicca per modificare`}
        >
          {/* Icone in alto a sinistra, affiancate */}
          <div className="absolute left-2 top-2 flex flex-row items-center gap-2 z-20">
            {hit.addons?.lighting && lampIcon}
            {hit.addons?.heating && fireIcon}
          </div>
          <div className="flex items-center justify-between gap-2 mb-1 mt-2">
            <div className="min-w-0 flex flex-col">
              <span className="font-bold text-[15px] leading-tight">
                {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {euro(hit.price)}
              </span>
              <span className="flex items-center gap-2 mt-1">
                <div className="text-[10px] font-medium opacity-80 flex flex-wrap gap-1">
                  {labelPlayers.map((name, i) => (
                    <span key={i} className="bg-white/20 px-1 py-0.5 rounded text-[9px] font-medium">
                      {name}
                    </span>
                  ))}
                </div>
              </span>
            </div>
            <div className="shrink-0 text-[13px] opacity-80 font-bold">{Math.round(hit.duration)}′</div>
          </div>
          <div className="text-[12px] opacity-80 truncate">
            Prenotato da: <span className="font-semibold">{hit.bookedByName || labelPlayers[0] || '—'}</span>
          </div>
          {hit.note && (
            <div className="text-[11px] opacity-70 mt-1 truncate">{hit.note}</div>
          )}
        </button>
      </div>
    );
  }

  const previewPrice = useMemo(() => {
    if (!form.start || !form.courtId) return null;
    return computePrice(
      new Date(form.start),
      form.duration,
      cfg,
      { lighting: form.useLighting, heating: form.useHeating },
      form.courtId
    );
  }, [form.start, form.duration, form.courtId, form.useLighting, form.useHeating, cfg]);
  const perPlayer = useMemo(() => (previewPrice == null ? null : previewPrice / 4), [previewPrice]);

  return (
    <Section title="Prenotazione Campi" T={T}>
      {/* Header moderno con navigazione integrata */}
      <div className={`flex flex-col sm:flex-row sm:items-center gap-4 mb-6 ${T.cardBg} ${T.border} p-4 rounded-xl`}>
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            className={`${T.btnGhostSm} text-xl font-bold hover:scale-110 transition-transform`} 
            onClick={() => goOffset(-1)} 
            title="Giorno precedente"
          >
            ←
          </button>
          
          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`text-2xl font-bold cursor-pointer hover:scale-105 transition-transform bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-lime-400`}
            title="Clicca per aprire calendario"
          >
            {dayLabel}
          </button>
          
          <button 
            type="button" 
            className={`${T.btnGhostSm} text-xl font-bold hover:scale-110 transition-transform`} 
            onClick={() => goOffset(1)} 
            title="Giorno successivo"
          >
            →
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            className={`${T.btnGhostSm} text-sm font-semibold px-3 py-1 rounded-lg`} 
            onClick={goToday}
          >
            Oggi
          </button>
        </div>
      </div>

      {/* Calendario popup */}
      {showDatePicker && (
        <div className={`mb-4 p-4 ${T.cardBg} ${T.border} rounded-xl shadow-lg`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${T.subtext}`}>Seleziona data</span>
            <button 
              type="button" 
              onClick={() => setShowDatePicker(false)}
              className={`${T.btnGhostSm} text-sm`}
            >
              ✕
            </button>
          </div>
          <input 
            type="date" 
            value={`${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`} 
            onChange={(e) => {
              setDayFromInput(e.target.value);
              setShowDatePicker(false);
            }} 
            className={T.input} 
            autoFocus
          />
        </div>
      )}

      {/* Griglia campi */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[720px] grid gap-2" style={{ gridTemplateColumns: `repeat(${courts.length}, 1fr)` }}>
          {/* Header campi */}
          {courts.map((c) => (
            <div key={`hdr_${c.id}`} className={`px-2 py-3 text-base font-bold text-center rounded-xl shadow-md mb-2 ${T.cardBg} ${T.border}`}>
              <span className="inline-flex items-center gap-2">
                <span className={`w-7 h-7 rounded-full bg-blue-400 dark:bg-emerald-400 text-white flex items-center justify-center font-bold shadow`}>{c.name[0]}</span>
                <span>{c.name}</span>
              </span>
            </div>
          ))}

          {/* Celle prenotazione */}
          {timeSlots.map((t, r) => (
            <React.Fragment key={t.getTime()}>
              {courts.map((c) => (
                <div key={c.id + '_' + r} className={`px-0.5 py-0.5 ${T.cardBg} ${T.border} rounded-lg`}>
                  {renderCell(c.id, t)}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Modal glassmorphism per prenotazione */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Modifica prenotazione' : 'Nuova prenotazione'}
        T={T}
      >
        {!form.start ? (
          <div className={`text-center py-8 text-lg ${T.subtext}`}>Seleziona uno slot libero nella griglia.</div>
        ) : (
          <div className="rounded-2xl p-6 shadow-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className={`text-xs font-semibold ${T.subtext}`}>Campo</label>
                <select value={form.courtId} onChange={(e) => setForm((f) => ({ ...f, courtId: e.target.value }))} className={T.input}>
                  {state.courts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className={`text-xs font-semibold ${T.subtext}`}>Inizio</label>
                <input type="time" value={`${String(new Date(form.start).getHours()).padStart(2, '0')}:${String(new Date(form.start).getMinutes()).padStart(2, '0')}`} onChange={(e) => { const [hh, mm] = e.target.value.split(':').map(Number); const d = new Date(form.start); d.setHours(hh, mm, 0, 0); setForm((f) => ({ ...f, start: floorToSlot(d, cfg.slotMinutes) })); }} className={T.input} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={`text-xs font-semibold ${T.subtext}`}>Durata</label>
                <select value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))} className={T.input}>
                  {(cfg.defaultDurations || [60, 90, 120]).map((m) => (
                    <option key={m} value={m}>{m} minuti</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 sm:col-span-2">
                {cfg.addons?.lightingEnabled && (
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.useLighting} onChange={(e) => setForm((f) => ({ ...f, useLighting: e.target.checked }))} />
                    <span className="text-sm font-medium text-blue-600 dark:text-emerald-400">Illuminazione</span>
                    <span className={`text-xs ${T.subtext}`}>+{euro(cfg.addons.lightingFee || 0)}</span>
                  </label>
                )}
                {cfg.addons?.heatingEnabled && (
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.useHeating} onChange={(e) => setForm((f) => ({ ...f, useHeating: e.target.checked }))} />
                    <span className="text-sm font-medium text-purple-600 dark:text-lime-400">Riscaldamento</span>
                    <span className={`text-xs ${T.subtext}`}>+{euro(cfg.addons.heatingFee || 0)}</span>
                  </label>
                )}
                <div className={`ml-auto font-bold text-lg text-blue-700 dark:text-emerald-400`}>
                  Totale: {previewPrice == null ? '—' : euro(previewPrice)}
                  {previewPrice != null && (
                    <span className={`ml-3 text-xs ${T.subtext}`}>/ giocatore: {euro2(previewPrice / 4)}</span>
                  )}
                </div>
              </div>

              <datalist id="players-list">
                {playersAlpha.map((p) => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>

              <div className="sm:col-span-2 grid sm:grid-cols-2 gap-4">
                {[
                  ['p1Name', 'Giocatore 1'],
                  ['p2Name', 'Giocatore 2'],
                  ['p3Name', 'Giocatore 3'],
                  ['p4Name', 'Giocatore 4'],
                ].map(([key, label]) => (
                  <div className="flex flex-col gap-1" key={key}>
                    <label className={`text-xs font-semibold ${T.subtext}`}>{label}</label>
                    <input list="players-list" value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className={T.input} placeholder="Digita nome o scegli" />
                  </div>
                ))}
              </div>

              <div className="sm:col-span-2 grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className={`text-xs font-semibold ${T.subtext}`}>Ospite 1 (nome libero)</label>
                  <input value={form.guest1} onChange={(e) => setForm((f) => ({ ...f, guest1: e.target.value }))} className={T.input} placeholder="Es. Mario (ospite)" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={`text-xs font-semibold ${T.subtext}`}>Ospite 2 (nome libero)</label>
                  <input value={form.guest2} onChange={(e) => setForm((f) => ({ ...f, guest2: e.target.value }))} className={T.input} placeholder="Es. Luca (ospite)" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className={`text-xs font-semibold ${T.subtext}`}>Prenotazione a nome di</label>
                <input value={form.bookedBy} onChange={(e) => setForm((f) => ({ ...f, bookedBy: e.target.value }))} className={T.input} placeholder="Es. Andrea Paris" />
              </div>

              <div className="sm:col-span-2">
                <label className={`text-xs font-semibold ${T.subtext}`}>Note</label>
                <input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} className={T.input} placeholder="Es. Lezioni, torneo, ecc." />
              </div>

              <div className="sm:col-span-2 flex gap-2 flex-wrap mt-2">
                <button type="button" onClick={saveBooking} className={T.btnPrimary}>{editingId ? 'Aggiorna prenotazione' : 'Conferma prenotazione'}</button>
                <button type="button" onClick={() => setModalOpen(false)} className={T.btnGhost}>Annulla</button>
                {editingId && (
                  <button type="button" onClick={() => cancelBooking(editingId)} className="bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold px-6 py-2 rounded-xl shadow-lg hover:scale-105 transition">Elimina prenotazione</button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Section>
  );
}
