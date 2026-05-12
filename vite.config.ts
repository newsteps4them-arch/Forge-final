import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true,
          type: 'module',
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5000000,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,jpg,jpeg}']
        },
        manifest: {
          id: '/?source=pwa',
          name: 'Team Forge Diagnostics',
          short_name: 'Forge OBD',
          description: 'High-performance automotive diagnostic suite',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          display_override: ["window-controls-overlay", "tabbed", "standalone"],
          lang: "en-US",
          dir: "ltr",
          orientation: 'portrait',
          start_url: './',
          scope: '/',
          categories: ["utilities", "productivity", "automotive"],
          shortcuts: [
            {
              name: "New Scan",
              short_name: "Scan",
              description: "Start a new OBD scan",
              url: "/?action=scan",
              icons: [{ src: "icon-192.png", sizes: "192x192", type: "image/png" }]
            }
          ],
          file_handlers: [
            {
              action: "/open-log",
              accept: {
                "text/csv": [".csv"]
              }
            }
          ],
          protocol_handlers: [
            {
              protocol: "web+obd",
              url: "/?scan=%s"
            }
          ],
          prefer_related_applications: false,
          related_applications: [],
          share_target: {
            action: "/share",
            method: "GET",
            params: {
              title: "title",
              text: "text",
              url: "url"
            }
          },
          iarc_rating_id: "e84b072d-71b3-4d3e-86ae-31a8ce4e53b7",
          widgets: [],
          edge_side_panel: {
            preferred_width: 400
          },
          note_taking: {
            new_note_url: "/?action=note"
          },
          launch_handler: {
            client_mode: "auto"
          },
          scope_extensions: [
            { origin: "*.example.com" }
          ],
          icons: [
            {
              src: 'pwa-192x192.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            },
            {
              src: 'pwa-512x512.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            },
            {
              src: 'icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            }
          ],
          screenshots: [
            {
              src: "screenshot-mobile.jpg",
              sizes: "1080x1920",
              type: "image/jpeg",
              form_factor: "narrow",
              label: "Mobile Diagnostics"
            },
            {
              src: "screenshot-desktop.jpg",
              sizes: "1920x1080",
              type: "image/jpeg",
              form_factor: "wide",
              label: "Engineering Desktop"
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
