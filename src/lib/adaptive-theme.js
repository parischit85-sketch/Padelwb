import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Controlla il tema preferito dal sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Imposta il tema iniziale
    setIsDark(mediaQuery.matches);
    
    // Listener per i cambiamenti del tema di sistema
    const handleChange = (e) => {
      setIsDark(e.matches);
    };
    
    mediaQuery.addListener(handleChange);
    
    // Cleanup
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return { isDark };
};

// Funzione per ottenere i token di tema ottimizzati
export const getThemeTokens = (isDark = false) => {
  if (isDark) {
    return {
      // Backgrounds - Temi scuri ottimizzati
      bg: 'bg-gray-900',
      bgSecondary: 'bg-gray-800',
      bgTertiary: 'bg-gray-700',
      cardBg: 'bg-gray-800 border-gray-700',
      modalBg: 'bg-gray-800',
      
      // Text - Massima leggibilità su scuro con contrasto elevato
      text: 'text-white',
      textSecondary: 'text-gray-200',
      textMuted: 'text-gray-300',
      subtext: 'text-gray-200',
      
      // Borders - Più visibili
      border: 'border-gray-600',
      borderLight: 'border-gray-700',
      
      // Inputs - Ottimizzati per il dark mode
      input: 'bg-gray-700 border-gray-600 text-white placeholder-gray-300 focus:border-blue-400 focus:ring-blue-400',
      
      // Buttons - Colori accattivanti su scuro
      button: 'bg-blue-600 hover:bg-blue-500 text-white',
      buttonSecondary: 'bg-gray-600 hover:bg-gray-500 text-white',
      
      // Status colors - Più brillanti per migliore visibilità
      success: 'text-green-400',
      error: 'text-red-400',
      warning: 'text-yellow-400',
      info: 'text-blue-400',
      
      // Shadows - Più marcate su sfondo scuro
      shadow: 'shadow-2xl shadow-black/40',
      
      // Dividers
      divider: 'border-gray-600'
    };
  } else {
    return {
      // Backgrounds - Tema chiaro pulito
      bg: 'bg-white',
      bgSecondary: 'bg-gray-50',
      bgTertiary: 'bg-gray-100',
      cardBg: 'bg-white border-gray-200',
      modalBg: 'bg-white',
      
      // Text - Alta leggibilità su chiaro
      text: 'text-gray-900',
      textSecondary: 'text-gray-700',
      textMuted: 'text-gray-500',
      subtext: 'text-gray-600',
      
      // Borders - Delicate ma definite
      border: 'border-gray-200',
      borderLight: 'border-gray-100',
      
      // Inputs - Puliti e accessibili
      input: 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500',
      
      // Buttons - Colori vivaci su chiaro
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      buttonSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
      
      // Status colors - Colori standard per tema chiaro
      success: 'text-emerald-600',
      error: 'text-red-600',
      warning: 'text-amber-600',
      info: 'text-blue-600',
      
      // Shadows - Sottili su sfondo chiaro
      shadow: 'shadow-lg shadow-gray-200/50',
      
      // Dividers
      divider: 'border-gray-200'
    };
  }
};
