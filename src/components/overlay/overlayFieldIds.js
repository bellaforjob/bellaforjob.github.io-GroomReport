/** Stable DOM ids + data-overlay-field hooks for template-bound text. */
export const OVERLAY_FIELD_IDS = Object.freeze({
  petName: 'overlay-field-petName',
  date: 'overlay-field-date',
  breed: 'overlay-field-breed',
  gender: 'overlay-field-gender',
  weight: 'overlay-field-weight',
  client: 'overlay-field-client',
  age: 'overlay-field-age',
  serviceOther: 'overlay-field-serviceOther',
  behaviorOther: 'overlay-field-behaviorOther',
  healthNotes: 'overlay-field-healthNotes',
  groomerNotes: 'overlay-field-groomerNotes',
  nextAppointment: 'overlay-field-nextAppointment',
})

/** Id for `info` keys — registered ids above, or `overlay-field-{key}` for config-only fields. */
export function overlayFieldId(fieldKey) {
  return OVERLAY_FIELD_IDS[fieldKey] ?? `overlay-field-${fieldKey}`
}
