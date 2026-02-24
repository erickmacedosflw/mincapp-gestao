import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
) as { version?: string }
const appVersion = packageJson.version ?? '1.0.0'

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
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
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
