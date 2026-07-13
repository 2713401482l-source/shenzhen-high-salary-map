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
        trends: resolve(import.meta.dirname, 'trends.html'),
        skills: resolve(import.meta.dirname, 'skills.html'),
        benchmark: resolve(import.meta.dirname, 'benchmark.html'),
        growth: resolve(import.meta.dirname, 'growth.html'),
        map: resolve(import.meta.dirname, 'map.html'),
        jobs: resolve(import.meta.dirname, 'jobs.html'),
        method: resolve(import.meta.dirname, 'method.html')
      }
    }
  }
});
