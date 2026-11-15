import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Cache Vite disimpan di folder project ini (bukan di node_modules)
  cacheDir: '.vite-cache',
  server: {
    host: true,
    port: 5174
  }
});

