/**
 * Slot frames match each photo rect in `templateRegions.js`. Callers pass
 * `aspectWidthOverHeight` from `aspectRatioForPhotoSlot(...)`.
 * Use `containFitFileToDataUrl` for full image inside frame with letterboxing.
 */

import { PHOTO_SLOT_ASPECT } from '../config/templateRegions'

/** Width ÷ height for each before/after frame (synced with template photo rects) */
export const SLOT_FRAME_ASPECT = PHOTO_SLOT_ASPECT

/**
 * 手机相册常见：HEIC 无 MIME、type 为空或 application/octet-stream。
 * 不能仅用 `file.type.startsWith('image/')` 判断是否允许上传。
 */
export function isImageLikeFile(file) {
  if (!file) return false
  const t = (file.type || '').toLowerCase()
  if (t.startsWith('image/')) return true
  if (t === 'application/octet-stream' && /\.(heic|heif|jpe?g|png|gif|webp)$/i.test(file.name)) return true
  return /\.(heic|heif|jpe?g|png|gif|webp|bmp)$/i.test(file.name)
}

/** 桌面 Chrome/Edge 常无法把 HEIC blob 画进 canvas；需软转 JPEG 再编码 */
export function isHeicLikeFile(file) {
  if (!file) return false
  const t = (file.type || '').toLowerCase()
  if (t === 'image/heic' || t === 'image/heif') return true
  return /\.(heic|heif)$/i.test(file.name || '')
}

/**
 * 将 HEIC 转为 JPEG File（动态加载 heic2any，不阻塞首屏）。
 * @returns {Promise<File | null>}
 */
export async function tryConvertHeicToJpegFile(file) {
  if (!isHeicLikeFile(file)) return null
  try {
    const { default: heic2any } = await import('heic2any')
    const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
    const blob = Array.isArray(result) ? result[0] : result
    if (!(blob instanceof Blob)) return null
    const name = (file.name || 'photo').replace(/\.(heic|heif)$/i, '.jpg')
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    return null
  }
}

const DEFAULT_OUTPUT_WIDTH = 480
/** Matches `.template-canvas` / template cream — letterbox bars */
const DEFAULT_PAD = '#fcf8f3'

/**
 * 解码阶段长边上限（像素）。大图先缩到此范围再画到 slot（默认约 480px 宽），避免 iOS 内存/画布失败。
 * 2048 对最终预览已足够，且比 4096 在旧设备上更稳。
 */
const MAX_DECODE_EDGE = 2048

function loadImageFromObjectUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not decode image'))
    img.src = url
  })
}

/**
 * Release drawable from {@link decodeForCanvas} after pixels have been drawn to another canvas.
 * 注意：Image 路径返回的 img.src 为 blob: URL，须在 drawImage 之后再 revoke，否则画布会得到空白（iOS 相册常见）。
 */
function disposeDecodedDrawable(drawable) {
  if (!drawable) return
  if (typeof drawable.close === 'function') {
    drawable.close()
    return
  }
  if (typeof HTMLImageElement !== 'undefined' && drawable instanceof HTMLImageElement) {
    const s = drawable.src
    if (s && s.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(s)
      } catch {
        /* ignore */
      }
    }
  }
}

/**
 * @param {ImageBitmap} bmp
 * @param {number} maxEdge
 * @returns {Promise<ImageBitmap>}
 */
async function downscaleImageBitmapToMaxEdge(bmp, maxEdge) {
  const w = bmp.width
  const h = bmp.height
  if (!w || !h || Math.max(w, h) <= maxEdge) return bmp
  const scale = maxEdge / Math.max(w, h)
  const tw = Math.max(1, Math.floor(w * scale))
  const th = Math.max(1, Math.floor(h * scale))
  const canvas = document.createElement('canvas')
  canvas.width = tw
  canvas.height = th
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    if (typeof bmp.close === 'function') bmp.close()
    throw new Error('Canvas not supported')
  }
  ctx.drawImage(bmp, 0, 0, w, h, 0, 0, tw, th)
  let next
  try {
    next = await createImageBitmap(canvas)
  } catch (e) {
    if (typeof bmp.close === 'function') bmp.close()
    throw e
  }
  if (typeof bmp.close === 'function') bmp.close()
  return next
}

/**
 * Decode file to something drawable (ImageBitmap 优先，否则 blob: + Image)。
 * 返回 HTMLImageElement 时 **不要** 在解码函数内 revoke blob — 由调用方在 draw 后调用 disposeDecodedDrawable。
 * @returns {Promise<ImageBitmap | HTMLImageElement | HTMLCanvasElement>}
 */
async function decodeForCanvas(file) {
  /** 不设 premultiplyAlpha:'none'：部分 WebKit/HEIC 组合下 drawImage 会得到空白画布 */
  const orient = { imageOrientation: 'from-image', resizeQuality: 'high' }
  const max = MAX_DECODE_EDGE

  if (typeof createImageBitmap === 'function') {
    const tryBitmap = async (factory) => {
      try {
        const bmp = await factory()
        if (!bmp || bmp.width <= 0 || bmp.height <= 0) {
          if (bmp && typeof bmp.close === 'function') bmp.close()
          return null
        }
        if (Math.max(bmp.width, bmp.height) > max) {
          return await downscaleImageBitmapToMaxEdge(bmp, max)
        }
        return bmp
      } catch {
        return null
      }
    }

    /** 始终先尝试「限制边长」解码，再全分辨率兜底，避免大图先整帧进内存再失败 */
    const attempts = [
      () => createImageBitmap(file, { ...orient, resizeWidth: max }),
      () => createImageBitmap(file, { ...orient, resizeHeight: max }),
      () => createImageBitmap(file, { ...orient, resizeWidth: max, resizeHeight: max }),
      () => createImageBitmap(file, orient),
    ]

    for (const factory of attempts) {
      const bmp = await tryBitmap(factory)
      if (bmp) return bmp
    }
  }

  const url = URL.createObjectURL(file)
  try {
    const img = await loadImageFromObjectUrl(url)
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    if (!nw || !nh) throw new Error('Invalid image dimensions')
    if (Math.max(nw, nh) <= max) return img

    const scale = max / Math.max(nw, nh)
    const tw = Math.max(1, Math.floor(nw * scale))
    const th = Math.max(1, Math.floor(nh * scale))
    const canvas = document.createElement('canvas')
    canvas.width = tw
    canvas.height = th
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')
    ctx.drawImage(img, 0, 0, nw, nh, 0, 0, tw, th)
    try {
      URL.revokeObjectURL(url)
    } catch {
      /* ignore */
    }
    img.removeAttribute('src')
    if (typeof createImageBitmap === 'function') {
      try {
        return await createImageBitmap(canvas)
      } catch {
        /* use canvas as drawable */
      }
    }
    return canvas
  } catch (e) {
    try {
      URL.revokeObjectURL(url)
    } catch {
      /* ignore */
    }
    throw e
  }
}

function drawableSize(drawable) {
  if ('naturalWidth' in drawable && drawable.naturalWidth) {
    return { w: drawable.naturalWidth, h: drawable.naturalHeight }
  }
  return { w: drawable.width, h: drawable.height }
}

function parseCssRgb(css) {
  if (typeof css !== 'string') return [252, 248, 243]
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(css.trim())
  if (!m) return [252, 248, 243]
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
}

/**
 * 在 **实际 drawImage 目标矩形** 内采样，避免 letterbox 占满视窗时误判（桌面宽色域也可能放大色差）。
 * drawImage 在部分 WebKit/HEIC 上会静默失败 → 仅底色 → 应抛错让上层走 HEIC 软转或保留预览。
 */
function drawHasNonPadPixelsInRect(ctx, canvasW, canvasH, padColor, dx, dy, dw, dh) {
  const pad = parseCssRgb(padColor)
  const tol = 38
  if (!(dw > 0.5 && dh > 0.5)) return false
  const relPts = [
    [0.5, 0.5],
    [0.22, 0.5],
    [0.78, 0.5],
    [0.5, 0.22],
    [0.5, 0.78],
  ]
  try {
    for (const [rx, ry] of relPts) {
      let x = Math.floor(dx + dw * rx)
      let y = Math.floor(dy + dh * ry)
      x = Math.max(0, Math.min(canvasW - 1, x))
      y = Math.max(0, Math.min(canvasH - 1, y))
      const d = ctx.getImageData(x, y, 1, 1).data
      if (
        Math.abs(d[0] - pad[0]) > tol ||
        Math.abs(d[1] - pad[1]) > tol ||
        Math.abs(d[2] - pad[2]) > tol
      ) {
        return true
      }
    }
  } catch {
    return true
  }
  return false
}

/**
 * Center-crop and scale image file to fill a rectangle of the given aspect ratio.
 * @param {File} file
 * @param {object} [options]
 * @param {number} [options.aspectWidthOverHeight] — default SLOT_FRAME_ASPECT
 * @param {number} [options.outputWidth] — pixel width of output (height derived)
 * @param {number} [options.jpegQuality] — 0…1 for JPEG output
 * @returns {Promise<string>} data URL (image/jpeg)
 */
export async function centerCropCoverFileToDataUrl(file, options = {}) {
  const aspect = options.aspectWidthOverHeight ?? SLOT_FRAME_ASPECT
  const outW = options.outputWidth ?? DEFAULT_OUTPUT_WIDTH
  const outH = options.outputHeight ?? Math.round(outW / aspect)

  const drawable = await decodeForCanvas(file)
  try {
    const { w: iw, h: ih } = drawableSize(drawable)
    if (!iw || !ih) throw new Error('Invalid image dimensions')

    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')

    const scale = Math.max(outW / iw, outH / ih)
    const sw = outW / scale
    const sh = outH / scale
    const sx = (iw - sw) / 2
    const sy = (ih - sh) / 2

    ctx.drawImage(drawable, sx, sy, sw, sh, 0, 0, outW, outH)

    const q = options.jpegQuality ?? 0.9
    return canvas.toDataURL('image/jpeg', q)
  } finally {
    disposeDecodedDrawable(drawable)
  }
}

/**
 * Scale whole image to fit inside the slot aspect — no cropping; pads with `padColor`.
 * @param {File} file
 * @param {object} [options]
 * @param {number} [options.aspectWidthOverHeight]
 * @param {number} [options.outputWidth]
 * @param {string} [options.padColor] — CSS color for top/bottom or side bars
 * @param {number} [options.jpegQuality]
 */
export async function containFitFileToDataUrl(file, options = {}) {
  const aspect = options.aspectWidthOverHeight ?? SLOT_FRAME_ASPECT
  const outW = options.outputWidth ?? DEFAULT_OUTPUT_WIDTH
  const outH = options.outputHeight ?? Math.round(outW / aspect)
  const padColor = options.padColor ?? DEFAULT_PAD

  const drawable = await decodeForCanvas(file)
  try {
    const { w: iw, h: ih } = drawableSize(drawable)
    if (!iw || !ih) throw new Error('Invalid image dimensions')

    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')

    ctx.fillStyle = padColor
    ctx.fillRect(0, 0, outW, outH)

    const scale = Math.min(outW / iw, outH / ih)
    const dw = iw * scale
    const dh = ih * scale
    const dx = (outW - dw) / 2
    const dy = (outH - dh) / 2

    ctx.drawImage(drawable, 0, 0, iw, ih, dx, dy, dw, dh)

    if (!drawHasNonPadPixelsInRect(ctx, outW, outH, padColor, dx, dy, dw, dh)) {
      throw new Error('Canvas did not paint image pixels')
    }

    const q = options.jpegQuality ?? 0.9
    return canvas.toDataURL('image/jpeg', q)
  } finally {
    disposeDecodedDrawable(drawable)
  }
}
