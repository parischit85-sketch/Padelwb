// =============================================
// FILE: src/hooks/usePWA.js
// =============================================
import { useState, useEffect } from 'react';

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Controlla se l'app è già installata
    const checkIfInstalled = () => {
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = window.navigator.standalone === true;
      setIsInstalled(isInStandaloneMode || isIOSStandalone);
    };

    checkIfInstalled();

    // Gestisce l'evento beforeinstallprompt
    const handleBeforeInstallPrompt = (event) => {
      console.log('🚀 PWA installation prompt ready');
      event.preventDefault();
      setDeferredPrompt(event);
      setIsInstallable(true);
    };

    // Gestisce l'evento appinstalled
    const handleAppInstalled = () => {
      console.log('✅ PWA installed successfully');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Ascolta gli eventi
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Funzione per installare l'app
  const installApp = async () => {
    if (!deferredPrompt) {
      console.warn('⚠️ No deferred prompt available');
      return false;
    }

    try {
      // Mostra il prompt di installazione
      deferredPrompt.prompt();

      // Aspetta la scelta dell'utente
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ User accepted PWA installation');
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      } else {
        console.log('❌ User declined PWA installation');
        return false;
      }
    } catch (error) {
      console.error('❌ PWA installation failed:', error);
      return false;
    }
  };

  // Funzione per mostrare istruzioni iOS
  const getIOSInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);
    
    if (isIOS && isSafari) {
      return {
        show: true,
        instructions: [
          'Tocca il pulsante Condividi',
          'Scorri verso il basso e tocca "Aggiungi alla schermata Home"',
          'Tocca "Aggiungi" nell\'angolo in alto a destra'
        ]
      };
    }
    
    return { show: false, instructions: [] };
  };

  return {
    isInstallable,
    isInstalled,
    installApp,
    iosInstructions: getIOSInstallInstructions()
  };
}
