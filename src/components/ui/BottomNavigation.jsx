// =============================================
// FILE: src/components/ui/BottomNavigation.jsx
// =============================================
import React from 'react';

export default function BottomNavigation({ active, setActive, navigation = [] }) {
  // Mobile navigation items - only main sections
  const mobileNavItems = [
    { 
      id: 'dashboard', 
      label: 'Home', 
      path: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      id: 'prenota-campo', 
      label: 'Prenota', 
      path: '/booking',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      id: 'classifica', 
      label: 'Classifica', 
      path: '/classifica',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      )
    },
    { 
      id: 'stats', 
      label: 'Statistiche', 
      path: '/stats',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  const handleNavClick = (item) => {
    console.log('Bottom nav clicked:', item.id); // Debug log
    setActive(item.id);
  };

  // iOS-specific touch handlers
  const handleTouchStart = (item) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Touch start:', item.id);
  };

  const handleTouchEnd = (item) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Touch end:', item.id);
    handleNavClick(item);
  };

  return (
    <div 
      className="md:hidden bottom-nav-container bg-white border-t border-gray-200"
      style={{
        zIndex: 999999,
        paddingBottom: 'env(safe-area-inset-bottom)',
        height: `calc(64px + env(safe-area-inset-bottom))`,
      }}
    >
      <div className="grid grid-cols-4 h-16">
        {mobileNavItems.map((item) => (
          <div
            key={item.id}
            className={`bottom-nav-item flex flex-col items-center justify-center space-y-1 ${
              active === item.id
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600'
            }`}
            onClick={() => handleNavClick(item)}
            onTouchStart={handleTouchStart(item)}
            onTouchEnd={handleTouchEnd(item)}
            style={{
              WebkitTapHighlightColor: 'rgba(0,0,0,0)',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none',
              minHeight: '48px',
              position: 'relative',
              zIndex: 1000000,
            }}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
