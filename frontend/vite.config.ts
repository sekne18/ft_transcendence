// frontend/vite.config.ts
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  root: '.', // root of the frontend folder
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 3000,
  },
})
