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
    hmr: {
      // For Docker compatibility
      clientPort: 443,  // The port your browser connects to
      host: 'localhost', // The host your browser connects to
      protocol: 'wss'    // For secure WebSockets
    },
    watch: {
      usePolling: true,  // Needed for some Docker setups
      interval: 1000     // Polling interval in ms
    }
  },

})
