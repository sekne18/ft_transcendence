import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': 'http://10.11.1.7:8080',
      '/uploads/': 'http://10.11.1.7:8080',
    },
  }
})