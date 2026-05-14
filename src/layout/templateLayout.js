import { TEMPLATE_REFERENCE, TEXT_OVERLAY_NUDGE_PX } from '../config/templateRegions'

export const TEMPLATE_REF_SIZE = TEMPLATE_REFERENCE

export const TEMPLATE_ASPECT_RATIO =
  TEMPLATE_REFERENCE.width / TEMPLATE_REFERENCE.height

/**
 * Absolute placement (% of template bitmap). Photo slots pass `nudge: false` so
 * pixel rects stay exact; text regions use `TEXT_OVERLAY_NUDGE_PX` from config.
 */
export function regionBoxStyle(box, nudge = false) {
  const { top: nt, left: nl } = nudge ? TEXT_OVERLAY_NUDGE_PX : { top: 0, left: 0 }
  return {
    position: 'absolute',
    boxSizing: 'border-box',
    top: nt !== 0 ? `calc(${box.top}% + ${nt}px)` : `${box.top}%`,
    left: nl !== 0 ? `calc(${box.left}% + ${nl}px)` : `${box.left}%`,
    width: `${box.width}%`,
    height: `${box.height}%`,
  }
}
