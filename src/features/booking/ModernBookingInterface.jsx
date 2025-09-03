import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Section from '@ui/Section.jsx';
import Badge from '@ui/Badge.jsx';
import { createDSClasses } from '@lib/design-system.js';
import { floorToSlot, addMinutes, sameDay, overlaps } from '@lib/date.js';
import { computePrice } from '@lib/pricing.js';
import { isSlotAvailable, createBooking, loadBookings, getPublicBookings, setCloudMode, cancelBooking as cancelBookingService } from '@services/bookings.js';
import { loadActiveUserBookings, loadBookingHistory } from '@services/cloud-bookings.js';

function ModernBookingInterface({ user, T, state, setState }) {
  const ds = createDSClasses(T);
  const cfg = state?.bookingConfig || { slotMinutes: 30, dayStartHour: 8, dayEndHour: 23, defaultDurations: [60,90,120], addons: {} };
  const courtsFromState = Array.isArray(state?.courts) ? state.courts : [];
  
  // Stato UI
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [duration, setDuration] = useState(60);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [lighting, setLighting] = useState(false);
  const [heating, setHeating] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [additionalPlayers, setAdditionalPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  // Stato dati
  const [bookings, setBookings] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [activeUserBookings, setActiveUserBookings] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Configura modalità cloud quando l'utente cambia
  useEffect(() => {
    setCloudMode(Boolean(user?.uid), user);
    const loadInitialBookings = async () => {
      try {
        const publicBookings = await getPublicBookings();
        setBookings(publicBookings);
        
        if (user) {
          await loadUserBookingsData();
        } else {
          setUserBookings([]);
          setActiveUserBookings([]);
        }
      } catch (error) {
        // Error loading initial bookings
      }
    };
    loadInitialBookings();
  }, [user]);

  // Funzione per caricare le prenotazioni dell'utente
  const loadUserBookingsData = async () => {
    if (!user) {
      setUserBookings([]);
      setActiveUserBookings([]);
      return;
    }

    try {
      if (user.uid) {
        const activeBookings = await loadActiveUserBookings(user.uid);
        setActiveUserBookings(activeBookings);
        setUserBookings(activeBookings);
      }
    } catch (error) {
      setUserBookings([]);
      setActiveUserBookings([]);
    }
  };

  // Merge prenotazioni dal servizio con quelle nello state dell'App
  useEffect(() => {
    let cancelled = false;
    const mergePublicAndApp = async () => {
      try {
        const svc = await getPublicBookings();
        const app = projectStateToPublic(state?.bookings || []);
        const map = new Map();
        for (const b of [...svc, ...app]) map.set(b.id, b);
        if (!cancelled) setBookings(Array.from(map.values()));
      } catch (e) {
        // Error merging public bookings
      }
    };
    mergePublicAndApp();
    return () => { cancelled = true; };
  }, [state?.bookings, state?._rev]);

  // Proietta le prenotazioni dell'App in forma pubblica
  const projectStateToPublic = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map((b) => {
      const d = new Date(b.start);
      const date = d.toISOString().split('T')[0];
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return {
        id: b.id || `${b.courtId}-${b.start}`,
        courtId: b.courtId,
        courtName: '',
        date,
        time: `${hh}:${mm}`,
        duration: b.duration || 60,
        status: b.status || 'booked',
      };
    });
  };

  // Auto-seleziona oggi
  useEffect(() => {
    if (!selectedDate) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setSelectedDate(`${year}-${month}-${day}`);
    }
  }, [selectedDate]);

  // Verifica disponibilità slot
  const checkSlotAvailability = useCallback((courtId, date, time) => {
    return isSlotAvailable(courtId, date, time, duration, bookings);
  }, [duration, bookings]);

  // Genera giorni disponibili (come il competitor)
  const availableDays = useMemo(() => {
    const days = [];
    const daysNames = ['DOM', 'LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      days.push({
        date: dateStr,
        dayName: daysNames[date.getDay()],
        dayNumber: date.getDate(),
        monthName: date.toLocaleDateString('it-IT', { month: 'short' }),
        isToday: i === 0
      });
    }
    return days;
  }, []);

  // Genera slot orari (come il competitor - griglia)
  const timeSlots = useMemo(() => {
    const slots = [];
    const start = cfg.dayStartHour || 8;
    const end = cfg.dayEndHour || 23;
    const step = cfg.slotMinutes || 30;
    
    const now = new Date();
    const today = new Date().toISOString().split('T')[0];
    
    for (let hour = start; hour < end; hour++) {
      for (let minute = 0; minute < 60; minute += step) {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        
        // Skip past times if booking for today
        if (selectedDate === today) {
          const slotDateTime = new Date(`${selectedDate}T${timeStr}:00`);
          if (slotDateTime <= now) {
            continue;
          }
        }
        
        // Check availability across all courts
        const availableCourts = courtsFromState.filter(court => 
          checkSlotAvailability(court.id, selectedDate, timeStr)
        );
        
        const isAvailable = availableCourts.length > 0;
        
        // Show slot if not filtering or if available
        if (!showOnlyAvailable || isAvailable) {
          slots.push({
            time: timeStr,
            isAvailable,
            availableCourts: availableCourts.length,
            totalCourts: courtsFromState.length
          });
        }
      }
    }
    return slots;
  }, [selectedDate, duration, bookings, courtsFromState, checkSlotAvailability, showOnlyAvailable, cfg]);

  // Gestione prenotazione
  const handleBooking = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'Devi effettuare il login per prenotare un campo' });
      return;
    }

    if (!selectedDate || !selectedTime || !selectedCourt) {
      setMessage({ type: 'error', text: 'Seleziona data, orario e campo' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const bookingData = {
        courtId: selectedCourt.id,
        courtName: selectedCourt.name,
        date: selectedDate,
        time: selectedTime,
        duration,
        lighting: !!lighting,
        heating: !!heating,
        price: computePrice(
          new Date(`${selectedDate}T${selectedTime}:00`),
          duration,
          cfg,
          { lighting: !!lighting, heating: !!heating },
          selectedCourt.id
        ),
        userPhone,
        notes,
        players: [user.displayName || user.email, ...additionalPlayers.map(p => p.name)]
      };

      const newBooking = await createBooking(bookingData, user);
      
      if (!newBooking) {
        setMessage({ type: 'error', text: 'Errore nel salvare la prenotazione' });
        setIsSubmitting(false);
        return;
      }

      // Aggiorna stato
      const freshBookings = await getPublicBookings();
      setBookings(freshBookings);
      await loadUserBookingsData();
      
      // Aggiorna App state
      if (state && setState) {
        const toAppBooking = {
          id: newBooking.id,
          courtId: newBooking.courtId,
          start: new Date(`${newBooking.date}T${newBooking.time}:00`).toISOString(),
          duration: newBooking.duration,
          players: [],
          playerNames: additionalPlayers.map(p => p.name),
          guestNames: additionalPlayers.map(p => p.name),
          price: newBooking.price,
          note: newBooking.notes || '',
          bookedByName: newBooking.bookedBy || '',
          addons: { lighting: !!newBooking.lighting, heating: !!newBooking.heating },
          status: 'booked',
          createdAt: Date.now(),
        };
        setState((s) => ({ ...s, bookings: [...(s.bookings || []), toAppBooking] }));
      }
      
      // Reset form
      setSelectedTime('');
      setSelectedCourt(null);
      setLighting(false);
      setHeating(false);
      setUserPhone('');
      setNotes('');
      setAdditionalPlayers([]);
      setNewPlayerName('');
      setShowBookingModal(false);
      
      setMessage({ 
        type: 'success', 
        text: `Prenotazione confermata! Campo ${selectedCourt?.name} il ${new Date(selectedDate).toLocaleDateString('it-IT')} alle ${selectedTime}` 
      });

    } catch (error) {
      setMessage({ type: 'error', text: 'Errore durante la prenotazione. Riprova.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gestione click su slot orario
  const handleTimeSlotClick = (timeSlot) => {
    if (!timeSlot.isAvailable) return;
    
    setSelectedTime(timeSlot.time);
    
    // Se c'è solo un campo disponibile, selezionalo automaticamente
    const availableCourts = courtsFromState.filter(court => 
      checkSlotAvailability(court.id, selectedDate, timeSlot.time)
    );
    
    if (availableCourts.length === 1) {
      setSelectedCourt(availableCourts[0]);
      setShowBookingModal(true);
    }
  };

  // Gestione giocatori
  const addPlayer = () => {
    if (newPlayerName.trim() && additionalPlayers.length < 3) {
      setAdditionalPlayers([...additionalPlayers, { 
        id: Date.now(), 
        name: newPlayerName.trim() 
      }]);
      setNewPlayerName('');
    }
  };

  const removePlayer = (playerId) => {
    setAdditionalPlayers(additionalPlayers.filter(p => p.id !== playerId));
  };

  const totalPrice = selectedCourt && selectedDate && selectedTime
    ? computePrice(new Date(`${selectedDate}T${selectedTime}:00`), duration, cfg, { lighting, heating }, selectedCourt.id)
    : 0;

  return (
  <div className="min-h-screen bg-gray-50">

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'error' 
              ? 'bg-red-100 text-red-800 border border-red-200'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Day Selection - Scrollable on mobile, up to 10 days */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Seleziona il giorno</h2>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-2" style={{ minWidth: 'max-content' }}>
              {availableDays.slice(0, 10).map((day) => (
                <button
                  key={day.date}
                  onClick={() => {
                    setSelectedDate(day.date);
                    setSelectedTime('');
                    setSelectedCourt(null);
                  }}
                  className={`flex-shrink-0 p-2 sm:p-3 rounded-lg border text-center transition-all min-w-[60px] sm:min-w-[80px] ${
                    selectedDate === day.date
                      ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-xs font-medium mb-1">{day.dayName}</div>
                  <div className="text-lg font-bold">{day.dayNumber}</div>
                  <div className="text-xs opacity-75">{day.monthName}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Time Grid - Responsive with 5 columns on mobile */}
        {selectedDate && (
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <h2 className="font-semibold text-gray-900">Seleziona l'orario</h2>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showOnlyAvailable}
                  onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                  className="rounded text-blue-500"
                />
                <span className="text-gray-600">Solo orari disponibili</span>
              </label>
            </div>
            
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-8 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => handleTimeSlotClick(slot)}
                  disabled={!slot.isAvailable}
                  className={`p-2 sm:p-3 rounded-lg border text-center transition-all relative ${
                    selectedTime === slot.time
                      ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                      : slot.isAvailable
                      ? 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                      : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="font-medium text-sm sm:text-base">{slot.time}</div>
                  {!slot.isAvailable && (
                    <div className="text-xs mt-1">Occupato</div>
                  )}
                </button>
              ))}
            </div>
            
            {timeSlots.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {showOnlyAvailable 
                  ? 'Nessun orario disponibile per questo giorno'
                  : 'Nessun orario configurato'
                }
              </div>
            )}
          </div>
        )}

        {/* Court Selection */}
        {selectedTime && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Prenota un campo</h2>
            <div className="space-y-4">
              {courtsFromState
                .filter(court => checkSlotAvailability(court.id, selectedDate, selectedTime))
                .map((court) => (
                <div
                  key={court.id}
                  onClick={() => {
                    setSelectedCourt(court);
                    setShowBookingModal(true);
                  }}
                  className="border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{court.name}</h3>
                        {court.premium && (
                          <Badge variant="warning" size="xs" T={T}>Premium</Badge>
                        )}
                      </div>
                      
                      {court.features && court.features.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {court.features.map((feature, index) => (
                            <Badge key={index} variant="default" size="xs" T={T}>
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {computePrice(new Date(`${selectedDate}T${selectedTime}:00`), 60, cfg, {}, court.id)}€
                      </div>
                      <div className="text-sm text-gray-500">60 min</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {computePrice(new Date(`${selectedDate}T${selectedTime}:00`), 90, cfg, {}, court.id)}€/90min
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedCourt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">Conferma Prenotazione</h3>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Riepilogo */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">{selectedCourt.name}</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>📅 {new Date(selectedDate).toLocaleDateString('it-IT', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}</div>
                  <div>🕐 {selectedTime}</div>
                  <div>⏱️ {duration} minuti</div>
                </div>
              </div>

              {/* Durata */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Durata</label>
                <div className="grid grid-cols-3 gap-2">
                  {[60, 90, 120].map((dur) => (
                    <button
                      key={dur}
                      onClick={() => setDuration(dur)}
                      className={`p-2 rounded border text-center text-sm ${
                        duration === dur
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div>{dur}min</div>
                      <div className="text-xs">
                        {computePrice(new Date(`${selectedDate}T${selectedTime}:00`), dur, cfg, { lighting, heating }, selectedCourt.id)}€
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Servizi Extra */}
              {(cfg.addons?.lightingEnabled || cfg.addons?.heatingEnabled) && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Servizi Extra</label>
                  <div className="space-y-2">
                    {cfg.addons?.lightingEnabled && (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={lighting}
                          onChange={(e) => setLighting(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm">Illuminazione (+{cfg.addons?.lightingFee || 0}€)</span>
                      </label>
                    )}
                    {cfg.addons?.heatingEnabled && (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={heating}
                          onChange={(e) => setHeating(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm">Riscaldamento (+{cfg.addons?.heatingFee || 0}€)</span>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Giocatori */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Giocatori ({1 + additionalPlayers.length}/4)
                </label>
                
                {/* Organizzatore */}
                <div className="mb-2 p-2 bg-blue-50 rounded border">
                  <div className="text-sm font-medium">{user?.displayName || user?.email}</div>
                  <div className="text-xs text-blue-600">Organizzatore</div>
                </div>
                
                {/* Giocatori aggiuntivi */}
                {additionalPlayers.map((player) => (
                  <div key={player.id} className="mb-2 p-2 bg-gray-50 rounded border flex justify-between items-center">
                    <span className="text-sm">{player.name}</span>
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Rimuovi
                    </button>
                  </div>
                ))}
                
                {/* Aggiungi giocatore */}
                {additionalPlayers.length < 3 && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                      placeholder="Nome giocatore"
                      className="flex-1 p-2 border rounded text-sm"
                    />
                    <button
                      onClick={addPlayer}
                      disabled={!newPlayerName.trim()}
                      className="px-3 py-2 bg-blue-500 text-white rounded text-sm disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              {/* Contatti */}
              <div className="mb-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Telefono</label>
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="333 123 4567"
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Note</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Es: doppio misto"
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
              </div>

              {/* Prezzo finale */}
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Totale</span>
                  <span className="text-xl font-bold text-blue-600">{totalPrice}€</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded text-sm hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  onClick={handleBooking}
                  disabled={isSubmitting || !user}
                  className="flex-1 py-2 px-4 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Prenotando...' : `Conferma - ${totalPrice}€`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModernBookingInterface;
