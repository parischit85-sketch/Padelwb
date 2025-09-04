// =============================================
// FILE: src/pages/DashboardPage.jsx
// =============================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { themeTokens } from '@lib/theme.js';
import { useAuth } from '@contexts/AuthContext.jsx';
import { useLeague } from '@contexts/LeagueContext.jsx';
import Section from '@ui/Section.jsx';
import StatsCard from '@ui/StatsCard.jsx';
import UserBookingsCard from '@ui/UserBookingsCard.jsx';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state } = useLeague();
  const T = React.useMemo(() => themeTokens(), []);

  // Solo 4 azioni principali come richiesto
  const quickActions = [
    {
      title: 'Prenota Campo',
      description: 'Prenota subito un campo disponibile',
      icon: '🏟️',
      action: () => navigate('/booking'),
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      iconBg: 'bg-blue-100'
    },
    {
      title: 'Classifica',
      description: 'Visualizza ranking RPA',
      icon: '🏆',
      action: () => navigate('/classifica'),
      color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
      iconBg: 'bg-yellow-100'
    },
    {
      title: 'Statistiche',
      description: 'Analizza le tue performance',
      icon: '📊',
      action: () => navigate('/stats'),
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      iconBg: 'bg-purple-100'
    },
    {
      title: 'Profilo',
      description: 'Gestisci il tuo account',
      icon: '👤',
      action: () => navigate('/profile'),
      color: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
      iconBg: 'bg-gray-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section con layout responsivo */}
      <Section title={`Ciao, ${user?.displayName?.split(' ')[0] || 'Giocatore'}! 👋`} T={T}>
        {/* Desktop: Layout fianco a fianco */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
          {/* Le tue prenotazioni - Desktop */}
          <div>
            <UserBookingsCard user={user} state={state} T={T} />
          </div>
          
          {/* Azioni Rapide - Desktop (griglia 2x2) */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              🚀 Azioni Rapide
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  onClick={action.action}
                  className={`${action.color} border-2 p-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group text-left`}
                >
                  <div className={`${action.iconBg} w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <span className="text-xl">{action.icon}</span>
                  </div>
                  <h3 className="font-bold text-base mb-1 text-gray-900 dark:text-white">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {action.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile/Tablet: Layout verticale */}
        <div className="lg:hidden space-y-6">
          {/* Le tue prenotazioni - Mobile (solo prossima + menu espanso) */}
          <div>
            <UserBookingsCard user={user} state={state} T={T} compact={true} />
          </div>
          
          {/* Azioni Rapide - Mobile (griglia 2x2) */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              🚀 Azioni Rapide
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  onClick={action.action}
                  className={`${action.color} border-2 p-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group text-left`}
                >
                  <div className={`${action.iconBg} w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <span className="text-xl">{action.icon}</span>
                  </div>
                  <h3 className="font-bold text-sm mb-1 text-gray-900 dark:text-white">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {action.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
