import { regionBoxStyle } from '../layout/templateLayout'

/**
 * Absolutely positioned slot over the template background (percent-based box).
 * `applyTextNudge` — text regions only; photo layer uses raw % so slots match bitmap px.
 */
export function TemplateRegion({ box, applyTextNudge = false, className = '', style: extraStyle, children }) {
  return (
    <div
      className={`template-region ${className}`.trim()}
      style={{ ...regionBoxStyle(box, applyTextNudge), ...extraStyle }}
    >
      {children}
    </div>
  )
}
