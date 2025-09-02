import { useState, useEffect } from 'react';
import { auth } from '@services/firebase';
import { logout } from '@services/auth';
import Section from '@ui/Section';
import Modal from '@ui/Modal';
import { loadActiveUserBookings, loadBookingHistory, cancelCloudBooking } from '@services/cloud-bookings.js';

function Profile({ T }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  
  // Stati per prenotazioni
  const [activeBookings, setActiveBookings] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
      
      // Carica prenotazioni se l'utente è autenticato
      if (user) {
        loadUserBookings(user);
      } else {
        setActiveBookings([]);
        setBookingHistory([]);
      }
    });

    return () => unsubscribe();
  }, []);
  
  // Funzione per caricare le prenotazioni dell'utente
  const loadUserBookings = async (user) => {
    if (!user) return;
    
    setLoadingBookings(true);
    try {
      const [active, history] = await Promise.all([
        loadActiveUserBookings(user.uid),
        loadBookingHistory(user.uid)
      ]);
      
      setActiveBookings(active);
      setBookingHistory(history);
    } catch (error) {
      console.error('Errore caricamento prenotazioni:', error);
    } finally {
      setLoadingBookings(false);
    }
  };
  
  // Funzione per cancellare una prenotazione
  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Sei sicuro di voler cancellare questa prenotazione?')) return;
    
    try {
      await cancelCloudBooking(bookingId, user);
      // Ricarica le prenotazioni
      await loadUserBookings(user);
      alert('Prenotazione cancellata con successo!');
    } catch (error) {
      console.error('Errore cancellazione prenotazione:', error);
      alert('Errore durante la cancellazione. Riprova più tardi.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutModal(false);
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  const getProviderIcon = (providerId) => {
    switch (providerId) {
      case 'google.com':
        return '🔗';
      case 'facebook.com':
        return '📘';
      case 'password':
        return '🔐';
      default:
        return '📧';
    }
  };

  const getProviderName = (providerId) => {
    switch (providerId) {
      case 'google.com':
        return 'Google';
      case 'facebook.com':
        return 'Facebook';
      case 'password':
        return 'Email/Password';
      default:
        return 'Email';
    }
  };

  if (loading) {
    return (
      <Section title="Profilo Utente" icon="👤" T={T}>
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </Section>
    );
  }

  if (!user) {
    return (
      <Section title="Profilo Utente" icon="👤" T={T}>
        <div className="text-center py-16">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-400 text-3xl">👤</span>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Non autenticato</h3>
          <p className="text-gray-600">Effettua il login per accedere al tuo profilo</p>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Profilo Utente" icon="👤" T={T}>
      <div className="space-y-8">
        {/* Header del Profilo */}
        <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

          <div className="relative flex items-center space-x-6">
            <div className="relative">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Avatar"
                  className="w-24 h-24 rounded-2xl border-4 border-white/20 shadow-xl"
                />
              ) : (
                <div className="w-24 h-24 bg-white/20 rounded-2xl border-4 border-white/20 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white text-3xl">👤</span>
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{user.displayName || 'Utente'}</h2>
              <p className="text-white/80 mb-3">{user.email}</p>
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                  ✅ Verificato
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                  {getProviderIcon(user.providerData[0]?.providerId)}{' '}
                  {getProviderName(user.providerData[0]?.providerId)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Panoramica', icon: '📊' },
              { id: 'bookings', label: 'Prenotazioni Attive', icon: '📅' },
              { id: 'history', label: 'Storico', icon: '🗂️' },
              { id: 'security', label: 'Sicurezza', icon: '🔒' },
              { id: 'activity', label: 'Attività', icon: '📈' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Informazioni Principali */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Informazioni Account</h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    {isEditing ? '💾 Salva' : '✏️ Modifica'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="profile-displayName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Nome Display
                    </label>
                    <input
                      id="profile-displayName"
                      type="text"
                      value={user.displayName || ''}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        isEditing ? 'bg-white' : 'bg-gray-50 text-gray-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="profile-email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email
                    </label>
                    <input
                      id="profile-email"
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="profile-uid"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      ID Utente
                    </label>
                    <input
                      id="profile-uid"
                      type="text"
                      value={user.uid?.substring(0, 20) + '...' || ''}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="profile-created"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Data Registrazione
                    </label>
                    <input
                      id="profile-created"
                      type="text"
                      value={
                        user.metadata?.creationTime
                          ? new Date(user.metadata.creationTime).toLocaleDateString('it-IT')
                          : 'N/A'
                      }
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar con statistiche */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiche Account</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Sessioni attive</span>
                    <span className="font-semibold text-green-600">1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Ultimo accesso</span>
                    <span className="text-sm text-gray-900">
                      {user.metadata?.lastSignInTime
                        ? new Date(user.metadata.lastSignInTime).toLocaleDateString('it-IT')
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Email verificata</span>
                    <span className="text-green-600">✅</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Azioni Rapide</h3>
                <div className="space-y-3">
                  <button className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    🔄 Aggiorna Profilo
                  </button>
                  <button className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    📧 Cambia Email
                  </button>
                  <button className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    🔐 Cambia Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Prenotazioni Attive */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Prenotazioni Attive</h3>
                <button
                  onClick={() => loadUserBookings(user)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  🔄 Ricarica
                </button>
              </div>

              {loadingBookings ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Caricamento prenotazioni...</p>
                </div>
              ) : activeBookings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📅</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Nessuna prenotazione attiva</h4>
                  <p className="text-gray-600">Le tue prossime prenotazioni appariranno qui.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeBookings.map((booking) => (
                    <div key={booking.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-lg font-semibold text-emerald-600">
                              {booking.courtName || `Campo ${booking.courtId}`}
                            </span>
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                              {booking.status === 'confirmed' ? 'Confermata' : booking.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">📅 Data:</span>
                              <br />
                              {new Date(booking.date).toLocaleDateString('it-IT', { 
                                weekday: 'short', 
                                day: 'numeric', 
                                month: 'short' 
                              })}
                            </div>
                            <div>
                              <span className="font-medium">🕐 Orario:</span>
                              <br />
                              {booking.time} ({booking.duration}min)
                            </div>
                            <div>
                              <span className="font-medium">💰 Prezzo:</span>
                              <br />
                              €{booking.price}
                            </div>
                            <div>
                              <span className="font-medium">👥 Giocatori:</span>
                              <br />
                              {booking.players?.length || 1}
                            </div>
                          </div>
                          {booking.notes && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">📝 Note:</span> {booking.notes}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            ❌ Cancella
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Storico Prenotazioni */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Storico Prenotazioni</h3>
                <button
                  onClick={() => loadUserBookings(user)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  🔄 Ricarica
                </button>
              </div>

              {loadingBookings ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Caricamento storico...</p>
                </div>
              ) : bookingHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🗂️</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Nessuna prenotazione passata</h4>
                  <p className="text-gray-600">Lo storico delle tue prenotazioni apparirà qui.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookingHistory.map((booking) => (
                    <div key={booking.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 opacity-75">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-lg font-semibold text-gray-600">
                              {booking.courtName || `Campo ${booking.courtId}`}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.status === 'confirmed' ? 'Completata' : 
                               booking.status === 'cancelled' ? 'Cancellata' : booking.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">📅 Data:</span>
                              <br />
                              {new Date(booking.date).toLocaleDateString('it-IT', { 
                                weekday: 'short', 
                                day: 'numeric', 
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                            <div>
                              <span className="font-medium">🕐 Orario:</span>
                              <br />
                              {booking.time} ({booking.duration}min)
                            </div>
                            <div>
                              <span className="font-medium">💰 Prezzo:</span>
                              <br />
                              €{booking.price}
                            </div>
                            <div>
                              <span className="font-medium">👥 Giocatori:</span>
                              <br />
                              {booking.players?.length || 1}
                            </div>
                          </div>
                          {booking.notes && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">📝 Note:</span> {booking.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Impostazioni di Sicurezza
              </h3>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white">🔐</span>
                    </div>
                    <div>
                      <p className="font-medium text-green-800">Autenticazione a Due Fattori</p>
                      <p className="text-sm text-green-600">Attiva tramite provider OAuth</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-semibold">✅ Attiva</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white">📧</span>
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">Email Verificata</p>
                      <p className="text-sm text-blue-600">La tua email è stata confermata</p>
                    </div>
                  </div>
                  <span className="text-blue-600 font-semibold">✅ Verificata</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white">
                        {getProviderIcon(user.providerData[0]?.providerId)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-purple-800">
                        Provider: {getProviderName(user.providerData[0]?.providerId)}
                      </p>
                      <p className="text-sm text-purple-600">Metodo di autenticazione sicuro</p>
                    </div>
                  </div>
                  <span className="text-purple-600 font-semibold">🔒 Sicuro</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Attività Recente</h3>

              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">🔑</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Login effettuato</p>
                    <p className="text-sm text-gray-600">
                      {user.metadata?.lastSignInTime
                        ? new Date(user.metadata.lastSignInTime).toLocaleString('it-IT')
                        : 'Data non disponibile'}
                    </p>
                  </div>
                  <span className="text-green-600 text-sm font-medium">Successo</span>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">👤</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Account creato</p>
                    <p className="text-sm text-gray-600">
                      {user.metadata?.creationTime
                        ? new Date(user.metadata.creationTime).toLocaleString('it-IT')
                        : 'Data non disponibile'}
                    </p>
                  </div>
                  <span className="text-blue-600 text-sm font-medium">Completato</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer con Logout */}
        <div className="flex justify-center pt-8 border-t border-gray-200">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            🚪 Disconnetti Account
          </button>
        </div>
      </div>

      {/* Modal di conferma logout modernizzato */}
      {showLogoutModal && (
        <Modal
          open={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          title="Conferma Disconnessione"
          T={T}
        >
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-red-600 text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Disconnetti Account</h3>
              <p className="text-gray-600">
                Sei sicuro di voler disconnettere il tuo account? Dovrai effettuare nuovamente il
                login per accedere.
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-lg"
              >
                Conferma Disconnessione
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Section>
  );
}

export default Profile;
