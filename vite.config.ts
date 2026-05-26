import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.svg', 'icons/*.svg'],
      manifest: {
        name: '智规划 - 工作规划助手',
        short_name: '智规划',
        description: '智能工作规划与提醒助手',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'zh-CN',
        icons: [
          {
            src: 'icons/icon-72x72.svg',
            sizes: '72x72',
            type: 'image/svg+xml',
          },
          {
            src: 'icons/icon-96x96.svg',
            sizes: '96x96',
            type: 'image/svg+xml',
          },
          {
            src: 'icons/icon-128x128.svg',
            sizes: '128x128',
            type: 'image/svg+xml',
          },
          {
            src: 'icons/icon-144x144.svg',
            sizes: '144x144',
            type: 'image/svg+xml',
          },
          {
            src: 'icons/icon-152x152.svg',
            sizes: '152x152',
            type: 'image/svg+xml',
          },
          {
            src: 'icons/icon-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: 'icons/icon-384x384.svg',
            sizes: '384x384',
            type: 'image/svg+xml',
          },
          {
            src: 'icons/icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
