// =============================================
// FILE: src/pages/DashboardPage.jsx
// =============================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { themeTokens } from '@lib/theme.js';
import { useAuth } from '@contexts/AuthContext.jsx';
import { useLeague } from '@contexts/LeagueContext.jsx';
import { startAutomaticFirebaseBackup } from '@services/firebase-backup.js';
import ProfileDropdown from '@components/ui/ProfileDropdown.jsx';
import Section from '@ui/Section.jsx';
import StatsCard from '@ui/StatsCard.jsx';
import UserBookingsCard from '@ui/UserBookingsCard.jsx';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state } = useLeague();
  const T = React.useMemo(() => themeTokens(), []);

  // Avvia solo backup Firebase automatico (il resto è spostato in Extra protetto)
  React.useEffect(() => {
    if (user && !window._firebaseBackupStarted) {
      window._firebaseBackupStarted = true;
      startAutomaticFirebaseBackup(6); // Backup Firebase ogni 6 ore (sempre attivo per sicurezza)
    }
    
    // Cleanup function to prevent multiple intervals
    return () => {
      // Don't stop backup on component unmount, let it run globally
    };
  }, [user]);

  // Funzioni admin spostate in Extra.jsx per maggiore sicurezza

  // Solo 4 azioni principali come richiesto
  const quickActions = [
    {
      title: 'Prenota Campo',
      description: 'Prenota subito un campo disponibile',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="4" y="6" width="16" height="14" rx="2" strokeWidth={2}/>
          <path d="M8 10h8M8 14h6" strokeWidth={2}/>
          <circle cx="18" cy="6" r="4" strokeWidth={1.5}/>
          <path d="M18 4v2l1 1" strokeWidth={1.5}/>
          <circle cx="6" cy="18" r="2" fill="currentColor"/>
        </svg>
      ),
      action: () => navigate('/booking'),
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      iconBg: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Classifica',
      description: 'Visualizza ranking RPA',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" strokeWidth={2}/>
          <path d="M12 2l-2 6h4l-2-6z" fill="currentColor"/>
          <rect x="16" y="3" width="6" height="2" rx="1" fill="currentColor"/>
          <rect x="2" y="3" width="6" height="2" rx="1" fill="currentColor"/>
        </svg>
      ),
      action: () => navigate('/classifica'),
      color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
      iconBg: 'bg-yellow-100 text-yellow-600'
    },
    {
      title: 'Statistiche',
      description: 'Analisi avanzate e grafici',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" strokeWidth={2}/>
          <path d="M19 19v-6a2 2 0 00-2-2h-2a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" strokeWidth={2}/>
          <path d="M14 11V9a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2z" strokeWidth={2}/>
          <path d="M14 19v-6a2 2 0 00-2-2h-2a2 2 0 00-2 2v6" strokeWidth={1.5}/>
        </svg>
      ),
      action: () => navigate('/stats'),
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      iconBg: 'bg-purple-100 text-purple-600'
    }
  ];

  return (
    <div className="space-y-1">
      {/* Desktop: Layout fianco a fianco */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4 lg:items-start">
        {/* Le tue prenotazioni - Desktop */}
        <div>
          <UserBookingsCard user={user} state={state} T={T} />
        </div>
          
          {/* Azioni Rapide - Desktop (griglia 2x2) */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Azioni Rapide
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  onClick={action.action}
                  className={`${action.color} border-2 p-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group text-center`}
                >
                  <div className={`${action.iconBg} w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform mx-auto`}>
                    {action.icon}
                  </div>
                  <h3 className="font-bold text-base mb-1 text-gray-900 dark:text-white text-center">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 text-center">
                    {action.description}
                  </p>
                </button>
              ))}
              {/* ProfileDropdown nella griglia 2x2 */}
              <ProfileDropdown 
                onProfileClick={() => navigate('/profile')}
                onBackupClick={() => navigate('/extra')}
              />
            </div>
          </div>
        </div>

        {/* Mobile/Tablet: Layout verticale */}
        <div className="lg:hidden space-y-2">
          {/* Le tue prenotazioni - Mobile (solo prossima + menu espanso) */}
          <div>
            <UserBookingsCard user={user} state={state} T={T} compact={true} />
          </div>
          
          {/* Azioni Rapide - Mobile (griglia 2x2) */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Azioni Rapide
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  onClick={action.action}
                  className={`${action.color} border-2 p-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group text-center`}
                >
                  <div className={`${action.iconBg} w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform mx-auto`}>
                    {action.icon}
                  </div>
                  <h3 className="font-bold text-base mb-1 text-gray-900 dark:text-white text-center">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 text-center">
                    {action.description}
                  </p>
                </button>
              ))}
              {/* ProfileDropdown nella griglia 2x2 mobile */}
              <ProfileDropdown 
                onProfileClick={() => navigate('/profile')}
                onBackupClick={() => navigate('/extra')}
              />
            </div>
          </div>
        </div>
    </div>
  );
}
