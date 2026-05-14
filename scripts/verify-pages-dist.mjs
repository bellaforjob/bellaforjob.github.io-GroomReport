/**
 * 校验 dist/index.html 里引用的绝对路径资源在磁盘上存在。
 * 与 CI 中 VITE_BASE_PATH 一致时传入同一环境变量，避免子路径与仓库名不一致导致线上白屏。
 */
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const indexPath = join(dist, 'index.html')

/** 与 vite.config.js 中 resolvePagesBaseRaw 一致 */
function resolveBaseSlug() {
  const explicit = process.env.VITE_BASE_PATH
  if (explicit !== undefined && String(explicit).trim() !== '') {
    return String(explicit).trim().replace(/^\/+|\/+$/g, '')
  }
  const gh = process.env.GITHUB_REPOSITORY
  if (gh && typeof gh === 'string' && gh.includes('/')) {
    const repo = gh.split('/')[1]
    if (repo) return repo.replace(/^\/+|\/+$/g, '')
  }
  return ''
}

const baseSlug = resolveBaseSlug()

function publicUrlToDistFile(url) {
  if (!url.startsWith('/')) {
    return join(dist, url.replace(/^\.\//, ''))
  }
  let path = url
  if (baseSlug) {
    const prefix = `/${baseSlug}`
    if (path === prefix || path === `${prefix}/`) {
      return join(dist, 'index.html')
    }
    if (path.startsWith(`${prefix}/`)) {
      path = path.slice(prefix.length + 1)
    }
  }
  return join(dist, path.replace(/^\//, ''))
}

if (!existsSync(indexPath)) {
  console.error('[verify-pages-dist] dist/index.html 不存在，请先执行 npm run build')
  process.exit(1)
}

const html = readFileSync(indexPath, 'utf8')

if (html.includes('/src/main.jsx')) {
  console.error(
    '[verify-pages-dist] dist/index.html 仍是开发模板（含 /src/main.jsx），不是 vite build 产物。',
  )
  console.error('  若线上白屏且「查看网页源代码」里也是这行，说明 GitHub Pages 在发布仓库根目录，而不是 dist。')
  console.error('  请到 Settings → Pages → Build and deployment → Source 选「GitHub Actions」，不要用 main / (root)。')
  process.exit(1)
}

const urls = []
for (const m of html.matchAll(/\s(?:src|href)="([^"]+)"/g)) {
  const u = m[1]
  if (!u || u.startsWith('data:') || u.startsWith('mailto:')) continue
  urls.push(u)
}

let failed = false
for (const u of urls) {
  const disk = publicUrlToDistFile(u)
  if (!existsSync(disk)) {
    console.error('[verify-pages-dist] 缺失:', u)
    console.error('  期望文件:', disk)
    if (!baseSlug && u.startsWith('/') && u.split('/').filter(Boolean).length >= 2) {
      console.error(
        '  提示: index 使用了带子路径的 URL。本地校验请设置与线上一致的 VITE_BASE_PATH，例如:',
        'VITE_BASE_PATH=仓库名 npm run build && VITE_BASE_PATH=仓库名 npm run verify:pages-dist',
      )
    }
    failed = true
  }
}

const swPath = join(dist, 'sw.js')
if (!existsSync(swPath)) {
  console.error('[verify-pages-dist] dist/sw.js 不存在（PWA 未生成）。请用完整权限重跑 npm run build，并查看 vite-plugin-pwa 是否在日志里报错。')
  failed = true
}

if (failed) {
  console.error('[verify-pages-dist] 失败 — 部署该 dist 很可能白屏（JS/CSS 404）。')
  process.exit(1)
}

console.info(`[verify-pages-dist] OK（${urls.length} 个引用 + sw.js）`)
