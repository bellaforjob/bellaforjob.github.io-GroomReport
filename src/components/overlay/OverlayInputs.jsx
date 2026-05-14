/**
 * Controlled inputs positioned over the template artwork. Parent owns state;
 * these components mirror `value` → overlay display in real time (single source
 * of truth in React state).
 */

export function OverlayLineInput({
  fieldId,
  label,
  value,
  onValueChange,
  className = '',
  inputClassName = '',
  /** 0–100：单格内输入区从左侧起算，与底图标题错开，避免与印刷字重叠 */
  valueStartPercent,
  ...inputProps
}) {
  const { className: inputPropsClassName, style: inputStyle, ...restInput } = inputProps
  const labelClass = ['line-input', 'template-text', className].filter(Boolean).join(' ')
  const mergedInputClass = [inputClassName, inputPropsClassName].filter(Boolean).join(' ')

  const mergedInputStyle =
    valueStartPercent != null && valueStartPercent >= 0
      ? { ...inputStyle, left: `${valueStartPercent}%` }
      : inputStyle

  return (
    <label className={labelClass} htmlFor={fieldId}>
      <span className="visually-hidden">{label}</span>
      <input
        id={fieldId}
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        data-overlay-field={fieldId}
        autoComplete="off"
        {...restInput}
        className={mergedInputClass || undefined}
        style={mergedInputStyle}
      />
    </label>
  )
}

export function OverlayDateInput({
  fieldId,
  label,
  value,
  onValueChange,
  className = '',
  valueStartPercent,
}) {
  const labelClass = ['line-input', 'template-text', className].filter(Boolean).join(' ')
  const valueStartStyle =
    valueStartPercent != null && valueStartPercent >= 0
      ? { left: `${valueStartPercent}%` }
      : undefined

  return (
    <label className={labelClass} htmlFor={fieldId}>
      <span className="visually-hidden">{label}</span>
      <input
        id={fieldId}
        type="date"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        data-overlay-field={fieldId}
        style={valueStartStyle}
      />
    </label>
  )
}

export function OverlayTextArea({
  fieldId,
  label,
  value,
  onValueChange,
  rows = 2,
  className = '',
  /** 与单行字段类似：相对包裹层宽度，输入区左缘从标题文字之后开始 */
  valueStartPercent,
  /** 可选：相对包裹层高度，顶缘避开印刷标题行（如 Groomer 区块） */
  valueTopPercent,
  ...rest
}) {
  const { className: textareaClassName, style: textareaStyle, ...textareaRest } = rest
  const labelClass = ['area-input', 'template-text', className].filter(Boolean).join(' ')
  const mergedTaClass = [textareaClassName].filter(Boolean).join(' ')

  const useInset =
    (valueStartPercent != null && valueStartPercent >= 0) ||
    (valueTopPercent != null && valueTopPercent >= 0)

  const mergedTextareaStyle = useInset
    ? {
        ...textareaStyle,
        position: 'absolute',
        width: 'auto',
        margin: 0,
        right: 0,
        ...(valueStartPercent != null && valueStartPercent >= 0
          ? { left: `${valueStartPercent}%` }
          : { left: 0 }),
        ...(valueTopPercent != null && valueTopPercent >= 0
          ? { top: `${valueTopPercent}%`, bottom: 0 }
          : { top: 0, bottom: 0 }),
      }
    : textareaStyle

  return (
    <label className={labelClass} htmlFor={fieldId}>
      <span className="visually-hidden">{label}</span>
      <textarea
        id={fieldId}
        rows={rows}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        data-overlay-field={fieldId}
        {...textareaRest}
        className={mergedTaClass || undefined}
        style={mergedTextareaStyle}
      />
    </label>
  )
}
