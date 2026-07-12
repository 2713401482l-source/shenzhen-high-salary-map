import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: '0.0.0.0', allowedHosts: ['terminal.local'] },
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        growth: resolve(import.meta.dirname, 'growth.html'),
        jobs: resolve(import.meta.dirname, 'jobs.html')
      }
    }
  }
});
