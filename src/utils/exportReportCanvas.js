/**
 * Export pipeline: DOM (template + overlays) → html2canvas → HTMLCanvasElement
 * → PNG (via canvas.toBlob) or PDF (canvas → jsPDF).
 */

const DEFAULT_COMPOSE = Object.freeze({
  /** Device pixels per CSS pixel; 2 gives sharp print/retina output. */
  scale: 2,
  backgroundColor: '#fff8f0',
  useCORS: true,
  /** Reject cross-origin pixels so we don’t silently blank the template. */
  allowTaint: false,
  logging: false,
  imageTimeout: 15_000,
})

/**
 * Rasterize a DOM subtree to a single canvas (template image, photos, text, marks).
 * @param {HTMLElement} node  Root to capture (e.g. `.template-canvas`).
 * @param {import('html2canvas').Options} [options]  Merged with defaults; `scale` and `backgroundColor` are passed through.
 */
export async function composeReportToCanvas(node, options = {}) {
  if (!node) throw new Error('Nothing to export')
  const { default: html2canvas } = await import('html2canvas')
  const scale = options.scale ?? DEFAULT_COMPOSE.scale
  const backgroundColor = options.backgroundColor ?? DEFAULT_COMPOSE.backgroundColor
  const rest = { ...DEFAULT_COMPOSE, ...options, scale, backgroundColor }
  return html2canvas(node, rest)
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Encode canvas pixels as a PNG blob (lossless).
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<Blob>}
 */
export function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('PNG encoding failed (canvas.toBlob returned null)'))
          return
        }
        resolve(blob)
      },
      'image/png',
    )
  })
}

/**
 * Save a canvas as a `.png` file using the Canvas API + object URL download.
 * @param {HTMLCanvasElement} canvas
 * @param {string} filename
 */
export async function downloadCanvasAsPng(canvas, filename) {
  const blob = await canvasToPngBlob(canvas)
  downloadBlob(blob, filename)
}

/**
 * One-shot: rasterize `node` to a canvas, then download PNG bytes.
 * Use this for “Export PNG” from the report UI.
 *
 * @param {HTMLElement} node
 * @param {string} filename
 * @param {import('html2canvas').Options} [composeOptions]
 */
export async function exportNodeToPngFile(node, filename, composeOptions = {}) {
  const canvas = await composeReportToCanvas(node, composeOptions)
  await downloadCanvasAsPng(canvas, filename)
}

/** Single-page PDF sized to match the raster dimensions (no margins). */
export async function downloadCanvasAsPdf(canvas, filename) {
  const { jsPDF } = await import('jspdf')
  const imgData = canvas.toDataURL('image/png')
  const pxW = canvas.width
  const pxH = canvas.height
  const mmW = (pxW * 25.4) / 96
  const mmH = (pxH * 25.4) / 96

  const pdf = new jsPDF({
    orientation: pxH >= pxW ? 'portrait' : 'landscape',
    unit: 'mm',
    format: [mmW, mmH],
    compress: true,
  })

  pdf.addImage(imgData, 'PNG', 0, 0, mmW, mmH, undefined, 'FAST')
  pdf.save(filename)
}
