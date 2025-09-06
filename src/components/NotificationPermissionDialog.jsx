import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import notificationService from '@services/notifications.js';
import Modal from '@ui/Modal.jsx';

const NotificationPermissionDialog = ({ T }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);

  useEffect(() => {
    // Solo su piattaforme native
    if (!Capacitor.isNativePlatform()) return;

    // Controlla se abbiamo già richiesto i permessi
    const hasRequestedBefore = localStorage.getItem('notification-permission-requested');
    
    if (!hasRequestedBefore) {
      // Mostra il dialogo dopo 2 secondi per dare tempo all'app di caricare
      const timer = setTimeout(() => {
        setShowDialog(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllowNotifications = async () => {
    setPermissionRequested(true);
    
    try {
      // Inizializza il servizio notifiche (questo richiederà i permessi)
      await notificationService.initialize();
      
      // Salva che abbiamo richiesto i permessi
      localStorage.setItem('notification-permission-requested', 'true');
      
      setShowDialog(false);
      
      if (notificationService.permissionGranted) {
        // Mostra una notifica di test
        setTimeout(() => {
          alert('🎉 Notifiche attivate! Riceverai avvisi per partite e promemoria.');
        }, 500);
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      setPermissionRequested(false);
    }
  };

  const handleSkip = () => {
    // Salva che abbiamo chiesto (anche se l'utente ha rifiutato)
    localStorage.setItem('notification-permission-requested', 'true');
    setShowDialog(false);
  };

  if (!showDialog) return null;

  return (
    <Modal open={showDialog} onClose={handleSkip} T={T}>
      <div className="text-center space-y-6 p-4">
        {/* Icona notifiche */}
        <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">🔔</span>
        </div>
        
        {/* Titolo */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Attiva le Notifiche
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Ricevi notifiche quando vieni aggiunto a una partita e promemoria 2 ore prima dell'inizio.
          </p>
        </div>

        {/* Lista benefici */}
        <div className="bg-blue-50 rounded-lg p-4 text-left">
          <h4 className="font-semibold text-blue-900 mb-3">Cosa riceverai:</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Notifica immediata quando vieni aggiunto a una partita</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Promemoria automatico 2 ore prima della partita</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Aggiornamenti sull'app quando disponibili</span>
            </li>
          </ul>
        </div>

        {/* Pulsanti */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Non ora
          </button>
          <button
            onClick={handleAllowNotifications}
            disabled={permissionRequested}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {permissionRequested ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Attivando...
              </>
            ) : (
              <>🔔 Attiva Notifiche</>
            )}
          </button>
        </div>
        
        <p className="text-xs text-gray-500">
          Puoi sempre modificare le impostazioni delle notifiche dal profilo.
        </p>
      </div>
    </Modal>
  );
};

export default NotificationPermissionDialog;
