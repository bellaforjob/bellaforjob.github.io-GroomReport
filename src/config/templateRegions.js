/**
 * 坐标以 `src/assets/grooming-template.png`（682×1024）为准。
 * 交互区仅对应原图内容，不在版面外叠加第二套线框：
 * - **文字**：原图虚线/下划线所在区域 → `REGION_RECT_PX` + 各 `*_ABS` 像素槽位。
 * - **上传**：原图 Before/After **白色圆角框**（含 Nails / Body）→ `PHOTO_UPLOAD_SLOTS_PX`（与框四边对齐）。
 * 微调对齐只改本文件中的像素常量；勿用 `TEXT_OVERLAY_NUDGE_PX` 长期偏移文字层（会破坏与下划线对齐）。
 */

import { innerPxToLocalPercent, pxRectToBoxPercent } from '../utils/templateLayoutPx'
import { TEMPLATE_LAYOUT_VERSION } from './layoutVersion.js'

export { TEMPLATE_LAYOUT_VERSION }

export const TEMPLATE_REFERENCE = Object.freeze({ width: 682, height: 1024 })

/** 文字区微调 (px)，默认 0；照片槽不使用。非 0 时输入层会与原图下划线错位。 */
export const TEXT_OVERLAY_NUDGE_PX = Object.freeze({ top: 0, left: 0 })

/**
 * 在 `grooming-template.png` 上已测好的「口」上再平移（一般保持 0）。
 * 底图方格位置见下各 `*_ABS`；改 dx/dy 会整组偏离印刷。
 */
export const MARK_SLOT_OFFSET_PX = Object.freeze({ dx: 0, dy: 0 })

function shiftMarkRect(rect, off = MARK_SLOT_OFFSET_PX) {
  return {
    x: rect.x + off.dx,
    y: rect.y + off.dy,
    w: rect.w,
    h: rect.h,
  }
}

/**
 * 各输入区外接矩形（682×1024 底图像素）— 与虚线/小方格对齐。
 * 页眉四行等分：第一行格底 = 第一条横线（Pet name / Date 下划线），须顶 y=77、高 124（每行 31px → 108,139,170,201）。
 * 输入框 `bottom` 对齐格底，故与「第一项」印刷标题下的虚线重合。
 */
export const REGION_RECT_PX = Object.freeze({
  header: { x: 258, y: 77, w: 402, h: 124 },
  services: { x: 30, y: 206, w: 622, h: 60 },
  health: { x: 30, y: 268, w: 622, h: 210 },
  groomer: { x: 30, y: 858, w: 622, h: 86 },
  footer: { x: 292, y: 952, w: 368, h: 50 },
})

const BOX = {
  header: pxRectToBoxPercent(REGION_RECT_PX.header),
  services: pxRectToBoxPercent(REGION_RECT_PX.services),
  health: pxRectToBoxPercent(REGION_RECT_PX.health),
  groomer: pxRectToBoxPercent(REGION_RECT_PX.groomer),
  footer: pxRectToBoxPercent(REGION_RECT_PX.footer),
}

export const SERVICE_OPTIONS = Object.freeze([
  { value: 'fullGroom', label: 'Full Groom' },
  { value: 'bath', label: 'Bath' },
  { value: 'nailTrim', label: 'Nail Trim' },
  { value: 'earCleaning', label: 'Ear Cleaning' },
  { value: 'other', label: 'Other' },
])

export const CONDITION_OPTIONS = Object.freeze([
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
])

export const BEHAVIOR_RADIO_OPTIONS = Object.freeze([
  { value: 'calm', label: 'Calm' },
  { value: 'anxious', label: 'Anxious' },
  { value: 'other', label: 'Other' },
])

/** Health 左侧标题列在位图里的宽度(px)，与 stripes 推导一致；须随 merged health.w 做比例缩放 */
export const HEALTH_LABEL_W = 80
const H_REG = REGION_RECT_PX.health

function healthStrip(rowTopAbs, rowH) {
  return {
    x: H_REG.x + HEALTH_LABEL_W,
    y: rowTopAbs,
    w: H_REG.w - HEALTH_LABEL_W,
    h: rowH,
  }
}

/** Coat / Skin 条纹理高度(px)，须与 strips.coat / strips.skin 一致 */
export const HEALTH_COAT_STRIP_H_PX = 36
export const HEALTH_SKIN_STRIP_H_PX = 36
const COAT_STRIP = healthStrip(304, HEALTH_COAT_STRIP_H_PX)
const SKIN_STRIP = healthStrip(344, HEALTH_SKIN_STRIP_H_PX)
/** Behavior 行内容条在位图 health 区域内的设计高度(px)，与 HUD / innerPxToLocalPercent 一致 */
export const HEALTH_BEHAVIOR_STRIP_H_PX = 38
const BEH_STRIP = healthStrip(384, HEALTH_BEHAVIOR_STRIP_H_PX)

/**
 * 以下 rect 为在 `grooming-template.png`（682×1024）上对「小方框」深色边线取外接矩形（含抗锯齿），
 * 热区位置与大小与底图一致。Services 各框在对应英文选项左侧（与印刷一致）。
 */
const SERVICE_MARK_ABS = Object.freeze([
  { key: 'fullGroom', rect: { x: 52, y: 231, w: 28, h: 26 } },
  { key: 'bath', rect: { x: 114, y: 231, w: 28, h: 27 } },
  { key: 'nailTrim', rect: { x: 249, y: 231, w: 28, h: 27 } },
  { key: 'earCleaning', rect: { x: 332, y: 231, w: 28, h: 27 } },
  { key: 'other', rect: { x: 433, y: 231, w: 28, h: 27 } },
])
/** 「Other:」后虚线手写区（整段下划线区域，非左侧 □） */
const SERVICE_OTHER_ABS = Object.freeze({ x: 504, y: 224, w: 132, h: 30 })

function freezeServiceCheckSlots() {
  const r = REGION_RECT_PX.services
  return Object.freeze(
    SERVICE_MARK_ABS.map(({ key, rect }) => ({
      key,
      box: innerPxToLocalPercent(shiftMarkRect(rect), r),
    })),
  )
}

const SERVICE_OTHER_BOX = innerPxToLocalPercent(shiftMarkRect(SERVICE_OTHER_ABS), REGION_RECT_PX.services, {
  clampDimsToPctOfRegion: false,
})

/** Coat：各科在底图中分别取「仅方框列」外接矩形（T≈246）；Good 与 Fair/Poor 的 y 略有差异为原图如此 */
const COAT_MARK_ABS = Object.freeze([
  { key: 'good', rect: { x: 118, y: 302, w: 28, h: 27 } },
  { key: 'fair', rect: { x: 278, y: 307, w: 28, h: 27 } },
  { key: 'poor', rect: { x: 444, y: 315, w: 28, h: 27 } },
])
const SKIN_MARK_ABS = Object.freeze([
  { key: 'good', rect: { x: 97, y: 328, w: 32, h: 29 } },
  { key: 'fair', rect: { x: 289, y: 328, w: 32, h: 29 } },
  { key: 'poor', rect: { x: 444, y: 328, w: 32, h: 29 } },
])
const BEH_MARK_ABS = Object.freeze([
  { key: 'calm', rect: { x: 85, y: 375, w: 32, h: 25 } },
  { key: 'anxious', rect: { x: 239, y: 375, w: 32, h: 25 } },
  { key: 'other', rect: { x: 357, y: 375, w: 32, h: 25 } },
])
/** Behavior 行 Other 后手写虚线区 */
const BEHAVIOR_OTHER_ABS = Object.freeze({ x: 420, y: 392, w: 210, h: 22 })

function freezeHealthMarks(absList, strip) {
  return Object.freeze(
    absList.map(({ key, rect }) => ({
      key,
      box: innerPxToLocalPercent(shiftMarkRect(rect), strip),
    })),
  )
}

/**
 * 上传热区 — Before/After 槽（相对采样基准再整体下移、缩窄宽度以便对齐印刷框）。
 * SHIFT_Y：全体下移；WIDTH_TRIM：每槽两边对称缩窄 total px（x+=WIDTH_TRIM/2, w-=WIDTH_TRIM）。
 */
const PHOTO_SHIFT_Y = 12
const PHOTO_WIDTH_TRIM = 12

/** 基准列（缩窄前中心不变） */
const PHOTO_COL_BASE = Object.freeze({
  leftBefore: Object.freeze({ x: 98, w: 98 }),
  leftAfter: Object.freeze({ x: 229, w: 99 }),
  rightBefore: Object.freeze({ x: 422, w: 99 }),
  rightAfter: Object.freeze({ x: 553, w: 95 }),
})

const PHOTO_COL = Object.freeze({
  leftBefore: narrowCol(PHOTO_COL_BASE.leftBefore),
  leftAfter: narrowCol(PHOTO_COL_BASE.leftAfter),
  rightBefore: narrowCol(PHOTO_COL_BASE.rightBefore),
  rightAfter: narrowCol(PHOTO_COL_BASE.rightAfter),
})

function narrowCol(col) {
  const dx = PHOTO_WIDTH_TRIM / 2
  return Object.freeze({
    x: Math.round(col.x + dx),
    w: Math.round(col.w - PHOTO_WIDTH_TRIM),
  })
}

/**
 * 三行 × 四列（6 组 Before/After）。中间一行原为 Tail / Face / Client request 挤占；现仅保留与印刷一致的 6 组。
 * Nails/Body 仍在原第 4 行像素带（跳过中间一整行槽位，避免热区与底图白框错位）。
 * LINE2_DOWN：仅第 2 行照片槽整体下移若干像素，对齐印刷白框（勿动第 3 行顶边 PHOTO_NAILS_BODY_ROW_TOP）。
 */
const PHOTO_ROW_GAP = 2
const PHOTO_LINE2_DOWN_PX = 8
const PHOTO_Y0 = 448 + PHOTO_SHIFT_Y
const PHOTO_ROW_H = Object.freeze([98, 98, 98, 88])
const PHOTO_NAILS_BODY_ROW_TOP =
  PHOTO_Y0 +
  PHOTO_ROW_H[0] +
  PHOTO_ROW_GAP +
  PHOTO_ROW_H[1] +
  PHOTO_ROW_GAP +
  PHOTO_ROW_H[2] +
  PHOTO_ROW_GAP
const PHOTO_ROWS = Object.freeze([
  Object.freeze({ y: PHOTO_Y0, h: PHOTO_ROW_H[0] }),
  Object.freeze({
    y: PHOTO_Y0 + PHOTO_ROW_H[0] + PHOTO_ROW_GAP + PHOTO_LINE2_DOWN_PX,
    h: PHOTO_ROW_H[1],
  }),
  Object.freeze({ y: PHOTO_NAILS_BODY_ROW_TOP, h: PHOTO_ROW_H[3] }),
])

function photoSlotRect(colKey, rowIndex) {
  const c = PHOTO_COL[colKey]
  const r = PHOTO_ROWS[rowIndex]
  return Object.freeze({ x: c.x, y: r.y, w: c.w, h: r.h })
}

/** 导出：裁图纵横比（典型槽）、行顶/底（调试） */
export const PHOTO_SLOT_FRAME = Object.freeze({
  widthPx: PHOTO_COL.leftAfter.w,
  heightPx: PHOTO_ROW_H[0],
  rowTopPx: PHOTO_ROWS.map((row) => row.y),
  rowBottomPx: PHOTO_ROWS.map((row) => row.y + row.h),
  x: Object.freeze({
    leftBefore: PHOTO_COL.leftBefore.x,
    leftAfter: PHOTO_COL.leftAfter.x,
    rightBefore: PHOTO_COL.rightBefore.x,
    rightAfter: PHOTO_COL.rightAfter.x,
  }),
})

export const PHOTO_SLOT_ASPECT = PHOTO_SLOT_FRAME.widthPx / PHOTO_SLOT_FRAME.heightPx

/**
 * 与原图白框一一对应的 12 个槽（勿删 id — `spots` 存储依赖 category/which）。
 * 第 2 行右列标为 Client request；最下行右列为 Tail（底图若印 Body 字样可忽略，以布局名为准）。
 */
const PHOTO_UPLOAD_SLOTS_PX = Object.freeze([
  {
    id: 'ears_before',
    category: 'ears',
    which: 'before',
    rectPx: photoSlotRect('leftBefore', 0),
  },
  {
    id: 'ears_after',
    category: 'ears',
    which: 'after',
    rectPx: photoSlotRect('leftAfter', 0),
  },
  {
    id: 'pawPads_before',
    category: 'pawPads',
    which: 'before',
    rectPx: photoSlotRect('rightBefore', 0),
  },
  {
    id: 'pawPads_after',
    category: 'pawPads',
    which: 'after',
    rectPx: photoSlotRect('rightAfter', 0),
  },
  {
    id: 'analArea_before',
    category: 'analArea',
    which: 'before',
    rectPx: photoSlotRect('leftBefore', 1),
  },
  {
    id: 'analArea_after',
    category: 'analArea',
    which: 'after',
    rectPx: photoSlotRect('leftAfter', 1),
  },
  {
    id: 'clientRequest_before',
    category: 'clientRequest',
    which: 'before',
    rectPx: photoSlotRect('rightBefore', 1),
  },
  {
    id: 'clientRequest_after',
    category: 'clientRequest',
    which: 'after',
    rectPx: photoSlotRect('rightAfter', 1),
  },
  {
    id: 'nails_before',
    category: 'nails',
    which: 'before',
    rectPx: photoSlotRect('leftBefore', 2),
  },
  {
    id: 'nails_after',
    category: 'nails',
    which: 'after',
    rectPx: photoSlotRect('leftAfter', 2),
  },
  {
    id: 'tail_before',
    category: 'tail',
    which: 'before',
    rectPx: photoSlotRect('rightBefore', 2),
  },
  {
    id: 'tail_after',
    category: 'tail',
    which: 'after',
    rectPx: photoSlotRect('rightAfter', 2),
  },
])

const PHOTO_REGION_SLOTS = PHOTO_UPLOAD_SLOTS_PX

export const EDITABLE_REGIONS = Object.freeze([
  {
    id: 'header',
    type: 'headerGrid',
    boxPercent: BOX.header,
    columns: 2,
    rows: 4,
    /** valueStartPercent：单格内输入从左侧起算，须落在底图标题之后，避免与「Pet name」等印刷字重叠 */
    cells: Object.freeze([
      { field: 'petName', input: 'text', label: 'Pet name', placeholder: ' ', valueStartPercent: 47 },
      { field: 'date', input: 'date', label: 'Date', valueStartPercent: 40 },
      { field: 'breed', input: 'text', label: 'Breed', placeholder: ' ', valueStartPercent: 38 },
      { field: 'gender', input: 'text', label: 'Gender', placeholder: ' ', valueStartPercent: 50 },
      { field: 'weight', input: 'text', label: 'Weight', placeholder: ' ', valueStartPercent: 40 },
      { field: 'client', input: 'text', label: 'Client', placeholder: ' ', autoComplete: 'name', valueStartPercent: 48 },
      { field: 'age', input: 'text', label: 'Age', placeholder: ' ', valueStartPercent: 28 },
      { type: 'spacer' },
    ]),
  },
  {
    id: 'services',
    type: 'servicesRadio',
    boxPercent: BOX.services,
    checkSlots: freezeServiceCheckSlots(),
    otherText: Object.freeze({
      field: 'serviceOther',
      box: SERVICE_OTHER_BOX,
    }),
  },
  {
    id: 'health',
    type: 'healthBlock',
    boxPercent: BOX.health,
    rows: Object.freeze([
      {
        kind: 'conditionRadio',
        rowLabel: 'Coat',
        inputName: 'coat',
        stateKey: 'coat',
        radiogroupLabel: 'Coat condition',
        markSlots: freezeHealthMarks(COAT_MARK_ABS, COAT_STRIP),
      },
      {
        kind: 'conditionRadio',
        rowLabel: 'Skin',
        inputName: 'skin',
        stateKey: 'skin',
        radiogroupLabel: 'Skin condition',
        markSlots: freezeHealthMarks(SKIN_MARK_ABS, SKIN_STRIP),
      },
      {
        kind: 'behaviorRadio',
        rowLabel: 'Behavior',
        inputName: 'behavior',
        stateKey: 'behavior',
        otherField: 'behaviorOther',
        radiogroupLabel: 'Behavior',
        markSlots: freezeHealthMarks(BEH_MARK_ABS, BEH_STRIP),
        otherText: Object.freeze({
          field: 'behaviorOther',
          /** 相对整块 health 区域（与 layout HUD 整图位图对齐）；勿用 strips.beh — flex 行高会与位图不一致导致错位 */
          box: innerPxToLocalPercent(shiftMarkRect(BEHAVIOR_OTHER_ABS), REGION_RECT_PX.health, {
            clampDimsToPctOfRegion: false,
          }),
        }),
      },
      {
        kind: 'textarea',
        field: 'healthNotes',
        label: 'Notes',
        rows: 2,
      },
    ]),
  },
  {
    id: 'groomer',
    type: 'textArea',
    boxPercent: BOX.groomer,
    field: 'groomerNotes',
    label: 'Groomer notes and recommendations',
    rows: 3,
    className: 'area-input--tall',
    /** 输入区从印刷标题右侧起；顶缘略下移避开标题行（相对 groomer 外框 %） */
    valueStartPercent: 52,
    valueTopPercent: 22,
  },
  {
    id: 'footer',
    type: 'lineInput',
    boxPercent: BOX.footer,
    field: 'nextAppointment',
    label: 'Next appointment',
    className: 'line-input--appointment',
    placeholder: ' ',
    /** 相对 footer 区宽：略增使输入起点向右约两个英文字宽，对齐底图下划线 */
    valueStartPercent: 58,
  },
  /**
   * 须排在最后：同尺寸全幅透明层若先画会被 health 等区块盖住，照片槽无法点击（表现为「没变化」）。
   */
  {
    id: 'photos',
    type: 'photoSlots',
    boxPercent: { top: 0, left: 0, width: 100, height: 100 },
    overlayPassThrough: true,
    slots: PHOTO_REGION_SLOTS,
  },
])

export function mergePxRect(base, patch) {
  if (!patch) return base
  return { ...base, ...patch }
}

/** 某个槽在底图上的像素矩形（合并布局微调 marks[`photo:${id}`]） */
export function photoSlotRectPx(category, which, marks = null) {
  for (const s of PHOTO_UPLOAD_SLOTS_PX) {
    if (s.category === category && s.which === which) {
      const patch = marks && typeof marks === 'object' ? marks[`photo:${s.id}`] : null
      return mergePxRect({ ...s.rectPx }, patch)
    }
  }
  return null
}

/** 与模板该槽白框相同的宽÷高（裁图与界面铺满一致）；传入 layoutOverrides 时使用微调后的槽尺寸 */
export function aspectRatioForPhotoSlot(category, which, layoutOverrides = null) {
  const marks = layoutOverrides?.marks
  const r = photoSlotRectPx(category, which, marks)
  return r ? r.w / r.h : PHOTO_SLOT_ASPECT
}

function freezePhotoSlotsWithPatches(markPatch) {
  const mp = markPatch && typeof markPatch === 'object' ? markPatch : {}
  return Object.freeze(
    PHOTO_UPLOAD_SLOTS_PX.map((s) => ({
      id: s.id,
      category: s.category,
      which: s.which,
      rectPx: mergePxRect({ ...s.rectPx }, mp[`photo:${s.id}`]),
    })),
  )
}

/**
 * Behavior 条纹理高度相对「当前 merged health 外框」高度的比值（无量纲）。
 * 用于 CSS：`height = 100cqh * ratio`，使 Other 手写区的 %top 与 templateRegions 中 strips.beh 一致。
 */
export function healthStripHeightRatio(healthMergedPx, stripHPx) {
  const h = healthMergedPx?.h
  const fb = stripHPx / REGION_RECT_PX.health.h
  if (!h || !Number.isFinite(h) || h <= 0 || !Number.isFinite(stripHPx) || stripHPx <= 0) return fb
  return stripHPx / h
}

export function healthBehaviorStripHeightRatio(healthMergedPx) {
  return healthStripHeightRatio(healthMergedPx, HEALTH_BEHAVIOR_STRIP_H_PX)
}


/** 合并用户 region 微调后的整块位图矩形（供 HUD / 字段 % 换算） */
export function getMergedRegionRectsPx(overrides) {
  const regPatch = overrides?.regions && typeof overrides.regions === 'object' ? overrides.regions : {}
  return {
    header: mergePxRect(REGION_RECT_PX.header, regPatch.header),
    services: mergePxRect(REGION_RECT_PX.services, regPatch.services),
    health: mergePxRect(REGION_RECT_PX.health, regPatch.health),
    groomer: mergePxRect(REGION_RECT_PX.groomer, regPatch.groomer),
    footer: mergePxRect(REGION_RECT_PX.footer, regPatch.footer),
  }
}

function resolveMarkRect(baseRect, patch) {
  if (!patch) return baseRect
  return { ...baseRect, ...patch }
}

/** Health 行条：随 health 外框整体平移时，保持与底图行距（相对默认 health.y）。`stripPatches` 为布局微调里整行框架（与 Services 调区域同理）。 */
function deriveHealthStripsPx(Hpx, stripPatches = {}) {
  const baseY = REGION_RECT_PX.health.y
  const sp = stripPatches && typeof stripPatches === 'object' ? stripPatches : {}
  const base = {
    coat: {
      x: Hpx.x + HEALTH_LABEL_W,
      y: Hpx.y + (304 - baseY),
      w: Hpx.w - HEALTH_LABEL_W,
      h: COAT_STRIP.h,
    },
    skin: {
      x: Hpx.x + HEALTH_LABEL_W,
      y: Hpx.y + (344 - baseY),
      w: Hpx.w - HEALTH_LABEL_W,
      h: SKIN_STRIP.h,
    },
    beh: {
      x: Hpx.x + HEALTH_LABEL_W,
      y: Hpx.y + (384 - baseY),
      w: Hpx.w - HEALTH_LABEL_W,
      h: BEH_STRIP.h,
    },
  }
  return {
    coat: mergePxRect(base.coat, sp.coat),
    skin: mergePxRect(base.skin, sp.skin),
    beh: mergePxRect(base.beh, sp.beh),
  }
}

function serviceSlotsFromRects(svcRegionPx, markPatches) {
  return Object.freeze(
    SERVICE_MARK_ABS.map(({ key, rect }) => {
      const r = resolveMarkRect(rect, markPatches[`svc:${key}`])
      return {
        key,
        box: innerPxToLocalPercent(shiftMarkRect(r), svcRegionPx),
      }
    }),
  )
}

function healthMarkSlots(absList, stripPx, prefix, markPatches) {
  return Object.freeze(
    absList.map(({ key, rect }) => {
      const r = resolveMarkRect(rect, markPatches[`${prefix}:${key}`])
      return {
        key,
        box: innerPxToLocalPercent(shiftMarkRect(r), stripPx),
      }
    }),
  )
}

/**
 * @param {null|undefined|{ regions?: object, marks?: object, strips?: object }} overrides
 * @returns {typeof EDITABLE_REGIONS}
 */
export function rebuildEditableRegionsWithOverrides(overrides) {
  if (!overrides || typeof overrides !== 'object') return EDITABLE_REGIONS

  const regPatch = overrides.regions && typeof overrides.regions === 'object' ? overrides.regions : {}
  const markPatch = overrides.marks && typeof overrides.marks === 'object' ? overrides.marks : {}
  const stripPatch = overrides.strips && typeof overrides.strips === 'object' ? overrides.strips : {}
  if (
    Object.keys(regPatch).length === 0 &&
    Object.keys(markPatch).length === 0 &&
    Object.keys(stripPatch).length === 0
  ) {
    return EDITABLE_REGIONS
  }

  const reg = getMergedRegionRectsPx(overrides)

  const BOXm = {
    header: pxRectToBoxPercent(reg.header),
    services: pxRectToBoxPercent(reg.services),
    health: pxRectToBoxPercent(reg.health),
    groomer: pxRectToBoxPercent(reg.groomer),
    footer: pxRectToBoxPercent(reg.footer),
  }

  const strips = deriveHealthStripsPx(reg.health, stripPatch)

  const svcOtherAbs = resolveMarkRect(SERVICE_OTHER_ABS, markPatch.svcOther)
  const behOtherAbs = resolveMarkRect(BEHAVIOR_OTHER_ABS, markPatch.behOther)

  const healthRows = Object.freeze([
    {
      kind: 'conditionRadio',
      rowLabel: 'Coat',
      inputName: 'coat',
      stateKey: 'coat',
      radiogroupLabel: 'Coat condition',
      markSlots: healthMarkSlots(COAT_MARK_ABS, strips.coat, 'coat', markPatch),
    },
    {
      kind: 'conditionRadio',
      rowLabel: 'Skin',
      inputName: 'skin',
      stateKey: 'skin',
      radiogroupLabel: 'Skin condition',
      markSlots: healthMarkSlots(SKIN_MARK_ABS, strips.skin, 'skin', markPatch),
    },
    {
      kind: 'behaviorRadio',
      rowLabel: 'Behavior',
      inputName: 'behavior',
      stateKey: 'behavior',
      otherField: 'behaviorOther',
      radiogroupLabel: 'Behavior',
      markSlots: healthMarkSlots(BEH_MARK_ABS, strips.beh, 'beh', markPatch),
      otherText: Object.freeze({
        field: 'behaviorOther',
        box: innerPxToLocalPercent(shiftMarkRect(behOtherAbs), reg.health, { clampDimsToPctOfRegion: false }),
      }),
    },
    {
      kind: 'textarea',
      field: 'healthNotes',
      label: 'Notes',
      rows: 2,
    },
  ])

  return Object.freeze([
    {
      id: 'header',
      type: 'headerGrid',
      boxPercent: BOXm.header,
      columns: 2,
      rows: 4,
      cells: EDITABLE_REGIONS[0].cells,
    },
    {
      id: 'services',
      type: 'servicesRadio',
      boxPercent: BOXm.services,
      checkSlots: serviceSlotsFromRects(reg.services, markPatch),
      otherText: Object.freeze({
        field: 'serviceOther',
        box: innerPxToLocalPercent(shiftMarkRect(svcOtherAbs), reg.services, {
          clampDimsToPctOfRegion: false,
        }),
      }),
    },
    {
      id: 'health',
      type: 'healthBlock',
      boxPercent: BOXm.health,
      rows: healthRows,
    },
    {
      id: 'groomer',
      type: 'textArea',
      boxPercent: BOXm.groomer,
      field: 'groomerNotes',
      label: 'Groomer notes and recommendations',
      rows: 3,
      className: 'area-input--tall',
      valueStartPercent: 52,
      valueTopPercent: 22,
    },
    {
      id: 'footer',
      type: 'lineInput',
      boxPercent: BOXm.footer,
      field: 'nextAppointment',
      label: 'Next appointment',
      className: 'line-input--appointment',
      placeholder: ' ',
      valueStartPercent: 58,
    },
    {
      id: 'photos',
      type: 'photoSlots',
      boxPercent: { top: 0, left: 0, width: 100, height: 100 },
      overlayPassThrough: true,
      slots: freezePhotoSlotsWithPatches(markPatch),
    },
  ])
}

/** 页眉 7 格默认矩形（位图），供布局微调起点 */
export const HEADER_GRID_FIELDS = Object.freeze([
  'petName',
  'date',
  'breed',
  'gender',
  'weight',
  'client',
  'age',
])

export function baselineHeaderFieldRects(headerPx = REGION_RECT_PX.header) {
  const { x, y, w, h } = headerPx
  const cw = w / 2
  const rh = h / 4
  const out = {}
  HEADER_GRID_FIELDS.forEach((f, i) => {
    const row = i >> 1
    const col = i & 1
    out[f] = {
      x: Math.round(x + col * cw + 4),
      y: Math.round(y + row * rh + 2),
      w: Math.round(cw - 10),
      h: Math.round(rh - 5),
    }
  })
  return out
}

export function baselineHealthNotesRect(healthPx = REGION_RECT_PX.health) {
  const { x, y, w, h } = healthPx
  return {
    x: Math.round(x + 8),
    y: Math.round(y + h * 0.5),
    w: Math.round(w - 16),
    h: Math.round(h * 0.38),
  }
}

export function baselineGroomerFieldRect(gPx = REGION_RECT_PX.groomer) {
  const { x, y, w, h } = gPx
  return {
    x: Math.round(x + w * 0.06),
    y: Math.round(y + h * 0.2),
    w: Math.round(w * 0.9),
    h: Math.round(h * 0.72),
  }
}

export function baselineFooterFieldRect(fPx = REGION_RECT_PX.footer) {
  const { x, y, w, h } = fPx
  return {
    x: Math.round(x + w * 0.32),
    y: Math.round(y + h * 0.28),
    w: Math.round(w * 0.62),
    h: Math.round(h * 0.5),
  }
}

/**
 * 将字段位图矩形转为「相对父 region」的 % 样式（用于 position:absolute）
 */
export function fieldBmpToInsetStyle(fieldBmp, parentBmp) {
  const left = ((fieldBmp.x - parentBmp.x) / parentBmp.w) * 100
  const top = ((fieldBmp.y - parentBmp.y) / parentBmp.h) * 100
  const width = (fieldBmp.w / parentBmp.w) * 100
  const height = (fieldBmp.h / parentBmp.h) * 100
  return {
    position: 'absolute',
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`,
    boxSizing: 'border-box',
  }
}

/**
 * @param {object} fieldBmpOverrides  field -> {x,y,w,h}
 * @param {ReturnType<typeof mergePxRect>} mergedRegions 已合并后的 region 像素矩形
 */
/** 生成布局微调 HUD 所需的全部「当前位图矩形」列表 */
export function flattenLayoutSnapshotForHud(layoutOverrides) {
  const reg = getMergedRegionRectsPx(layoutOverrides ?? {})
  const marks = layoutOverrides?.marks && typeof layoutOverrides.marks === 'object' ? layoutOverrides.marks : {}
  const fields = layoutOverrides?.fields && typeof layoutOverrides.fields === 'object' ? layoutOverrides.fields : {}

  const list = []
  const regLabels = {
    header: '区域: 页眉 Header',
    services: '区域: Services',
    health: '区域: Health',
    groomer: '区域: Groomer',
    footer: '区域: Footer',
  }
  for (const id of ['header', 'services', 'health', 'groomer', 'footer']) {
    list.push({ id: `region:${id}`, kind: 'region', label: regLabels[id], bmp: { ...reg[id] } })
  }

  const svcOpt = SERVICE_OPTIONS
  for (const o of svcOpt) {
    const base = SERVICE_MARK_ABS.find((e) => e.key === o.value)?.rect
    if (base) {
      const id = `svc:${o.value}`
      list.push({
        id,
        kind: 'mark',
        label: `选项: ${o.label}`,
        bmp: { ...base, ...marks[id] },
      })
    }
  }
  list.push({
    id: 'svcOther',
    kind: 'mark',
    label: '手写: Service Other',
    bmp: { ...SERVICE_OTHER_ABS, ...marks.svcOther },
  })

  const stripPatches =
    layoutOverrides?.strips && typeof layoutOverrides.strips === 'object' ? layoutOverrides.strips : {}
  const stripsHud = deriveHealthStripsPx(reg.health, stripPatches)
  list.push(
    {
      id: 'strip:coat',
      kind: 'strip',
      label: 'Health 行框: Coat（整行点选区，同 Services 调框架）',
      bmp: { ...stripsHud.coat },
    },
    {
      id: 'strip:skin',
      kind: 'strip',
      label: 'Health 行框: Skin（整行点选区）',
      bmp: { ...stripsHud.skin },
    },
    {
      id: 'strip:beh',
      kind: 'strip',
      label: 'Health 行框: Behavior（整行点选区）',
      bmp: { ...stripsHud.beh },
    },
  )
  list.push({
    id: 'behOther',
    kind: 'mark',
    label: '手写: Behavior Other',
    bmp: { ...BEHAVIOR_OTHER_ABS, ...marks.behOther },
  })

  const baseHdr = baselineHeaderFieldRects(reg.header)
  for (const f of HEADER_GRID_FIELDS) {
    list.push({
      id: `field:${f}`,
      kind: 'field',
      label: `输入: ${f}`,
      bmp: { ...baseHdr[f], ...fields[f] },
    })
  }
  list.push({
    id: 'field:healthNotes',
    kind: 'field',
    label: '输入: Health notes',
    bmp: { ...baselineHealthNotesRect(reg.health), ...fields.healthNotes },
  })
  list.push({
    id: 'field:groomerNotes',
    kind: 'field',
    label: '输入: Groomer notes',
    bmp: { ...baselineGroomerFieldRect(reg.groomer), ...fields.groomerNotes },
  })
  list.push({
    id: 'field:nextAppointment',
    kind: 'field',
    label: '输入: Next appointment',
    bmp: { ...baselineFooterFieldRect(reg.footer), ...fields.nextAppointment },
  })

  for (const s of PHOTO_UPLOAD_SLOTS_PX) {
    const pid = `photo:${s.id}`
    list.push({
      id: pid,
      kind: 'photo',
      label: `照片槽 ${s.id}`,
      bmp: mergePxRect({ ...s.rectPx }, marks[pid]),
    })
  }

  return list
}

export function emptyLayoutOverrides() {
  return { version: 1, regions: {}, marks: {}, fields: {}, strips: {} }
}

export function buildFieldLayoutStyles(fieldBmpOverrides, mergedRegions) {
  if (!fieldBmpOverrides || typeof fieldBmpOverrides !== 'object') return null
  const hp = mergedRegions.header
  const hep = mergedRegions.health
  const gp = mergedRegions.groomer
  const fp = mergedRegions.footer

  const baseHeader = baselineHeaderFieldRects(hp)
  const styles = {}
  const touchedHeaderField = HEADER_GRID_FIELDS.some((f) => Boolean(fieldBmpOverrides[f]))
  if (touchedHeaderField) {
    for (const f of HEADER_GRID_FIELDS) {
      const bmp = { ...baseHeader[f], ...(fieldBmpOverrides[f] || {}) }
      styles[f] = fieldBmpToInsetStyle(bmp, hp)
    }
  }
  if (fieldBmpOverrides.healthNotes) {
    const bmp = { ...baselineHealthNotesRect(hep), ...fieldBmpOverrides.healthNotes }
    styles.healthNotes = fieldBmpToInsetStyle(bmp, hep)
  }
  if (fieldBmpOverrides.groomerNotes) {
    const bmp = { ...baselineGroomerFieldRect(gp), ...fieldBmpOverrides.groomerNotes }
    styles.groomerNotes = fieldBmpToInsetStyle(bmp, gp)
  }
  if (fieldBmpOverrides.nextAppointment) {
    const bmp = { ...baselineFooterFieldRect(fp), ...fieldBmpOverrides.nextAppointment }
    styles.nextAppointment = fieldBmpToInsetStyle(bmp, fp)
  }
  return Object.keys(styles).length ? styles : null
}

export function defaultCheckboxGroupsState() {
  const out = {}
  for (const r of EDITABLE_REGIONS) {
    if (r.type !== 'checkboxGroup') continue
    out[r.groupId] = Object.fromEntries(r.options.map((o) => [o.key, false]))
  }
  return out
}

export function mergeCheckboxGroupsState(raw) {
  const defaults = defaultCheckboxGroupsState()
  if (!raw || typeof raw !== 'object') return defaults
  const merged = {}
  for (const gid of Object.keys(defaults)) {
    const layer = { ...defaults[gid], ...(raw[gid] && typeof raw[gid] === 'object' ? raw[gid] : {}) }
    merged[gid] = Object.fromEntries(
      Object.keys(defaults[gid]).map((k) => [k, Boolean(layer[k])]),
    )
  }
  return merged
}
