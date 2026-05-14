import { percentBoxToCss } from '../../utils/regionCoordinates'

/** Absolute %-positioned box within a `position: relative` region. */
export function templateMarkBoxStyle(box) {
  return {
    position: 'absolute',
    boxSizing: 'border-box',
    ...percentBoxToCss(box),
  }
}

/** Other 手写线：`templateMarkBoxStyle` + 与原 CSS 对齐的 margin。 */
export function otherTextPositionStyle(box) {
  return {
    ...templateMarkBoxStyle(box),
    margin: 0,
    borderRadius: 0,
  }
}
