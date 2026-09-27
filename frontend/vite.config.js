import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['vite.svg', 'launchericon-192x192.png', 'launchericon-512x512.png'],
        // The manifest is hand-maintained in public/manifest.webmanifest (it carries
        // shortcuts and categories). Generating a second one here would publish two
        // different files at the same /manifest.webmanifest path.
        manifest: false,
        devOptions: {
          enabled: true
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\..*\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          // VITE_PROXY_TARGET lets `vite preview` mimic the Docker setup (empty VITE_API_BASE_URL + proxy)
          target: env.VITE_PROXY_TARGET || env.VITE_API_BASE_URL || 'http://localhost:6901',
          changeOrigin: true,
          secure: mode === 'production',
        }
      }
    }
  }
})
