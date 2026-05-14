/**
 * Helpers: rects are in pixels on the 682×1024 template bitmap (`grooming-template.png`).
 */

/** Bitmap-space rect → overlay box % (full canvas). */
export function pxRectToBoxPercent(rect, ref = { width: 682, height: 1024 }) {
  const W = ref.width
  const H = ref.height
  return {
    top: (rect.y / H) * 100,
    left: (rect.x / W) * 100,
    width: (rect.w / W) * 100,
    height: (rect.h / H) * 100,
  }
}

/**
 * Inner rect (bitmap px) → % inside `regionPx`. Health marks use per-row strip rects（可由布局微调 `strips.coat|skin|beh` 整体移动/缩放，与 Services 用整块 region 同理）;
 * strip 位图原点在行标题右侧；printed □ can sit slightly left (ix < 0). Do not clamp left/top:
 * clamping to [0,100] pinned those marks to `left: 0%` and broke alignment.
 *
 * @param {{ clampDimsToPctOfRegion?: boolean }} [opts]
 *        Default true — width/height capped at 100% of region (mark slots). Other 手写线下沿可伸出
 *        区外时需 `clampDimsToPctOfRegion: false`，否则拖到区外也会被压成整块宽，配合 min-width 显得「更长」。
 */
export function innerPxToLocalPercent(innerPx, regionPx, opts = {}) {
  const clampDims = opts.clampDimsToPctOfRegion !== false
  const ix = innerPx.x - regionPx.x
  const iy = innerPx.y - regionPx.y
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
  const wPct = (innerPx.w / regionPx.w) * 100
  const hPct = (innerPx.h / regionPx.h) * 100
  return {
    left: (ix / regionPx.w) * 100,
    top: (iy / regionPx.h) * 100,
    width: clampDims ? clamp(wPct, 0, 100) : Math.max(0, wPct),
    height: clampDims ? clamp(hPct, 0, 100) : Math.max(0, hPct),
  }
}
