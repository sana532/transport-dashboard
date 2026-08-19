import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { reportDownloadProxy } from './vite.report-download-proxy'

export default defineConfig({
  plugins: [react(), tailwindcss(), reportDownloadProxy()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://syria-travel.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
