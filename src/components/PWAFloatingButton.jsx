// =============================================
// FILE: src/components/PWAFloatingButton.jsx
// =============================================
import React, { useState } from 'react';
import { usePWA } from '../hooks/usePWA';

export default function PWAFloatingButton() {
  const { isInstallable, isInstalled, installApp, iosInstructions } = usePWA();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Non mostrare se già installata
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    // Se è iOS Safari, mostra le istruzioni
    if (iosInstructions.show) {
      setShowIOSModal(true);
      return;
    }

    // Altrimenti prova l'installazione automatica
    if (isInstallable) {
      await installApp();
    }
  };

  // Se non è installabile e non è iOS, non mostrare il pulsante
  if (!isInstallable && !iosInstructions.show) {
    return null;
  }

  return (
    <>
      {/* Floating PWA Button - Solo mobile */}
      <div className="sm:hidden fixed right-4 bottom-20 z-[9999]">
        {!isMinimized ? (
          <div className="flex items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg backdrop-blur-sm">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                />
              </svg>
              Installa App
            </button>
            
            {/* Pulsante minimizza */}
            <button
              onClick={() => setIsMinimized(true)}
              className="px-3 py-3 text-white/70 hover:text-white border-l border-white/20"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          // Versione minimizzata
          <button
            onClick={() => setIsMinimized(false)}
            className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center backdrop-blur-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        )}
      </div>

      {/* Modal per istruzioni iOS */}
      {showIOSModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                📱 Installa Paris League
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                Per installare l'app sul tuo iPhone/iPad:
              </p>

              <div className="text-left space-y-3 mb-6">
                {iosInstructions.instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-sm text-gray-700">{instruction}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleInstallClick}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Prova Installazione Automatica
                </button>
                
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors text-sm"
                >
                  Ho capito
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
