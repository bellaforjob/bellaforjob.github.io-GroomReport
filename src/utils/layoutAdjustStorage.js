const KEY = 'groomreport-layout-ui-v3'
/** Same-tab backup if localStorage overlay is missing or cleared accidentally. */
export const LAYOUT_SESSION_BACKUP_KEY = 'groomreport-layout-ui-v3-backup'
const BUNDLED_REV_KEY = 'groomreport-layout-bundled-rev'

function emptyStoredLayout() {
  return { version: 1, regions: {}, marks: {}, fields: {}, strips: {} }
}

export function patchHasContent(p) {
  if (!p || typeof p !== 'object') return false
  const nr = p.regions && typeof p.regions === 'object' ? Object.keys(p.regions).length : 0
  const nm = p.marks && typeof p.marks === 'object' ? Object.keys(p.marks).length : 0
  const nf = p.fields && typeof p.fields === 'object' ? Object.keys(p.fields).length : 0
  const ns = p.strips && typeof p.strips === 'object' ? Object.keys(p.strips).length : 0
  return nr + nm + nf + ns > 0
}

/**
 * Normalize a parsed object (merged layout overlay, draft.layoutPatches, or export file).
 */
export function layoutPatchesFromUnknown(parsed) {
  if (!parsed || typeof parsed !== 'object') return null
  const regions =
    typeof parsed.regions === 'object' && parsed.regions && !Array.isArray(parsed.regions)
      ? parsed.regions
      : {}
  const marks =
    typeof parsed.marks === 'object' && parsed.marks && !Array.isArray(parsed.marks) ? parsed.marks : {}
  const fields =
    typeof parsed.fields === 'object' && parsed.fields && !Array.isArray(parsed.fields)
      ? parsed.fields
      : {}
  const strips =
    typeof parsed.strips === 'object' && parsed.strips && !Array.isArray(parsed.strips)
      ? parsed.strips
      : {}
  const out = { version: 1, regions, marks, fields, strips }
  return patchHasContent(out) ? out : null
}

/** Normalize a JSON blob (export file, localStorage, session backup). */
export function parseStoredLayoutPatch(raw) {
  if (!raw || typeof raw !== 'string') return null
  try {
    return layoutPatchesFromUnknown(JSON.parse(raw))
  } catch {
    return null
  }
}

/** Narrow merged overlay state to `{ regions, marks, fields, strips }` for draft payloads. */
export function layoutPatchesLayerFromMerged(merged) {
  if (!merged || typeof merged !== 'object')
    return { regions: {}, marks: {}, fields: {}, strips: {} }
  return {
    regions:
      merged.regions && typeof merged.regions === 'object' && !Array.isArray(merged.regions)
        ? merged.regions
        : {},
    marks:
      merged.marks && typeof merged.marks === 'object' && !Array.isArray(merged.marks)
        ? merged.marks
        : {},
    fields:
      merged.fields && typeof merged.fields === 'object' && !Array.isArray(merged.fields)
        ? merged.fields
        : {},
    strips:
      merged.strips && typeof merged.strips === 'object' && !Array.isArray(merged.strips)
        ? merged.strips
        : {},
  }
}

/** Write current merged layout to sessionStorage (cheap; survives refresh in this tab). */
export function persistLayoutSessionBackup(overrides) {
  if (!overrides || typeof overrides !== 'object') return
  try {
    sessionStorage.setItem(LAYOUT_SESSION_BACKUP_KEY, JSON.stringify(overrides))
  } catch {
    /* ignore */
  }
}

/** True if groomreport-layout-ui-v3 is present in localStorage. */
export function layoutOverlayKeyPresent() {
  try {
    return Boolean(localStorage.getItem(KEY))
  } catch {
    return false
  }
}

function clearSessionLayoutBackup() {
  try {
    sessionStorage.removeItem(LAYOUT_SESSION_BACKUP_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * When shipped `bundledRevision` bumps *after we've already recorded a prior rev*,
 * drop saved overlay so old local tweaks cannot override new repo defaults.
 *
 * If `groomreport-layout-bundled-rev` was never set (first run with this logic),
 * we do **not** clear `groomreport-layout-ui-v3` — otherwise users lose existing
 * layout work saved before bundled revisions existed.
 */
export function syncLayoutStorageWithBundledRevision(bundledRevision) {
  try {
    const br = String(bundledRevision ?? 0)
    const prev = localStorage.getItem(BUNDLED_REV_KEY)
    if (prev === br) return
    if (prev != null && prev !== br) {
      localStorage.removeItem(KEY)
      clearSessionLayoutBackup()
    }
    localStorage.setItem(BUNDLED_REV_KEY, br)
  } catch {
    /* ignore quota / privacy mode */
  }
}

/** Loads local overlay after applying bundled-revision migration. */
export function loadStoredLayoutPatchesAfterBundledSync(bundledRevision) {
  syncLayoutStorageWithBundledRevision(bundledRevision)
  return loadLayoutOverrides()
}

/** @returns {{ version: number, regions: object, marks: object, fields: object }} */
export function loadLayoutOverrides() {
  const fromDisk = parseStoredLayoutPatch(localStorage.getItem(KEY))
  if (fromDisk) return fromDisk
  try {
    const backupRaw = sessionStorage.getItem(LAYOUT_SESSION_BACKUP_KEY)
    const fromSession = parseStoredLayoutPatch(backupRaw)
    if (fromSession) return fromSession
  } catch {
    /* ignore */
  }
  return emptyStoredLayout()
}

export function saveLayoutOverrides(overrides) {
  localStorage.setItem(KEY, JSON.stringify(overrides, null, 0))
  persistLayoutSessionBackup(overrides)
}

/**
 * One-time migration (2026): 清除以往保存的 marks[`photo:*`]，让 Grooming results 回到 templateRegions 内置像素。
 * 成功后写入标记，避免重复执行。
 */
export const PHOTO_SLOT_MARKS_RESTORE_FLAG = 'groomreport-photo-slot-marks-restored-v1'

export function applyPhotoSlotMarksRestoreMigration(merged) {
  if (!merged || typeof merged !== 'object') return merged
  try {
    if (localStorage.getItem(PHOTO_SLOT_MARKS_RESTORE_FLAG) === '1') return merged
  } catch {
    return merged
  }
  const marks = merged.marks
  if (!marks || typeof marks !== 'object') {
    try {
      localStorage.setItem(PHOTO_SLOT_MARKS_RESTORE_FLAG, '1')
    } catch {
      /* ignore */
    }
    return merged
  }
  const photoKeys = Object.keys(marks).filter((k) => k.startsWith('photo:'))
  if (photoKeys.length === 0) {
    try {
      localStorage.setItem(PHOTO_SLOT_MARKS_RESTORE_FLAG, '1')
    } catch {
      /* ignore */
    }
    return merged
  }
  const nextMarks = { ...marks }
  for (const k of photoKeys) delete nextMarks[k]
  const next = { ...merged, marks: nextMarks }
  try {
    saveLayoutOverrides(next)
    localStorage.setItem(PHOTO_SLOT_MARKS_RESTORE_FLAG, '1')
  } catch {
    /* 写入失败时下次启动仍会尝试清除 photo:* */
  }
  return next
}

export function clearStoredLayoutOverrides() {
  localStorage.removeItem(KEY)
  clearSessionLayoutBackup()
}

export function downloadLayoutJson(overrides) {
  const blob = new Blob([JSON.stringify(overrides, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'groomreport-layout-overrides.json'
  a.click()
  URL.revokeObjectURL(url)
}
