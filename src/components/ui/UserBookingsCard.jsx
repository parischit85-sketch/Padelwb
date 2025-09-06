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

  // Mostra tutte le prenotazioni in scroll orizzontale
  const displayBookings = userBookings;

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
      <h3 className={`font-semibold text-sm ${T.text} mb-2`}>Le Tue Prenotazioni</h3>

      {/* Scroll orizzontale ultra-compatto - stile Playtomic */}
      <div className="overflow-x-auto pb-2 -mx-6 px-6 sm:mx-0 sm:px-0">
        <div className="flex gap-2 w-max sm:grid sm:grid-cols-1 sm:gap-3 sm:w-full">
          {userBookings.map((booking) => {
            // Usa i campi da state se disponibili, altrimenti da BOOKING_CONFIG
            const courts = state?.courts || BOOKING_CONFIG.courts;
            const court = courts?.find(c => c.id === booking.courtId);
            const bookingDate = new Date(booking.date);
            const isToday = bookingDate.toDateString() === new Date().toDateString();
            const isTomorrow = bookingDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
            
            // Ottieni giorno della settimana
            const dayName = bookingDate.toLocaleDateString('it-IT', { weekday: 'short' });
            
            let dateLabel;
            if (isToday) {
              dateLabel = 'Oggi';
            } else if (isTomorrow) {
              dateLabel = 'Domani';
            } else {
              dateLabel = `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${bookingDate.getDate()}/${(bookingDate.getMonth() + 1).toString().padStart(2, '0')}`;
            }

            return (
              <div
                key={booking.id}
                onClick={() => handleBookingClick(booking)}
                className={`bg-white dark:bg-gray-800 hover:shadow-md p-3 rounded-lg border cursor-pointer transition-all group
                  min-w-[220px] h-28 sm:min-w-0 sm:h-auto flex-shrink-0 sm:flex-shrink
                  hover:border-blue-300 dark:hover:border-blue-600 transform hover:scale-102 flex flex-col justify-between`}
              >
                {/* Header con data/ora e campo */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-tight mb-1">
                      {dateLabel}
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white leading-none mb-1">
                      {booking.time.substring(0, 5)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {court?.name || 'Padel 1'} • {booking.duration || 60}min
                    </div>
                  </div>
                  {isToday && (
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  )}
                </div>

                {/* Footer con players e prezzo */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Nomi partecipanti */}
                    <div className="text-[10px] text-gray-600 dark:text-gray-400 truncate mb-1">
                      {booking.bookedBy && (
                        <span className="font-medium">{booking.bookedBy}</span>
                      )}
                      {booking.players && booking.players.length > 0 && (
                        <span>
                          {booking.bookedBy ? ' + ' : ''}
                          {booking.players.slice(0, 2).map((player, idx) => (
                            <span key={idx}>
                              {player.name || player}
                              {idx < booking.players.slice(0, 2).length - 1 ? ', ' : ''}
                            </span>
                          ))}
                          {booking.players.length > 2 && (
                            <span> +{booking.players.length - 2} altri</span>
                          )}
                        </span>
                      )}
                    </div>
                    
                    {/* Avatar mini */}
                    <div className="flex -space-x-0.5">
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white border border-white">
                        <span className="text-[9px]">{user?.displayName?.charAt(0).toUpperCase() || 'U'}</span>
                      </div>
                      
                      {/* Altri giocatori se presenti */}
                      {(booking.players?.length || 0) > 0 && (
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold text-white border border-white">
                          <span className="text-[8px]">+{booking.players.length}</span>
                        </div>
                      )}
                      
                      {/* Slot vuoto indicatore */}
                      {((booking.players?.length || 0) + 1) < 4 && (
                        <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 border border-white flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Prezzo e status */}
                  <div className="text-right">
                    {booking.price && (
                      <div className="text-xs font-bold text-green-600 dark:text-green-400">
                        €{booking.price}
                      </div>
                    )}
                    <div className="text-[9px] text-gray-500">
                      {((booking.players?.length || 0) + 1) < 4 ? 'Aperta' : 'Completa'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Card "Prenota nuovo" ultra-compatta */}
          <div
            onClick={() => navigate('/booking')}
            className={`bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 
              hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/30 dark:hover:to-blue-700/30
              border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg cursor-pointer
              min-w-[220px] h-28 flex-shrink-0 flex flex-col items-center justify-center
              transition-all hover:border-blue-400 dark:hover:border-blue-500 group`}
          >
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300 text-center">
              Prenota Campo
            </span>
          </div>
        </div>
      </div>
      
      {/* Indicatori scroll minimalisti */}
      {displayBookings.length > 0 && (
        <div className="flex justify-center mt-2 sm:hidden">
          <div className="flex gap-0.5">
            {displayBookings.slice(0, Math.min(6, displayBookings.length)).map((_, index) => (
              <div key={index} className="w-0.5 h-0.5 rounded-full bg-gray-300"></div>
            ))}
            {displayBookings.length > 6 && (
              <div className="w-0.5 h-0.5 rounded-full bg-blue-500"></div>
            )}
          </div>
        </div>
      )}

      {/* Tasto Nuova Prenotazione solo su desktop */}
      <div className="hidden sm:block mt-4 pt-3 border-t border-gray-200">
        <button
          onClick={() => navigate('/booking')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors text-sm font-medium"
        >
          Nuova Prenotazione
        </button>
      </div>

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
