/** Convert pixel rect on template bitmap to %-of-template box (top/left/width/height). */
export function pixelRectToPercent(rect, refSize) {
  const W = refSize.width
  const H = refSize.height
  return {
    top: (rect.y / H) * 100,
    left: (rect.x / W) * 100,
    width: (rect.w / W) * 100,
    height: (rect.h / H) * 100,
  }
}

/** Inner-region boxes: numbers (0–100) become CSS % strings; strings pass through. */
export function percentBoxToCss(box) {
  if (!box) return {}
  if (typeof box.left === 'string') {
    return {
      left: box.left,
      top: box.top,
      width: box.width,
      height: box.height,
    }
  }
  return {
    left: `${box.left}%`,
    top: `${box.top}%`,
    width: `${box.width}%`,
    height: `${box.height}%`,
  }
}
