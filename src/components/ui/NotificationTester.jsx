import React, { useState } from 'react';
import { useTheme } from '../../lib/adaptive-theme.js';
import { themeTokens } from '../../lib/theme.js';
import * as notifications from '../../services/notifications.js';

export default function NotificationTester() {
  const { isDark } = useTheme();
  const T = themeTokens(isDark);
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addTestResult = (message, type = 'info') => {
    const result = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [result, ...prev].slice(0, 5)); // Mantieni solo gli ultimi 5 risultati
  };

  const testPermissions = async () => {
    setIsLoading(true);
    addTestResult('🔍 Controllo permessi notifiche...');
    
    try {
      const hasPermission = await notifications.checkPermissions();
      if (hasPermission) {
        addTestResult('✅ Permessi notifiche: CONCESSI', 'success');
      } else {
        addTestResult('❌ Permessi notifiche: NON CONCESSI', 'error');
        
        // Prova a richiederli
        addTestResult('📋 Richiesta permessi in corso...');
        const granted = await notifications.requestPermissions();
        if (granted) {
          addTestResult('✅ Permessi concessi dopo la richiesta!', 'success');
        } else {
          addTestResult('❌ Permessi negati dall\'utente', 'error');
        }
      }
    } catch (error) {
      addTestResult(`❌ Errore controllo permessi: ${error.message}`, 'error');
    }
    
    setIsLoading(false);
  };

  const testInstantNotification = async () => {
    setIsLoading(true);
    addTestResult('📱 Invio notifica di test...');
    
    try {
      await notifications.sendTestNotification();
      addTestResult('✅ Notifica di test inviata!', 'success');
    } catch (error) {
      addTestResult(`❌ Errore invio notifica: ${error.message}`, 'error');
    }
    
    setIsLoading(false);
  };

  const testScheduledNotification = async () => {
    setIsLoading(true);
    addTestResult('⏰ Programmazione notifica fra 10 secondi...');
    
    try {
      await notifications.scheduleTestNotification();
      addTestResult('✅ Notifica programmata per 10 secondi!', 'success');
    } catch (error) {
      addTestResult(`❌ Errore programmazione: ${error.message}`, 'error');
    }
    
    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getResultColor = (type) => {
    switch (type) {
      case 'success': return T.success;
      case 'error': return T.error;
      case 'warning': return T.warning;
      default: return T.textSecondary;
    }
  };

  return (
    <div className={`${T.card} space-y-4`}>
      <div className="border-b pb-3">
        <h3 className={`text-lg font-semibold ${T.text} mb-2`}>
          🧪 Test Notifiche
        </h3>
        <p className={`text-sm ${T.textMuted}`}>
          Usa questi pulsanti per testare il sistema di notifiche
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={testPermissions}
          disabled={isLoading}
          className={`${T.btnPrimary} text-sm disabled:opacity-50`}
        >
          {isLoading ? '🔄' : '🔍'} Verifica Permessi
        </button>

        <button
          onClick={testInstantNotification}
          disabled={isLoading}
          className={`${T.btnGhost} ${T.text} text-sm disabled:opacity-50`}
        >
          {isLoading ? '🔄' : '📱'} Test Immediato
        </button>

        <button
          onClick={testScheduledNotification}
          disabled={isLoading}
          className={`${T.btnGhost} ${T.text} text-sm disabled:opacity-50`}
        >
          {isLoading ? '🔄' : '⏰'} Test Programmato
        </button>

        <button
          onClick={clearResults}
          disabled={isLoading}
          className={`${T.btnGhost} ${T.textMuted} text-sm disabled:opacity-50`}
        >
          🗑️ Pulisci Log
        </button>
      </div>

      {testResults.length > 0 && (
        <div className={`mt-4 p-3 ${T.bgSecondary} rounded-lg`}>
          <h4 className={`text-sm font-medium ${T.text} mb-2`}>
            📋 Log Test (ultimi 5):
          </h4>
          <div className="space-y-1">
            {testResults.map((result) => (
              <div
                key={result.id}
                className={`text-xs ${getResultColor(result.type)} font-mono`}
              >
                <span className={`${T.textMuted} mr-2`}>{result.timestamp}</span>
                {result.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
