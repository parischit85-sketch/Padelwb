// =============================================
// FILE: src/components/ui/UserBookingsCard.jsx
// =============================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserBookings, BOOKING_CONFIG } from '@services/bookings.js';
import Badge from '@ui/Badge.jsx';
import BookingDetailModal from '@ui/BookingDetailModal.jsx';

export default function UserBookingsCard({ user, state, T, compact = false }) {
  const [userBookings, setUserBookings] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const navigate = useNavigate();

  // Carica le prenotazioni dell'utente usando l'inizializzazione completa
  useEffect(() => {
    if (!user) {
      setUserBookings([]);
      setIsLoading(false);
      return;
    }

    const loadUserBookings = async () => {
      setIsLoading(true);
      try {
        // Usa l'inizializzazione completa per simulare il passaggio per "Prenota Campo"
        const bookings = await getUserBookings(user, true); // forceFullInit = true
        setUserBookings(bookings);
      } catch (error) {
        console.error('Errore nel caricamento prenotazioni:', error);
        setUserBookings([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserBookings();
  }, [user, state]);

  // Funzione per gestire il click su una prenotazione
  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedBooking(null);
  };

  // Funzione per ricaricare manualmente le prenotazioni
  const handleRefreshBookings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Forza un refresh completo come all'inizializzazione
      const { getPublicBookings, setCloudMode } = await import('@services/bookings.js');
      
      // Riconfigura la modalità cloud
      setCloudMode(Boolean(user?.uid), user);
      
      // Ricarica tutti i dati pubblici
      const publicBookings = await getPublicBookings();
      
      // Ricarica dati utente dal cloud se disponibile
      if (user.uid) {
        try {
          const { loadActiveUserBookings } = await import('@services/cloud-bookings.js');
          const cloudUserBookings = await loadActiveUserBookings(user.uid);
        } catch (cloudError) {
          console.warn('UserBookingsCard: Cloud refresh failed:', cloudError);
        }
      }
      
      // Ottieni i dati filtrati dell'utente
      const bookings = await getUserBookings(user);
      setUserBookings(bookings);
    } catch (error) {
      console.error('Errore refresh prenotazioni:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Prenotazioni da mostrare - logic based on compact mode
  const displayBookings = compact 
    ? (isExpanded ? userBookings : userBookings.slice(0, 1))  // Mobile: solo 1 se compact
    : (isExpanded ? userBookings : userBookings.slice(0, 3)); // Desktop: 3 normali
  
  const hasMoreBookings = compact 
    ? userBookings.length > 1 
    : userBookings.length > 3;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={`${T.cardBg} ${T.border} p-6 rounded-xl`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">📅</div>
            <div>
              <div className="h-5 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          </div>
          <div className="h-6 w-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-50 p-4 rounded-lg border animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="text-right">
                  <div className="h-3 bg-gray-200 rounded w-8 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!user || userBookings.length === 0) {
    return (
      <div className={`${T.cardBg} ${T.border} p-6 rounded-xl`}>
        <div className="text-center">
          <div className="text-4xl mb-3">📅</div>
          <h3 className={`font-semibold mb-2 ${T.text}`}>Nessuna Prenotazione</h3>
          <p className={`text-sm ${T.subtext} mb-4`}>Non hai prenotazioni attive</p>
          <button
            onClick={() => navigate('/booking')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Prenota Ora
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${T.cardBg} ${T.border} p-6 rounded-xl`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">📅</div>
          <div>
            <h3 className={`font-semibold ${T.text}`}>Le Tue Prenotazioni</h3>
            <p className={`text-sm ${T.subtext}`}>
              {userBookings.length} prenotazione{userBookings.length !== 1 ? 'i' : ''} attiva{userBookings.length !== 1 ? 'e' : ''}
            </p>
          </div>
        </div>
        <Badge variant="primary" size="sm" T={T}>
          {userBookings.length}
        </Badge>
      </div>

      <div className="space-y-3">
        {displayBookings.map((booking) => {
          // Usa i campi da state se disponibili, altrimenti da BOOKING_CONFIG
          const courts = state?.courts || BOOKING_CONFIG.courts;
          const court = courts?.find(c => c.id === booking.courtId);
          const bookingDate = new Date(booking.date);
          const isToday = bookingDate.toDateString() === new Date().toDateString();
          const isTomorrow = bookingDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
          
          let dateLabel;
          if (isToday) {
            dateLabel = 'Oggi';
          } else if (isTomorrow) {
            dateLabel = 'Domani';
          } else {
            dateLabel = bookingDate.toLocaleDateString('it-IT', { 
              day: 'numeric', 
              month: 'short' 
            });
          }

          return (
            <div
              key={booking.id}
              onClick={() => handleBookingClick(booking)}
              className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg border cursor-pointer transition-all group hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{court?.name || 'Campo'}</span>
                    {isToday && (
                      <Badge variant="warning" size="xs" T={T}>Oggi</Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-600">
                    {dateLabel} alle {booking.time} • {booking.duration || 60}min
                  </div>
                  {booking.notes && (
                    <div className="text-xs text-gray-500 mt-1 italic truncate">
                      {booking.notes}
                    </div>
                  )}
                </div>
                <div className="text-right text-xs text-gray-400 group-hover:text-gray-600 flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    <span>👥</span>
                    <span>{booking.players || 1}</span>
                  </div>
                  {booking.price && (
                    <div className="font-medium text-green-600">{booking.price}€</div>
                  )}
                  <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    👁️ Dettagli
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasMoreBookings && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            {isExpanded 
              ? `Mostra meno` 
              : compact 
                ? `Mostra altre ${userBookings.length - 1} prenotazioni`
                : `Mostra altre ${userBookings.length - 3} prenotazioni`
            }
          </button>
        </div>
      )}

      {/* Tasto Nuova Prenotazione - Solo su desktop quando non è compact */}
      {!compact && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <button
            onClick={() => navigate('/booking')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors text-sm font-medium"
          >
            Nuova Prenotazione
          </button>
        </div>
      )}

      {/* Modal per dettaglio prenotazione */}
      <BookingDetailModal
        booking={selectedBooking}
        isOpen={showDetailModal}
        onClose={handleCloseModal}
        state={state}
        T={T}
      />
    </div>
  );
}
