import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        trends: resolve(import.meta.dirname, 'trends.html'),
        skills: resolve(import.meta.dirname, 'skills.html'),
        map: resolve(import.meta.dirname, 'map.html'),
        jobs: resolve(import.meta.dirname, 'jobs.html'),
        method: resolve(import.meta.dirname, 'method.html')
      }
    }
  }
});
