import React, { useState, useEffect } from 'react';
import { useTheme } from '../../lib/adaptive-theme.js';
import { themeTokens } from '../../lib/theme.js';
import * as notifications from '../../services/notifications.js';

export default function QuickActions() {
  const { isDark } = useTheme();
  const T = themeTokens(isDark);
  const [stats, setStats] = useState({
    nextMatch: null,
    pendingBookings: 0,
    notifications: false
  });

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      const hasPermission = await notifications.checkPermissions();
      setStats(prev => ({ ...prev, notifications: hasPermission }));
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };

  const enableNotifications = async () => {
    try {
      const granted = await notifications.requestPermissions();
      if (granted) {
        await notifications.sendTestNotification();
        setStats(prev => ({ ...prev, notifications: true }));
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    }
  };

  return (
    <div className={`${T.card} space-y-4`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${T.text}`}>⚡ Azioni Rapide</h3>
        <div className={`w-2 h-2 rounded-full ${stats.notifications ? 'bg-green-500' : 'bg-red-500'}`}></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Quick Book */}
        <div className={`${T.bgSecondary} rounded-xl p-4 text-center mobile-card gesture-feedback cursor-pointer`}>
          <div className="text-2xl mb-2">🏓</div>
          <div className={`text-sm font-medium ${T.text}`}>Prenota Ora</div>
          <div className={`text-xs ${T.textMuted}`}>Campo libero</div>
        </div>

        {/* Quick Match */}
        <div className={`${T.bgSecondary} rounded-xl p-4 text-center mobile-card gesture-feedback cursor-pointer`}>
          <div className="text-2xl mb-2">⚔️</div>
          <div className={`text-sm font-medium ${T.text}`}>Nuova Sfida</div>
          <div className={`text-xs ${T.textMuted}`}>Crea partita</div>
        </div>

        {/* Notifications */}
        <div 
          onClick={enableNotifications}
          className={`${T.bgSecondary} rounded-xl p-4 text-center mobile-card gesture-feedback cursor-pointer`}
        >
          <div className="text-2xl mb-2">{stats.notifications ? '🔔' : '🔕'}</div>
          <div className={`text-sm font-medium ${T.text}`}>
            {stats.notifications ? 'Attive' : 'Abilita'}
          </div>
          <div className={`text-xs ${T.textMuted}`}>Notifiche</div>
        </div>

        {/* Rankings */}
        <div className={`${T.bgSecondary} rounded-xl p-4 text-center mobile-card gesture-feedback cursor-pointer`}>
          <div className="text-2xl mb-2">🏆</div>
          <div className={`text-sm font-medium ${T.text}`}>Classifica</div>
          <div className={`text-xs ${T.textMuted}`}>Top 10</div>
        </div>
      </div>

      {/* Status Bar */}
      <div className={`flex items-center justify-between p-3 ${T.bgTertiary} rounded-lg`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${stats.notifications ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`}></div>
          <span className={`text-xs ${T.textSecondary}`}>
            {stats.notifications ? 'Sistema attivo' : 'Configura notifiche'}
          </span>
        </div>
        <span className={`text-xs ${T.textMuted}`}>
          🌐 Online
        </span>
      </div>
    </div>
  );
}
