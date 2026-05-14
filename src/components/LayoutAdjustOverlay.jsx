import { useCallback, useRef } from 'react'
import { TEMPLATE_REFERENCE } from '../config/templateRegions'

const BMP_W = TEMPLATE_REFERENCE.width
const BMP_H = TEMPLATE_REFERENCE.height

/** @typedef {{ x: number, y: number, w: number, h: number }} BmpRect */

function clampBmp(r) {
  const x = Math.round(Math.max(0, Math.min(BMP_W - 4, r.x)))
  const y = Math.round(Math.max(0, Math.min(BMP_H - 4, r.y)))
  const w = Math.round(Math.max(8, Math.min(BMP_W - x, r.w)))
  const h = Math.round(Math.max(8, Math.min(BMP_H - y, r.h)))
  return { x, y, w, h }
}

function clientToBmp(clientX, clientY, canvasEl) {
  if (!canvasEl) return null
  const rect = canvasEl.getBoundingClientRect()
  const x = ((clientX - rect.left) / rect.width) * BMP_W
  const y = ((clientY - rect.top) / rect.height) * BMP_H
  return { x, y }
}

/** @param {{ canvasEl: HTMLElement | null, snapshots: Array<{ id: string, label: string, bmp: BmpRect }>, setOverrides: function }} props */
export function LayoutAdjustOverlay({ canvasEl, snapshots, setOverrides }) {
  const dragging = useRef(null)
  const dragListeners = useRef({ move: null, up: null })

  const bmpToPct = useCallback((bmp) => {
    return {
      left: `${(bmp.x / BMP_W) * 100}%`,
      top: `${(bmp.y / BMP_H) * 100}%`,
      width: `${(bmp.w / BMP_W) * 100}%`,
      height: `${(bmp.h / BMP_H) * 100}%`,
    }
  }, [])

  const patchOverrides = useCallback(
    (id, nextBmp) => {
      const b = clampBmp(nextBmp)
      setOverrides((prev) => {
        if (id.startsWith('region:')) {
          const k = id.slice(7)
          return { ...prev, regions: { ...prev.regions, [k]: b } }
        }
        if (id.startsWith('field:')) {
          const k = id.slice(6)
          return { ...prev, fields: { ...prev.fields, [k]: b } }
        }
        if (id.startsWith('strip:')) {
          const k = id.slice(6)
          return { ...prev, strips: { ...(prev.strips && typeof prev.strips === 'object' ? prev.strips : {}), [k]: b } }
        }
        return { ...prev, marks: { ...prev.marks, [id]: b } }
      })
    },
    [setOverrides],
  )

  const onPointerMove = useCallback(
    (e) => {
      const d = dragging.current
      if (!d) return
      const pt = clientToBmp(e.clientX, e.clientY, canvasEl)
      if (!pt) return

      if (d.mode === 'move') {
        patchOverrides(d.id, {
          x: pt.x - d.ox,
          y: pt.y - d.oy,
          w: d.start.w,
          h: d.start.h,
        })
      } else if (d.mode === 'resize') {
        const nw = Math.max(8, pt.x - d.start.x)
        const nh = Math.max(8, pt.y - d.start.y)
        patchOverrides(d.id, { ...d.start, w: nw, h: nh })
      }
    },
    [canvasEl, patchOverrides],
  )

  const endDrag = useCallback(() => {
    const { move, up } = dragListeners.current
    dragging.current = null
    if (move) window.removeEventListener('pointermove', move)
    if (up) {
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    dragListeners.current = { move: null, up: null }
  }, [])

  const onBodyDown = useCallback(
    (e, item) => {
      if (e.button !== 0) return
      const pt = clientToBmp(e.clientX, e.clientY, canvasEl)
      if (!pt) return
      dragging.current = {
        mode: 'move',
        id: item.id,
        ox: pt.x - item.bmp.x,
        oy: pt.y - item.bmp.y,
        start: { ...item.bmp },
      }
      ;(e.currentTarget)?.setPointerCapture?.(e.pointerId)
      dragListeners.current = { move: onPointerMove, up: endDrag }
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', endDrag)
      window.addEventListener('pointercancel', endDrag)
      e.preventDefault()
      e.stopPropagation()
    },
    [canvasEl, endDrag, onPointerMove],
  )

  const onResizeDown = useCallback(
    (e, item) => {
      if (e.button !== 0) return
      dragging.current = {
        mode: 'resize',
        id: item.id,
        start: { ...item.bmp },
        ox: 0,
        oy: 0,
      }
      dragListeners.current = { move: onPointerMove, up: endDrag }
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', endDrag)
      window.addEventListener('pointercancel', endDrag)
      e.preventDefault()
      e.stopPropagation()
    },
    [endDrag, onPointerMove],
  )

  if (!canvasEl || !snapshots?.length) return null

  return (
    <div className="layout-adjust-layer" aria-hidden>
      {snapshots.map((item) => (
        <div
          key={item.id}
          className={`layout-adjust-box layout-adjust-box--${item.kind}`}
          style={bmpToPct(item.bmp)}
          onPointerDown={(e) => onBodyDown(e, item)}
        >
          <span className="layout-adjust-box__cap">{item.label}</span>
          <button
            type="button"
            className="layout-adjust-box__resize"
            aria-label={`Resize ${item.label}`}
            onPointerDown={(e) => onResizeDown(e, item)}
          />
        </div>
      ))}
    </div>
  )
}
