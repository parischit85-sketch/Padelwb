// =============================================
// FILE: src/components/ui/Modal.jsx
// =============================================
import React from 'react';
export default function Modal({ open, onClose, title, children, T }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 rounded-2xl ${T.cardBg} ${T.border} p-6 w-[min(820px,92vw)] shadow-2xl`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className={`px-3 py-1 rounded-lg ring-1 ${T.ghostRing} transition`}>Chiudi</button>
        </div>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}
