// =============================================
// FILE: src/main.jsx
// =============================================
import React from 'react';
import './index.css';
import { createRoot } from 'react-dom/client';
import AppRouter from './router/AppRouter.jsx';

// Development health check
if (import.meta.env.DEV) {
  import('./utils/health-check.js');
}

// Performance monitoring in production
if (import.meta.env.PROD) {
  // Add performance monitoring here if needed
  // Example: Web Vitals reporting
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Elemento #root non trovato in index.html');
}

createRoot(container).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
