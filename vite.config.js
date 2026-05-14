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

/**
 * GitHub Pages 项目站：`https://<user>.github.io/<repo>/`。
 * - 优先 `VITE_BASE_PATH`（与 CI 中 `github.event.repository.name` 一致）。
 * - 未设置时若在 GitHub Actions 内构建，用 `GITHUB_REPOSITORY` 的仓库名段（防 workflow 漏写 env）。
 * - 本地不设变量 → `/`。
 */
function resolvePagesBaseRaw() {
  const explicit = process.env.VITE_BASE_PATH
  if (explicit !== undefined && String(explicit).trim() !== '') {
    return String(explicit).trim()
  }
  const gh = process.env.GITHUB_REPOSITORY
  if (gh && typeof gh === 'string' && gh.includes('/')) {
    const repo = gh.split('/')[1]
    if (repo) return repo
  }
  return '/'
}

const pagesBaseRaw = resolvePagesBaseRaw()
const pagesBase =
  pagesBaseRaw === '/' ? '/' : `/${pagesBaseRaw.replace(/^\/+|\/+$/g, '')}/`

// https://vite.dev/config/
export default defineConfig({
  base: pagesBase,
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
        /**
         * 无客户端路由；若启用 navigateFallback，旧 SW 可能长期返回缓存的 index.html，
         * 其中 script 指向已下线的主 chunk → 全站白屏。导航交给网络，静态资源仍走 precache。
         */
        navigateFallback: null,
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
