import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { TemplateCanvas } from './components/TemplateCanvas'
import { LayoutAdjustOverlay } from './components/LayoutAdjustOverlay'
import { TemplateRegion } from './components/TemplateRegion'
import { TemplateRegionContent } from './components/TemplateRegionContent'
import { DEFAULT_GROOMING_TEMPLATE } from './config/defaultTemplateImage'
import bundledLayoutDefaults from './config/bundledLayoutOverrides.js'
import {
  SERVICE_OPTIONS,
  TEMPLATE_LAYOUT_VERSION,
  aspectRatioForPhotoSlot,
  buildFieldLayoutStyles,
  flattenLayoutSnapshotForHud,
  getMergedRegionRectsPx,
  HEALTH_BEHAVIOR_STRIP_H_PX,
  HEALTH_COAT_STRIP_H_PX,
  HEALTH_LABEL_W,
  HEALTH_SKIN_STRIP_H_PX,
  REGION_RECT_PX,
  healthStripHeightRatio,
  mergeCheckboxGroupsState,
  defaultCheckboxGroupsState,
  rebuildEditableRegionsWithOverrides,
} from './config/templateRegions'
import {
  clearStoredLayoutOverrides,
  downloadLayoutJson,
  layoutOverlayKeyPresent,
  layoutPatchesFromUnknown,
  layoutPatchesLayerFromMerged,
  applyPhotoSlotMarksRestoreMigration,
  loadStoredLayoutPatchesAfterBundledSync,
  patchHasContent,
  persistLayoutSessionBackup,
  saveLayoutOverrides,
} from './utils/layoutAdjustStorage'
import {
  cloneLayoutOverrideState,
  mergeBundledAndStoredPatches,
  normalizeLayoutOverrideShape,
} from './utils/layoutOverridesMerge'
import {
  containFitFileToDataUrl,
  isHeicLikeFile,
  isImageLikeFile,
  tryConvertHeicToJpegFile,
} from './utils/imageCrop'
import {
  composeReportToCanvas,
  downloadCanvasAsPdf,
  exportNodeToPngFile,
} from './utils/exportReportCanvas'
import { BUILD_STAMP } from './buildStamp'
import './App.css'

const SHIPPED_LAYOUT = normalizeLayoutOverrideShape(bundledLayoutDefaults)

const STORAGE_KEY = 'groomreport-template-v1'

const SERVICE_VALUES = SERVICE_OPTIONS.map((o) => o.value)

const emptyInfo = () => ({
  petName: '',
  date: '',
  breed: '',
  gender: '',
  weight: '',
  client: '',
  age: '',
  /** Single choice among SERVICE_OPTIONS; '' = none */
  service: '',
  serviceOther: '',
  /** '', 'good', 'fair', 'poor' */
  coat: '',
  skin: '',
  /** '', 'calm', 'anxious', 'other' — matches printed Behavior row */
  behavior: '',
  behaviorOther: '',
  healthNotes: '',
  groomerNotes: '',
  nextAppointment: '',
  checkboxGroups: defaultCheckboxGroupsState(),
})

const emptySpots = () => ({
  ears: { before: null, after: null },
  pawPads: { before: null, after: null },
  analArea: { before: null, after: null },
  clientRequest: { before: null, after: null },
  nails: { before: null, after: null },
  tail: { before: null, after: null },
})

function revokeBlobUrlsInSpots(s) {
  if (!s || typeof s !== 'object') return
  for (const row of Object.values(s)) {
    if (!row || typeof row !== 'object') continue
    for (const v of Object.values(row)) {
      if (typeof v === 'string' && v.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(v)
        } catch {
          /* ignore */
        }
      }
    }
  }
}

function safeFilePart(s) {
  const t = (s || 'pet').trim() || 'pet'
  return t.replace(/[<>:"/\\|?*]+/g, '-').replace(/\s+/g, '-').slice(0, 80) || 'pet'
}

function readStoredDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function migrateLegacyInfo(raw) {
  const base = { ...emptyInfo(), ...raw }
  delete base.services
  let servicePick = ''
  if (typeof raw?.service === 'string' && SERVICE_VALUES.includes(raw.service)) {
    servicePick = raw.service
  } else if (raw?.services && typeof raw.services === 'object') {
    servicePick = SERVICE_VALUES.find((k) => Boolean(raw.services[k])) ?? ''
  }
  base.service = servicePick
  base.checkboxGroups = mergeCheckboxGroupsState(raw.checkboxGroups)

  const legacyBehavior = raw?.behavior
  if (
    typeof legacyBehavior === 'string' &&
    legacyBehavior !== '' &&
    !['calm', 'anxious', 'other'].includes(legacyBehavior)
  ) {
    base.behavior = 'other'
    base.behaviorOther =
      typeof raw?.behaviorOther === 'string' && raw.behaviorOther !== ''
        ? raw.behaviorOther
        : legacyBehavior
  } else if (!['', 'calm', 'anxious', 'other'].includes(base.behavior)) {
    base.behavior = ''
  }
  return base
}

function initialLayoutOverrides() {
  const bundled = normalizeLayoutOverrideShape(bundledLayoutDefaults)
  let layer = loadStoredLayoutPatchesAfterBundledSync(bundled.bundledRevision)
  if (!patchHasContent(layer)) {
    try {
      const fromDraft = layoutPatchesFromUnknown(readStoredDraft()?.layoutPatches)
      if (fromDraft) layer = fromDraft
    } catch {
      /* ignore */
    }
  }
  const merged = mergeBundledAndStoredPatches(bundled, layer)
  return applyPhotoSlotMarksRestoreMigration(merged)
}

export default function App() {
  const exportRef = useRef(null)
  const [canvasHost, setCanvasHost] = useState(null)
  const bindCanvasRef = useCallback((el) => {
    exportRef.current = el
    setCanvasHost(el)
  }, [])

  const [layoutAdjustMode, setLayoutAdjustMode] = useState(false)
  const [layoutOverrides, setLayoutOverrides] = useState(initialLayoutOverrides)

  const mergedRegionPx = useMemo(() => getMergedRegionRectsPx(layoutOverrides), [layoutOverrides])
  const healthStripCssVars = useMemo(() => {
    const hp = mergedRegionPx.health
    const hw =
      hp?.w && Number.isFinite(hp.w) && hp.w > 0 ? hp.w : REGION_RECT_PX.health.w
    return {
      '--health-behavior-strip-h-ratio': healthStripHeightRatio(hp, HEALTH_BEHAVIOR_STRIP_H_PX),
      '--health-coat-strip-h-ratio': healthStripHeightRatio(hp, HEALTH_COAT_STRIP_H_PX),
      '--health-skin-strip-h-ratio': healthStripHeightRatio(hp, HEALTH_SKIN_STRIP_H_PX),
      '--health-label-w-frac': HEALTH_LABEL_W / hw,
    }
  }, [mergedRegionPx.health])
  const editableRegions = useMemo(
    () => rebuildEditableRegionsWithOverrides(layoutOverrides),
    [layoutOverrides],
  )
  const fieldInsetStyles = useMemo(
    () => buildFieldLayoutStyles(layoutOverrides.fields, mergedRegionPx),
    [layoutOverrides.fields, mergedRegionPx],
  )
  const layoutHudSnapshots = useMemo(
    () => (layoutAdjustMode ? flattenLayoutSnapshotForHud(layoutOverrides) : []),
    [layoutAdjustMode, layoutOverrides],
  )

  const [info, setInfo] = useState(() => {
    const data = readStoredDraft()
    if (data?.info && typeof data.info === 'object') return migrateLegacyInfo(data.info)
    return emptyInfo()
  })
  const [spots, setSpots] = useState(() => {
    const data = readStoredDraft()
    if (data?.spots && typeof data.spots === 'object') {
      const src = data.spots
      const merged = emptySpots()
      for (const k of Object.keys(merged)) {
        if (src[k]?.before) merged[k].before = src[k].before
        if (src[k]?.after) merged[k].after = src[k].after
      }
      for (const which of ['before', 'after']) {
        if (!merged.clientRequest[which] && src.face?.[which]) {
          merged.clientRequest[which] = src.face[which]
        }
        if (!merged.tail[which] && src.body?.[which]) {
          merged.tail[which] = src.body[which]
        }
      }
      return merged
    }
    return emptySpots()
  })
  const [status, setStatus] = useState(() => (readStoredDraft() ? 'Loaded saved draft.' : ''))
  const [exporting, setExporting] = useState(false)
  const [bgSrc, setBgSrc] = useState(DEFAULT_GROOMING_TEMPLATE)

  const layoutImportRef = useRef(null)
  const layoutOverridesRef = useRef(layoutOverrides)

  useLayoutEffect(() => {
    layoutOverridesRef.current = layoutOverrides
    persistLayoutSessionBackup(layoutOverrides)
  }, [layoutOverrides])

  useEffect(() => {
    const flush = () => persistLayoutSessionBackup(layoutOverridesRef.current)
    const onHidden = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onHidden)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onHidden)
    }
  }, [])

  /** If localStorage lost the overlay but we still have patches (e.g. from session backup), write them back. */
  useEffect(() => {
    try {
      if (layoutOverlayKeyPresent()) return
      const { regions = {}, marks = {}, fields = {}, strips = {} } = layoutOverrides
      if (
        Object.keys(regions).length +
          Object.keys(marks).length +
          Object.keys(fields).length +
          Object.keys(strips).length ===
        0
      ) {
        return
      }
      saveLayoutOverrides(layoutOverrides)
    } catch {
      /* ignore */
    }
  }, [layoutOverrides])

  const applyImportedLayoutPatch = useCallback((raw) => {
    const bundled = normalizeLayoutOverrideShape(bundledLayoutDefaults)
    const next = mergeBundledAndStoredPatches(bundled, normalizeLayoutOverrideShape(raw))
    setLayoutOverrides(next)
    saveLayoutOverrides(next)
    setStatus('已从 JSON 恢复布局并写入本机。')
  }, [])

  const onPickLayoutImport = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        applyImportedLayoutPatch(JSON.parse(String(reader.result)))
      } catch {
        setStatus('无法解析该文件，请使用「导出布局 JSON」生成的 JSON。')
      }
      const input = layoutImportRef.current
      if (input) input.value = ''
    }
    reader.readAsText(file, 'UTF-8')
  }, [applyImportedLayoutPatch, setStatus])

  const onImportLayoutFromClipboard = useCallback(async () => {
    try {
      if (!navigator.clipboard?.readText) {
        setStatus('当前环境不支持剪贴板读取，请用「导入布局 JSON」从文件选择。')
        return
      }
      const text = (await navigator.clipboard.readText()).trim()
      applyImportedLayoutPatch(JSON.parse(text))
    } catch (err) {
      if (err instanceof SyntaxError) {
        setStatus('剪贴板内容不是合法 JSON。请完整复制「导出布局 JSON」生成的全文。')
      } else {
        setStatus(
          '无法读取剪贴板（常见于非 HTTPS 或未授权）。可改用「导入布局 JSON」从文件导入，或将 JSON 存为文件后用系统「文件」选取。',
        )
      }
    }
  }, [applyImportedLayoutPatch, setStatus])

  /** Binds template overlay inputs to `info` — controlled updates on every keystroke. */
  const updateField = useCallback(
    (key) => (value) => setInfo((prev) => ({ ...prev, [key]: value })),
    [],
  )

  const selectService = useCallback((value) => {
    setInfo((prev) => ({ ...prev, service: value }))
  }, [])

  const toggleCheckboxGroup = useCallback((groupId, key) => {
    setInfo((prev) => {
      const base = mergeCheckboxGroupsState(prev.checkboxGroups)
      return {
        ...prev,
        checkboxGroups: {
          ...base,
          [groupId]: {
            ...base[groupId],
            [key]: !base[groupId]?.[key],
          },
        },
      }
    })
  }, [])

  /** Assigns an uploaded image to one placeholder (`spots[category][which]`). */
  const setSpot = async (category, which, file) => {
    if (!isImageLikeFile(file)) {
      setStatus('请选择相册里的照片（支持 JPG/PNG/HEIC 等）。')
      return
    }
    const blobUrl = URL.createObjectURL(file)
    setSpots((prev) => {
      const row = prev[category]
      if (!row) return prev
      const prevUrl = row[which]
      if (typeof prevUrl === 'string' && prevUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(prevUrl)
        } catch {
          /* ignore */
        }
      }
      return {
        ...prev,
        [category]: { ...row, [which]: blobUrl },
      }
    })
    setStatus('')
    const aspectOpt = {
      aspectWidthOverHeight: aspectRatioForPhotoSlot(category, which, layoutOverrides),
    }
    const commitDataUrl = (dataUrl) => {
      setSpots((prev) => {
        const row = prev[category]
        if (!row) return prev
        try {
          URL.revokeObjectURL(blobUrl)
        } catch {
          /* ignore */
        }
        if (row[which] !== blobUrl) return prev
        return {
          ...prev,
          [category]: { ...row, [which]: dataUrl },
        }
      })
    }
    try {
      const dataUrl = await containFitFileToDataUrl(file, aspectOpt)
      commitDataUrl(dataUrl)
    } catch {
      if (isHeicLikeFile(file)) {
        const jpegFile = await tryConvertHeicToJpegFile(file)
        if (jpegFile) {
          try {
            const dataUrl = await containFitFileToDataUrl(jpegFile, aspectOpt)
            commitDataUrl(dataUrl)
            setStatus('')
            return
          } catch {
            /* fall through */
          }
        }
      }
      setStatus('已显示原图预览；电脑浏览器若仍空白，请将照片另存为 JPG 再上传。')
    }
  }

  const persistDraft = useCallback(() => {
    try {
      const payload = {
        info,
        spots,
        layoutPatches: layoutPatchesLayerFromMerged(layoutOverrides),
        savedAt: new Date().toISOString(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      return true
    } catch {
      return false
    }
  }, [info, spots, layoutOverrides])

  const saveDraft = useCallback(() => {
    if (persistDraft()) {
      setStatus('Draft saved on this device.')
    } else {
      setStatus(
        'Could not save (photos may be too large). Download the report instead.',
      )
    }
  }, [persistDraft, setStatus])

  /** 表单与布局补丁自动写入 groomreport-template-v1（不写状态文案，以免拖动布局时刷屏） */
  useEffect(() => {
    const t = setTimeout(() => persistDraft(), 800)
    return () => clearTimeout(t)
  }, [info, spots, layoutOverrides, persistDraft])

  const clearAll = () => {
    setInfo(emptyInfo())
    setSpots((prev) => {
      revokeBlobUrlsInSpots(prev)
      return emptySpots()
    })
    localStorage.removeItem(STORAGE_KEY)
    setStatus('Cleared.')
  }

  const exportBaseName = () => {
    const part = safeFilePart(info.petName)
    const d = info.date ? safeFilePart(info.date) : new Date().toISOString().slice(0, 10)
    return `Grooming-report-${part}-${d}`
  }

  /** Rasterizes the full composed template to one canvas, then PNG or PDF. */
  const exportReport = async (format) => {
    const node = exportRef.current
    if (!node) return
    setExporting(true)
    setStatus('')
    try {
      const base = exportBaseName()
      if (format === 'png') {
        await exportNodeToPngFile(node, `${base}.png`)
        if (persistDraft()) {
          setStatus('PNG downloaded. Local copy auto-saved.')
        } else {
          setStatus('PNG downloaded. (Could not auto-save local copy — try Save draft.)')
        }
      } else {
        const canvas = await composeReportToCanvas(node)
        await downloadCanvasAsPdf(canvas, `${base}.pdf`)
        if (persistDraft()) {
          setStatus('PDF downloaded. Local copy auto-saved.')
        } else {
          setStatus('PDF downloaded. (Could not auto-save local copy — try Save draft.)')
        }
      }
    } catch {
      setStatus('Export failed. Try smaller photos or another browser.')
    } finally {
      setExporting(false)
    }
  }

  const onBgError = () => {
    const fallback = `${import.meta.env.BASE_URL}grooming-template.png`
    setBgSrc((prev) => (prev !== fallback ? fallback : prev))
  }

  return (
    <div className="app">
      <div className="app__toolbar">
        <div className="app__brand-wrap">
          <h1 className="app__brand">
            GroomReport
            <span
              className="app__layout-badge"
              title="来自 layoutVersion.js（几何）。若与线上不符：多为 CDN/浏览器缓存旧 index.html；部署含 public/_headers 或 vercel.json 的构建，并硬刷新或清站点数据。"
            >
              v{TEMPLATE_LAYOUT_VERSION}
            </span>
          </h1>
          <p className="app__bundle-meta" role="status">
            <span title="Photo slots / regions — bump in layoutVersion.js + templateRegions">
              layout v{TEMPLATE_LAYOUT_VERSION}
            </span>
            <span aria-hidden> · </span>
            <span title="Shipped default patches in bundledLayoutOverrides.js; bumps clear stale localStorage overlay on deploy">
              bundled rev {SHIPPED_LAYOUT.bundledRevision}
            </span>
            <span aria-hidden> · </span>
            <span title="If this never updates after git pull, hard-refresh or redeploy dist">
              bundle {BUILD_STAMP.replace('T', ' ').slice(0, 19)}
            </span>
          </p>
        </div>
        <div className="app__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => exportReport('png')}
            disabled={exporting}
          >
            {exporting ? 'Preparing…' : 'Download PNG'}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => exportReport('pdf')}
            disabled={exporting}
          >
            {exporting ? 'Preparing…' : 'Download PDF'}
          </button>
          <button type="button" className="btn" onClick={saveDraft}>
            Save draft
          </button>
          <button type="button" className="btn btn--ghost" onClick={clearAll}>
            Clear
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() =>
              setLayoutAdjustMode((v) => {
                const next = !v
                if (next) setStatus('')
                else setStatus('布局调整模式已关闭。')
                return next
              })
            }
          >
            {layoutAdjustMode ? '完成布局' : '调整布局'}
          </button>
          {layoutAdjustMode ? (
            <>
              <input
                ref={layoutImportRef}
                type="file"
                accept="application/json,.json"
                className="visually-hidden"
                tabIndex={-1}
                onChange={onPickLayoutImport}
              />
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => layoutImportRef.current?.click()}
              >
                导入布局 JSON
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => void onImportLayoutFromClipboard()}>
                从剪贴板导入
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  saveLayoutOverrides(layoutOverrides)
                  setStatus(
                    '布局已保存到此浏览器（localStorage + 本会话备份）。PNG/PDF 导出会使用当前布局。',
                  )
                }}
              >
                保存布局
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  clearStoredLayoutOverrides()
                  setLayoutOverrides(cloneLayoutOverrideState(bundledLayoutDefaults))
                  setStatus('已清除本机微调，布局已恢复为仓库自带默认。')
                }}
              >
                重置布局
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => downloadLayoutJson(layoutOverrides)}>
                导出布局 JSON
              </button>
            </>
          ) : null}
        </div>
      </div>

      {layoutAdjustMode ? (
        <p className="layout-adjust-hint" role="note">
          拖拽移动、右下角缩放。Pet Health 的 Coat / Skin / Behavior 请优先调琥珀色「Health 行框」（与 Services 调整块区域同理）。
          蓝色虚线为 Grooming results 各照片槽；导出 JSON 会包含 marks.photo:*，手机导入后即可对齐。
          布局会在每次调整后立刻写入会话备份，并随草稿（约 800ms）写入 groomreport-template-v1。
          若专用布局存储丢失，会从草稿里的 layoutPatches 恢复。仍可「导入布局 JSON」或 npm run bake-layout 固化为仓库默认。
          线上站点部署新版后：内置布局来自仓库 bundledLayoutOverrides.js（与 layout v 角标对应）；若你曾在本站「保存布局」，本机仍会叠在你的微调之上，可用「重置布局」恢复为当前版本内置默认。
          手机与电脑布局不会自动同步：在电脑点「导出布局 JSON」，把文件或全文发到手机，在手机打开同一站点后进入「调整布局」，用「导入布局 JSON」或「从剪贴板导入」即可与网页一致（须 HTTPS 或 localhost 才能读剪贴板）。
        </p>
      ) : null}

      <TemplateCanvas
        exportRef={bindCanvasRef}
        backgroundSrc={bgSrc}
        backgroundAlt="Grooming effect report form — edit fields and photos on top of this template"
        onBackgroundError={onBgError}
        layoutAdjustActive={layoutAdjustMode}
        layoutAdjustSlot={
          layoutAdjustMode && canvasHost ? (
            <LayoutAdjustOverlay
              canvasEl={canvasHost}
              snapshots={layoutHudSnapshots}
              setOverrides={setLayoutOverrides}
            />
          ) : null
        }
      >
        {editableRegions.map((region) => (
          <TemplateRegion
            key={region.id}
            box={region.boxPercent}
            applyTextNudge={region.type !== 'photoSlots'}
            className={`template-region--${region.id}${
              region.overlayPassThrough ? ' template-region--photo-overlay' : ''
            }`}
            style={region.id === 'health' ? healthStripCssVars : undefined}
          >
            <TemplateRegionContent
              region={region}
              info={info}
              spots={spots}
              updateField={updateField}
              setInfo={setInfo}
              selectService={selectService}
              toggleCheckboxGroup={toggleCheckboxGroup}
              setSpot={setSpot}
              fieldInsetStyles={fieldInsetStyles}
            />
          </TemplateRegion>
        ))}
      </TemplateCanvas>

      {status ? (
        <p className="status" role="status">
          {status}
        </p>
      ) : null}
    </div>
  )
}
