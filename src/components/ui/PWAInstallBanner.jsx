// =============================================
// FILE: src/components/PWAInstallBanner.jsx
// =============================================
import React, { useState, useEffect } from 'react';
import { usePWA } from '../../hooks/usePWA.js';

export default function PWAInstallBanner({ className = '' }) {
  const { isInstallable, isInstalled, installApp, iosInstructions } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  // Controlla se il banner è stato già dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  // Non mostrare se già installata, dismissata, o non installabile
  if (isInstalled || isDismissed || (!isInstallable && !iosInstructions.show)) {
    return null;
  }

  const handleInstall = async () => {
    // Se è iOS Safari, mostra le istruzioni
    if (iosInstructions.show) {
      setShowIOSModal(true);
      return;
    }

    // Altrimenti prova l'installazione automatica
    if (isInstallable) {
      const success = await installApp();
      if (success) {
        setIsDismissed(true);
      }
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  return (
    <>
      {/* Banner di installazione PWA */}
      <div className={`bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg ${className}`}>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M6.938 12.79a2.121 2.121 0 000-1.58c.232-.382.555-.728.955-.955C8.667 9.75 10.25 9 12 9s3.333.75 4.107 1.255c.4.227.723.573.955.955a2.121 2.121 0 000 1.58m-4.498 1.175l1.436-1.436m0 0l1.436 1.436m-1.436-1.436v4" />
                  </svg>
                </div>
              </div>
              
              <div className="text-center sm:text-left">
                <h3 className="font-semibold text-white mb-1">
                  📱 Installa Paris League App
                </h3>
                <p className="text-blue-100 text-sm">
                  Accedi velocemente e ricevi notifiche push per le tue prenotazioni
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleInstall}
                className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {iosInstructions.show ? 'Come installare' : 'Installa ora'}
              </button>
              
              <button
                onClick={handleDismiss}
                className="text-blue-100 hover:text-white p-2 transition-colors"
                title="Nascondi banner"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal per istruzioni iOS */}
      {showIOSModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M6.938 12.79a2.121 2.121 0 000-1.58c.232-.382.555-.728.955-.955C8.667 9.75 10.25 9 12 9s3.333.75 4.107 1.255c.4.227.723.573.955.955a2.121 2.121 0 000 1.58m-4.498 1.175l1.436-1.436m0 0l1.436 1.436m-1.436-1.436v4" />
                </svg>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                📱 Installa Paris League
              </h3>
              
              <p className="text-gray-600 mb-6">
                Per installare l'app su iPhone/iPad:
              </p>

              <div className="text-left space-y-4 mb-8">
                {iosInstructions.instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-sm text-gray-700 pt-1">{instruction}</p>
                  </div>
                ))}
              </div>

              {/* Visualizzazione icone Safari */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.625 9l-1.5 6H8.25l1.5-6h7.875z"/>
                    </svg>
                    <span>Condividi</span>
                  </div>
                  <span>→</span>
                  <div className="flex items-center gap-1">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Aggiungi</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Ho capito
                </button>
                <button
                  onClick={() => {
                    setShowIOSModal(false);
                    handleDismiss();
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Non mostrare più
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
