// =============================================
// FILE: src/components/ui/BookingDetailModal.jsx
// =============================================
import React from 'react';
import Modal from '@ui/Modal.jsx';
import Badge from '@ui/Badge.jsx';
import { BOOKING_CONFIG } from '@services/bookings.js';

export default function BookingDetailModal({ booking, isOpen, onClose, state, T }) {
  if (!booking) return null;

  // Usa i campi da state se disponibili, altrimenti da BOOKING_CONFIG
  const courts = state?.courts || BOOKING_CONFIG.courts;
  const court = courts?.find(c => c.id === booking.courtId);
  
  const bookingDate = new Date(booking.date);
  const bookingDateTime = new Date(`${booking.date}T${booking.time}:00`);
  const now = new Date();
  
  const isToday = bookingDate.toDateString() === new Date().toDateString();
  const isTomorrow = bookingDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
  const isPast = bookingDateTime < now;
  const isUpcoming = bookingDateTime > now && bookingDateTime <= new Date(now.getTime() + 24 * 60 * 60 * 1000);

  let dateLabel;
  if (isPast) {
    dateLabel = 'Passata';
  } else if (isToday) {
    dateLabel = 'Oggi';
  } else if (isTomorrow) {
    dateLabel = 'Domani';
  } else {
    dateLabel = bookingDate.toLocaleDateString('it-IT', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  }

  // Calcola il tempo rimanente
  const timeUntilBooking = bookingDateTime - now;
  const hoursUntil = Math.floor(timeUntilBooking / (1000 * 60 * 60));
  const minutesUntil = Math.floor((timeUntilBooking % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Dettaglio Prenotazione"
      T={T}
      size="lg"
    >
      <div className="space-y-6">
        {/* Header della prenotazione */}
        <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <span className="text-2xl">🏟️</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">{court?.name || 'Campo Padel'}</h2>
                  <p className="text-white/80">{court?.location || 'Padel Club'}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-white/80 text-sm">ID Prenotazione</div>
                <div className="font-mono text-xs bg-white/20 px-2 py-1 rounded">
                  {booking.id?.substring(0, 8)}...
                </div>
              </div>
            </div>

            {/* Status e timing */}
            <div className="flex flex-wrap gap-2">
              {isPast && (
                <Badge variant="secondary" size="sm" T={T}>Completata</Badge>
              )}
              {isToday && !isPast && (
                <Badge variant="warning" size="sm" T={T}>Oggi</Badge>
              )}
              {isUpcoming && (
                <Badge variant="success" size="sm" T={T}>Prossima</Badge>
              )}
              {booking.confirmed && (
                <Badge variant="primary" size="sm" T={T}>Confermata</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Informazioni principali */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Data e Orario */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">📅</span>
              <h3 className="font-semibold text-gray-900">Data e Orario</h3>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Data:</span>
                <div className="font-medium">{dateLabel}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Orario:</span>
                <div className="font-medium">{booking.time}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Durata:</span>
                <div className="font-medium">{booking.duration || 60} minuti</div>
              </div>
              {!isPast && timeUntilBooking > 0 && (
                <div>
                  <span className="text-sm text-gray-600">Tempo rimanente:</span>
                  <div className="font-medium text-blue-600">
                    {hoursUntil > 0 && `${hoursUntil}h `}
                    {minutesUntil}min
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dettagli del Campo */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🏟️</span>
              <h3 className="font-semibold text-gray-900">Campo</h3>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Nome:</span>
                <div className="font-medium">{court?.name || `Campo ${booking.courtId}`}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Tipo:</span>
                <div className="font-medium">{court?.type || 'Padel Standard'}</div>
              </div>
              {court?.features && (
                <div>
                  <span className="text-sm text-gray-600">Caratteristiche:</span>
                  <div className="text-sm">{court.features.join(', ')}</div>
                </div>
              )}
            </div>
          </div>

          {/* Giocatori */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">👥</span>
              <h3 className="font-semibold text-gray-900">Giocatori</h3>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Numero giocatori:</span>
                <div className="font-medium">{booking.players || 1}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Organizzatore:</span>
                <div className="font-medium">{booking.userName || booking.userEmail}</div>
              </div>
              {booking.participants && booking.participants.length > 0 && (
                <div>
                  <span className="text-sm text-gray-600">Partecipanti:</span>
                  <div className="text-sm">
                    {booking.participants.map(p => p.name || p.email).join(', ')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dettagli Pagamento */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">💰</span>
              <h3 className="font-semibold text-gray-900">Pagamento</h3>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Prezzo totale:</span>
                <div className="font-medium text-lg text-green-600">
                  €{booking.price || 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Stato pagamento:</span>
                <div className="font-medium">
                  {booking.paymentStatus === 'paid' ? (
                    <span className="text-green-600">✅ Pagato</span>
                  ) : booking.paymentStatus === 'pending' ? (
                    <span className="text-yellow-600">⏳ In attesa</span>
                  ) : (
                    <span className="text-gray-600">💳 Da confermare</span>
                  )}
                </div>
              </div>
              {booking.paymentMethod && (
                <div>
                  <span className="text-sm text-gray-600">Metodo:</span>
                  <div className="font-medium">{booking.paymentMethod}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Note aggiuntive */}
        {booking.notes && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📝</span>
              <h3 className="font-semibold text-gray-900">Note</h3>
            </div>
            <p className="text-gray-700">{booking.notes}</p>
          </div>
        )}

        {/* Informazioni di contatto */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">ℹ️</span>
            <h3 className="font-semibold text-gray-900">Informazioni Utili</h3>
          </div>
          <div className="text-sm text-gray-700 space-y-1">
            <p>• Arriva 10 minuti prima dell'orario prenotato</p>
            <p>• Porta racchette e palline (se necessario)</p>
            <p>• In caso di maltempo, contatta la struttura</p>
            {court?.phone && (
              <p>• Tel. struttura: <span className="font-medium">{court.phone}</span></p>
            )}
          </div>
        </div>

        {/* Azioni */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!isPast && (
            <>
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors font-medium">
                📧 Condividi Dettagli
              </button>
              <button className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-4 rounded-lg transition-colors font-medium">
                ✏️ Modifica
              </button>
              <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors font-medium">
                ❌ Cancella
              </button>
            </>
          )}
          {isPast && (
            <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors font-medium">
              ⭐ Lascia Recensione
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
