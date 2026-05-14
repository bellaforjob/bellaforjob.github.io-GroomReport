import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'
import { ErrorBoundary } from './ErrorBoundary.jsx'
import { TEMPLATE_LAYOUT_VERSION } from './config/layoutVersion.js'

console.info(
  `[GroomReport] layout v${TEMPLATE_LAYOUT_VERSION} — if this does not match the badge, reload without cache.`,
)

/** `registerType: 'autoUpdate'` 下新版本 SW 激活后会整页刷新；此处额外拉取更新，减轻手机主屏/PWA 长时间未检查的情况 */
registerSW({
  immediate: true,
  onOfflineReady() {
    console.info('[GroomReport] 静态资源已缓存，可离线使用（需至少成功访问过一次本站）')
  },
})

function checkServiceWorkerUpdate() {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.getRegistration().then((reg) => reg?.update()).catch(() => {})
}

window.addEventListener('focus', checkServiceWorkerUpdate)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkServiceWorkerUpdate()
})
window.setTimeout(checkServiceWorkerUpdate, 3000)

const rootEl = document.getElementById('root')
if (!rootEl) {
  document.body.innerHTML =
    '<p style="padding:1rem;font-family:system-ui">Missing #root in index.html.</p>'
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
}
