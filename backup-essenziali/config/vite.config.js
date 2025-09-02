// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, 'src/app'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@ui': path.resolve(__dirname, 'src/components/ui'),
      '@lib': path.resolve(__dirname, 'src/lib'),
      '@data': path.resolve(__dirname, 'src/data'),
      '@services': path.resolve(__dirname, 'src/services'),
      // (opzionale) se vuoi anche lo stile "@/qualcosa"
      // '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
  },
});
