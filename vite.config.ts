import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['branding/logo-inspire.png'],
      manifest: {
        name: 'Gestão Inspire',
        short_name: 'Inspire',
        description: 'Painel administrativo para gestão via API',
        start_url: '/',
        display: 'standalone',
        icons: [
          {
            src: '/branding/logo-inspire.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/branding/logo-inspire.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        runtimeCaching: [],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
