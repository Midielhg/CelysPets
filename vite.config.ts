// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/dev/', // 👈 change to your actual subfolder or leave '/' for root
  plugins: [react()],
})