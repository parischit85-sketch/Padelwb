// =============================================
// FILE: src/components/ui/Modal.jsx
// =============================================
import React from 'react';
export default function Modal({ open, onClose, title, children, T }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      <div
    className="absolute inset-0 bg-black/60"
        role="button"
        tabIndex={0}
        aria-label="Chiudi modale"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClose();
          }
        }}
      />
      <div
    className={`relative z-10 rounded-2xl bg-white ring-1 ring-black/10 p-6 w-[min(820px,92vw)] shadow-2xl`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
      className={`px-3 py-1 rounded-lg ring-1 ring-black/10 hover:bg-black/5 transition`}
          >
            Chiudi
          </button>
        </div>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}
