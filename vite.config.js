import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pcgi-logo.jpg'],
      manifest: {
        name: 'Mon Espace PCGI 87',
        short_name: 'Mon Espace',
        description: 'Portail bénéficiaire PCGI 87 : rendez-vous, messages et documents.',
        lang: 'fr',
        theme_color: '#0e4bb7',
        background_color: '#eef3f8',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Seule l'interface est mise en cache : aucune donnée personnelle.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
});
