// =============================================
// FILE: src/features/booking/MyBookings.jsx
// =============================================
import React from 'react';
import Section from '@ui/Section.jsx';
import Badge from '@ui/Badge.jsx';
import { createDSClasses } from '@lib/design-system.js';

export default function MyBookings({ bookings, user, onCancel, T }) {
  const ds = createDSClasses(T);

  // Filtra solo le prenotazioni dell'utente corrente
  const userBookings = bookings.filter(booking => 
    booking.bookedBy === (user?.displayName || user?.email)
  );

  // Ordina per data e ora
  const sortedBookings = [...userBookings].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA - dateB;
  });

  if (!user) {
    return (
      <Section title="Le Mie Prenotazioni" T={T}>
        <div className="text-center py-8">
          <p className={ds.bodySm}>Accedi per vedere le tue prenotazioni</p>
        </div>
      </Section>
    );
  }

  if (sortedBookings.length === 0) {
    return (
      <Section title="Le Mie Prenotazioni" T={T}>
        <div className="text-center py-8">
          <p className={ds.bodySm}>Non hai ancora prenotazioni</p>
        </div>
      </Section>
    );
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isUpcoming = (date, time) => {
    const bookingDateTime = new Date(`${date}T${time}`);
    return bookingDateTime > new Date();
  };

  const canCancel = (date, time) => {
    const bookingDateTime = new Date(`${date}T${time}`);
    const hoursUntilBooking = (bookingDateTime - new Date()) / (1000 * 60 * 60);
    return hoursUntilBooking > 24; // Può cancellare solo se mancano più di 24 ore
  };

  return (
    <Section title="Le Mie Prenotazioni" T={T}>
      <div className="space-y-4">
        {sortedBookings.map((booking) => (
          <div
            key={booking.id}
            className={`${T.borderMd} ${T.cardBg} ${T.border} p-4 ${T.transitionNormal}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className={`${ds.h5} mb-1`}>{booking.courtName}</h3>
                <p className={ds.bodySm}>
                  {formatDate(booking.date)} alle {booking.time}
                </p>
              </div>
              <div className="flex gap-2">
                {isUpcoming(booking.date, booking.time) ? (
                  <Badge variant="success" size="sm" T={T}>Prossima</Badge>
                ) : (
                  <Badge variant="default" size="sm" T={T}>Passata</Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
              <div>
                <span className={ds.bodySm}>Durata:</span>
                <span className="font-medium ml-1">{booking.duration} min</span>
              </div>
              <div>
                <span className={ds.bodySm}>Prezzo:</span>
                <span className="font-medium ml-1 text-emerald-600 dark:text-emerald-400">
                  {booking.price}€
                </span>
              </div>
            </div>

            {/* Servizi extra */}
            <div className="flex gap-2 mb-3">
              {booking.lighting && (
                <Badge variant="warning" size="xs" T={T}>Illuminazione</Badge>
              )}
              {booking.heating && (
                <Badge variant="info" size="xs" T={T}>Riscaldamento</Badge>
              )}
            </div>

            {/* Giocatori */}
            {booking.players && booking.players.length > 1 && (
              <div className="mb-3">
                <span className={`${ds.bodySm} block mb-1`}>Giocatori:</span>
                <div className="flex flex-wrap gap-1">
                  {booking.players.map((player, index) => (
                    <Badge 
                      key={index} 
                      variant={index === 0 ? "primary" : "default"} 
                      size="xs" 
                      T={T}
                    >
                      {player} {index === 0 && "(Tu)"}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Azioni */}
            {isUpcoming(booking.date, booking.time) && (
              <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                {canCancel(booking.date, booking.time) ? (
                  <button
                    onClick={() => {
                      if (confirm('Sei sicuro di voler cancellare questa prenotazione?')) {
                        onCancel(booking.id);
                      }
                    }}
                    className={`${T.btnGhost} text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20`}
                  >
                    Cancella
                  </button>
                ) : (
                  <span className={`${ds.bodySm} text-gray-500`}>
                    Non cancellabile (meno di 24h)
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
