// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/', // Changed back to root to fix proxy
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        // Keep Origin as http://localhost:5173 so server CORS allows it
        changeOrigin: false,
        secure: false,
      }
    }
  }
})