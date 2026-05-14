import { useEffect, useRef } from 'react'
import { OVERLAY_FIELD_IDS } from './overlayFieldIds'
import { TemplateMarkSlot } from './TemplateMarkSlot'
import { otherTextPositionStyle } from './templateMarkBox'

/** Generic multi-select row — ✓ in each box when that option is selected. */
export function CheckboxMarksRow({
  options,
  checkSlots,
  values,
  onToggle,
  groupAriaLabel,
  className = '',
  wrap = true,
}) {
  const labelFor = (key) =>
    options.find((o) => (o.key ?? o.value) === key)?.label ?? key

  const slots = checkSlots.map(({ key, box }) => (
    <TemplateMarkSlot
      key={key}
      box={box}
      inputType="checkbox"
      checked={Boolean(values[key])}
      onChange={() => onToggle(key)}
      ariaLabel={`${groupAriaLabel}: ${labelFor(key)}`}
    />
  ))

  if (!wrap) {
    return slots
  }

  return (
    <div
      className={`template-checkbox-group ${className}`.trim()}
      role="group"
      aria-label={groupAriaLabel}
    >
      {slots}
    </div>
  )
}

/** Behavior: Calm / Anxious / Other + dotted line (enabled when Other selected). */
export function BehaviorRadioOtherRow({
  name,
  radiogroupLabel,
  slots,
  behaviorOptions,
  selectedValue,
  onSelect,
  otherText,
  otherValue,
  onOtherChange,
  groupClassName = 'template-checkbox-group--behavior', // --services vs --behavior row height
  otherInputAriaLabel = 'Behavior other details',
  /** Behavior：手写线与 HUD 同属「整块 health 位图像素框」坐标系时，输入框提升到 health-block-root 渲染 */
  omitOtherLineInput = false,
  /** 与 omitOtherLineInput 同时使用，聚焦逻辑仍在本组件 */
  otherInputExternalRef = null,
}) {
  const fallbackOtherRef = useRef(null)
  const otherInputRef = otherInputExternalRef ?? fallbackOtherRef
  const prevSelectedRef = useRef(selectedValue)

  const labelFor = (value) =>
    behaviorOptions.find((o) => o.value === value)?.label ?? value
  const otherFieldId = OVERLAY_FIELD_IDS[otherText.field]
  const otherDisabled = selectedValue !== 'other'

  /** 从其它选项切换到 Other 时聚焦手写框，符合「点就是这条线」的预期（Behavior / Services 共用） */
  useEffect(() => {
    const prev = prevSelectedRef.current
    prevSelectedRef.current = selectedValue
    if (selectedValue !== 'other') return
    if (prev === 'other') return
    const el = otherInputRef.current
    if (!el) return
    const run = () => {
      try {
        el.focus()
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      } catch {
        /* ignore */
      }
    }
    const id = window.requestAnimationFrame(run)
    return () => window.cancelAnimationFrame(id)
  }, [selectedValue, otherInputRef])

  const rootClass = omitOtherLineInput
    ? `template-checkbox-group ${groupClassName}`.trim()
    : `template-checkbox-group ${groupClassName} template-checkbox-group--with-other`.trim()

  return (
    <div className={rootClass}>
      <div
        className="behavior-radio-group"
        role="radiogroup"
        aria-label={radiogroupLabel}
      >
        {slots.map(({ key, box }) => (
          <TemplateMarkSlot
            key={key}
            box={box}
            inputType="radio"
            name={name}
            value={key}
            checked={selectedValue === key}
            onChange={() => onSelect(key)}
            ariaLabel={`${radiogroupLabel} ${labelFor(key)}`}
          />
        ))}
      </div>
      {omitOtherLineInput ? null : (
        <input
          ref={otherInputRef}
          id={otherFieldId}
          type="text"
          className="template-checkbox-group__other-input template-text template-on-artwork-input"
          style={otherTextPositionStyle(otherText.box)}
          value={otherValue}
          onChange={(e) => onOtherChange(e.target.value)}
          placeholder=""
          aria-label={otherInputAriaLabel}
          disabled={otherDisabled}
          data-overlay-field={otherFieldId}
        />
      )}
    </div>
  )
}

/** Coat / skin — mutually exclusive; ✓ on selected printed box only. */
export function ConditionRadioMarksRow({
  name,
  radiogroupLabel,
  slots,
  conditionOptions,
  selectedValue,
  onSelect,
}) {
  const labelFor = (value) =>
    conditionOptions.find((o) => o.value === value)?.label ?? value

  return (
    <div className="health-row__mark-strip">
      <div className="template-checkbox-group template-checkbox-group--health-strip">
        <div
          className="behavior-radio-group"
          role="radiogroup"
          aria-label={radiogroupLabel}
        >
          {slots.map(({ key, box }) => (
            <TemplateMarkSlot
              key={key}
              box={box}
              inputType="radio"
              name={name}
              value={key}
              checked={selectedValue === key}
              onChange={() => onSelect(key)}
              ariaLabel={`${radiogroupLabel} ${labelFor(key)}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
