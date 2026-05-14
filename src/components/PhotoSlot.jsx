import { useRef, useState } from 'react'
import { isImageLikeFile } from '../utils/imageCrop'

export function PhotoSlot({
  label,
  src,
  onPick,
  className = '',
  /** Matches `templateRegions` photo slot id (e.g. ears_before). */
  slotId,
}) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)

  const runPick = async (file) => {
    if (!file || !isImageLikeFile(file)) return
    setBusy(true)
    try {
      await onPick(file)
    } finally {
      setBusy(false)
    }
  }

  const onChange = async (e) => {
    const f = e.target.files?.[0]
    if (f) await runPick(f)
    e.target.value = ''
  }

  const onDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if ([...e.dataTransfer.types].includes('Files')) {
      e.dataTransfer.dropEffect = 'copy'
    }
    setDragOver(true)
  }

  const onDragLeave = (e) => {
    e.preventDefault()
    const rt = e.relatedTarget
    if (rt && e.currentTarget.contains(rt)) return
    setDragOver(false)
  }

  const onDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) await runPick(f)
  }

  return (
    <div
      className={`photo-slot ${src ? 'photo-slot--filled' : ''} ${dragOver ? 'photo-slot--dragover' : ''} ${busy ? 'photo-slot--busy' : ''} ${className}`.trim()}
      data-slot-id={slotId}
      onDragOver={onDragOver}
      onDragEnter={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <label className="photo-slot__label" aria-label={label}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif"
          className="photo-slot__input"
          onChange={onChange}
          disabled={busy}
        />
        {busy ? <span className="photo-slot__busy" aria-hidden /> : null}
        {src ? (
          <img src={src} alt="" className="photo-slot__img" decoding="async" />
        ) : (
          <>
            <span className="photo-slot__hit" aria-hidden />
            <span className="photo-slot__hint">从相册选图</span>
          </>
        )}
      </label>
    </div>
  )
}
