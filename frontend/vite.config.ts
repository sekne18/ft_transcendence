import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/uploads/': 'http://localhost:8080',
    },
  }
})