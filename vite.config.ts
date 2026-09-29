import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// Bei GitHub Pages liegt die App unter https://<user>.github.io/<repo>/ -
// der Ordnername hier muss zum Repository-Namen passen.
const repoName = 'sparapp'

export default defineConfig({
  base: process.env.VITE_BASE ?? `/${repoName}/`,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'SparApp – Finanzübersicht',
        short_name: 'SparApp',
        description: 'Einnahmen, Ausgaben, Fixkosten und Sparziele im Überblick.',
        theme_color: '#0b0b0b',
        background_color: '#f9f9f7',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
})
