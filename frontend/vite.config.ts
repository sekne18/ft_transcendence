// vite.config.ts
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  // Since we're already in the frontend folder, no need to include it in paths
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0', // Allow connections from outside the container
    open: false, // Don't try to open browser in Docker
  },
});