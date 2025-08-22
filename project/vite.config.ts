import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',   // SW tự cập nhật khi có build mới
      includeAssets: ['/favicon.ico'],
      manifest: {
        name: 'Mobifone Data Management',
        short_name: 'Mobifone',
        description: 'Hệ thống quản lý thuê bao & doanh thu',
        start_url: '/',              // mở app từ gốc
        scope: '/',                  // phạm vi SW
        display: 'standalone',       // không thanh URL
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#2563eb',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          // icon maskable để Android bo tròn đẹp
          { src: '/pwa-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ],
        // (tuỳ chọn) ảnh screenshot để hiện trong hộp Install
        screenshots: [
          { src: '/screenshot-wide.png',  sizes: '1280x720', type: 'image/png', form_factor: 'wide'   },
          { src: '/screenshot-narrow.png', sizes: '720x1280', type: 'image/png', form_factor: 'narrow' }
        ]
      },
      // cache cơ bản để có thể mở lại offline trang shell
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}']
      }
    })
  ]
});
