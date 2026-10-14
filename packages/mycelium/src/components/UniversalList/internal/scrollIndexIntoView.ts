/** The slice of the engine's `getState()` that placing an item needs; structural so both legs share it. */
export interface ScrollIntoViewState {
  /** Current scroll offset. */
  scroll: number
  /** Viewport length along the scroll axis. */
  scrollLength: number
  positionAtIndex: (index: number) => number
  /** Undefined until the engine has measured the item. */
  sizeAtIndex: (index: number) => number | undefined
}

export interface ScrollIntoViewAlignment {
  viewPosition: 0 | 1
  viewOffset?: number
}

/**
 * Nearest-edge alignment for `scrollToIndex`, or undefined when the item is already fully visible.
 *
 * Decided from pixels, not the engine's own into-view check, which counts an item as visible while
 * any part of it intersects the viewport. `viewOffset` reserves that many pixels at the top, e.g. for
 * a sticky header that would otherwise pin over the item once it is scrolled there.
 */
export function resolveScrollIntoView({
  state,
  index,
  viewOffset = 0,
}: {
  state: ScrollIntoViewState
  index: number
  viewOffset?: number
}): ScrollIntoViewAlignment | undefined {
  const top = state.positionAtIndex(index) - state.scroll
  const size = state.sizeAtIndex(index)
  // Unmeasured means far outside the rendered window: a jump, so land it under the reserved band.
  if (size === undefined || top < viewOffset) {
    return { viewPosition: 0, viewOffset }
  }
  if (top + size > state.scrollLength) {
    return { viewPosition: 1 }
  }
  return undefined
}
