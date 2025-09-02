// =============================================
// FILE: src/components/ui/Section.jsx
// =============================================
import React from 'react';
export default function Section({ title, right, children, T }) {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className={`text-xl font-semibold ${T.neonText}`}>{title}</h2>
        {right}
      </div>
      <div className={`rounded-2xl ${T.cardBg} ${T.border} backdrop-blur p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.02)]`}>{children}</div>
    </section>
  );
}