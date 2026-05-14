/**
 * Normalize + shallow-merge overlay patches bundled with the app vs saved in localStorage.
 */

/** @typedef {{ version: number, bundledRevision: number, regions: object, marks: object, fields: object, strips: object }} LayoutPatches */

/** @returns {LayoutPatches} */
export function normalizeLayoutOverrideShape(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}
  const pickObj = (k) =>
    typeof r[k] === 'object' && r[k] !== null && !Array.isArray(r[k]) ? { ...r[k] } : {}

  return {
    version: typeof r.version === 'number' ? r.version : 1,
    bundledRevision:
      typeof r.bundledRevision === 'number' && Number.isFinite(r.bundledRevision)
        ? r.bundledRevision
        : 0,
    regions: pickObj('regions'),
    marks: pickObj('marks'),
    fields: pickObj('fields'),
    strips: pickObj('strips'),
  }
}

/** Shipped overrides first; localStorage layer overwrites overlapping keys only. */
export function mergeBundledAndStoredPatches(bundledRaw, storedRaw) {
  const b = normalizeLayoutOverrideShape(bundledRaw)
  const s = normalizeLayoutOverrideShape(storedRaw)
  return {
    version: b.version,
    bundledRevision: b.bundledRevision,
    regions: { ...b.regions, ...s.regions },
    marks: { ...b.marks, ...s.marks },
    fields: { ...b.fields, ...s.fields },
    strips: { ...b.strips, ...s.strips },
  }
}

export function cloneLayoutOverrideState(layoutRaw) {
  return JSON.parse(JSON.stringify(normalizeLayoutOverrideShape(layoutRaw)))
}
