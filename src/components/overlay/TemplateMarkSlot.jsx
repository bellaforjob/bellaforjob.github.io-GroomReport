/**
 * Template-aligned hit target + checkmark. Parent must be `position: relative`.
 */

import { templateMarkBoxStyle } from './templateMarkBox'

export function TemplateMarkSlot({
  box,
  checked,
  inputType = 'checkbox',
  name,
  value,
  onChange,
  ariaLabel,
}) {
  const radioProps =
    inputType === 'radio' && name !== undefined && value !== undefined
      ? { name, value }
      : {}

  const boxStyle = templateMarkBoxStyle(box)
  /** `npm run dev` 下画出热区虚线，便于确认 templateRegions 是否生效；生产构建不含此样式。 */
  const devMarkGuide =
    import.meta.env.DEV
      ? {
          outline: '1px dashed rgba(13, 148, 136, 0.55)',
          outlineOffset: 0,
        }
      : null

  return (
    <div
      className={`template-mark-slot${checked ? ' template-mark-slot--checked' : ''}`.trim()}
      style={devMarkGuide ? { ...boxStyle, ...devMarkGuide } : boxStyle}
    >
      <input
        type={inputType}
        className="template-mark-slot__input"
        checked={checked}
        onChange={onChange}
        aria-label={ariaLabel}
        {...radioProps}
      />
      <span className="template-mark-slot__glyph" aria-hidden>
        {checked ? '✓' : ''}
      </span>
    </div>
  )
}
