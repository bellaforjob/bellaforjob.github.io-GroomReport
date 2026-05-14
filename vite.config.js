import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const __dirname = dirname(fileURLToPath(import.meta.url))

function readLayoutVersion() {
  const p = join(__dirname, 'src/config/layoutVersion.js')
  const txt = readFileSync(p, 'utf8')
  const m = txt.match(/export const TEMPLATE_LAYOUT_VERSION = (\d+)/)
  return m ? m[1] : '0'
}

const layoutVersion = readLayoutVersion()

/** New value every `vite build` / dev server start — surfaced in UI to verify fresh bundles */
const buildStamp = new Date().toISOString()

// https://vite.dev/config/
export default defineConfig({
  define: {
    __BUILD_STAMP__: JSON.stringify(buildStamp),
  },
  plugins: [
    {
      name: 'groomreport-layout-version-meta',
      transformIndexHtml(html) {
        if (html.includes('groomreport-layout-version')) return html
        return html.replace(
          '<head>',
          `<head>\n    <meta name="groomreport-layout-version" content="${layoutVersion}" />`,
        )
      },
    },
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        lang: 'zh-CN',
        name: 'GroomReport 美容报告',
        short_name: 'GroomReport',
        description: '宠物美容效果报告：填写表单、上传照片、导出 PDF / PNG',
        theme_color: '#0d9488',
        background_color: '#f4efe6',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    headers: { 'Cache-Control': 'no-store' },
  },
  preview: {
    headers: { 'Cache-Control': 'no-store' },
  },
})
