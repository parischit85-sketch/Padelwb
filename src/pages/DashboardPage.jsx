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

  const quickActions = [
    {
      title: 'Prenota Campo',
      description: 'Prenota subito un campo disponibile',
      icon: '🏟️',
      action: () => navigate('/booking'),
      color: 'primary'
    },
    {
      title: 'Classifica',
      description: 'Visualizza la classifica attuale',
      icon: '🏆',
      action: () => navigate('/classifica'),
      color: 'success'
    },
    {
      title: 'Statistiche',
      description: 'Analizza le tue performance',
      icon: '📊',
      action: () => navigate('/stats'),
      color: 'info'
    },
    {
      title: 'Profilo',
      description: 'Gestisci il tuo account',
      icon: '👤',
      action: () => navigate('/profile'),
      color: 'warning'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Section title={`Benvenuto, ${user?.displayName?.split(' ')[0] || 'Giocatore'}!`} T={T}>
        <div className="max-w-md">
          {/* User Bookings Card */}
          <UserBookingsCard user={user} state={state} T={T} />
        </div>
      </Section>

      {/* Quick Actions */}
      <Section title="Azioni Rapide" T={T}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.title}
              onClick={action.action}
              className={`${T.cardBg} ${T.border} p-6 rounded-xl hover:shadow-lg transition-all group text-left`}
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                {action.icon}
              </div>
              <h3 className={`font-semibold mb-2 ${T.text}`}>{action.title}</h3>
              <p className={`text-sm ${T.subtext}`}>{action.description}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* Recent Activity */}
      <Section title="Attività Recente" T={T}>
        <div className={`${T.cardBg} ${T.border} p-6 rounded-xl`}>
          <p className={`text-center ${T.subtext}`}>
            Le tue attività recenti appariranno qui
          </p>
        </div>
      </Section>
    </div>
  );
}
