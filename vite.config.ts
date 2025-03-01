import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/picross-digger/',
  server: {
    allowedHosts: [
      "e070f75d-bde3-456f-83e9-3dabd84f91ca-00-17arfykgvlplf.pike.replit.dev"
    ]
  }
})