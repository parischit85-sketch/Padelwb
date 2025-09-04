import React from 'react';

const ProfileDropdown = ({ onProfileClick, onBackupClick }) => {
  return (
    <button
      onClick={onProfileClick}
      className="bg-gray-50 border-gray-200 hover:bg-gray-100 border-2 p-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group text-center w-full"
    >
      <div className="bg-gray-100 text-gray-600 w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform mx-auto">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="7" r="4" strokeWidth={2}/>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth={2}/>
        </svg>
      </div>
      <h3 className="font-bold text-base mb-1 text-gray-900 dark:text-white text-center">
        Profilo
      </h3>
      <p className="text-xs text-gray-600 dark:text-gray-300 text-center">
        Gestisci il tuo account
      </p>
    </button>
  );
};

export default ProfileDropdown;
