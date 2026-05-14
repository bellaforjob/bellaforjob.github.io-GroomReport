import { TEMPLATE_REF_SIZE } from '../layout/templateLayout'

/**
 * Layout canvas: the grooming report template is shown as a full-bleed
 * background image; interactive regions sit in the overlay on top.
 */
export function TemplateCanvas({
  backgroundSrc,
  backgroundAlt = 'Grooming report form template',
  maxWidth = TEMPLATE_REF_SIZE.width,
  onBackgroundError,
  exportRef,
  children,
  layoutAdjustActive = false,
  layoutAdjustSlot = null,
}) {
  return (
    <div
      ref={exportRef}
      className={`template-canvas${layoutAdjustActive ? ' template-canvas--layout-adjust' : ''}`}
      style={{ maxWidth }}
    >
      <img
        className="template-canvas__bg"
        src={backgroundSrc}
        alt={backgroundAlt}
        width={TEMPLATE_REF_SIZE.width}
        height={TEMPLATE_REF_SIZE.height}
        decoding="async"
        draggable={false}
        crossOrigin="anonymous"
        onError={onBackgroundError}
      />
      <div className="template-canvas__overlay">
        {children}
        {layoutAdjustSlot}
      </div>
    </div>
  )
}
