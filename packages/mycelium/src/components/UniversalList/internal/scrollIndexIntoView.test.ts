import { describe, expect, it } from 'vitest'
import { resolveScrollIntoView, type ScrollIntoViewState } from './scrollIndexIntoView'

// One 40px item per index in a 400px viewport scrolled to 200.
function state(overrides: Partial<ScrollIntoViewState> = {}): ScrollIntoViewState {
  return { scroll: 200, scrollLength: 400, positionAtIndex: (index) => index * 40, sizeAtIndex: () => 40, ...overrides }
}

describe('resolveScrollIntoView', () => {
  it('leaves a fully visible item alone', () => {
    expect(resolveScrollIntoView({ state: state(), index: 8 })).toBeUndefined()
  })

  it('aligns the top edge of an item above the viewport', () => {
    expect(resolveScrollIntoView({ state: state(), index: 4 })).toEqual({ viewPosition: 0, viewOffset: 0 })
  })

  it('aligns the bottom edge of an item cut off below, not only one fully outside', () => {
    // Index 14 spans 560..600 against a viewport ending at 600: visible. Index 15 starts at 600 minus 20: cut off.
    expect(resolveScrollIntoView({ state: state(), index: 14 })).toBeUndefined()
    expect(resolveScrollIntoView({ state: state({ positionAtIndex: () => 580 }), index: 15 })).toEqual({
      viewPosition: 1,
    })
  })

  it('treats the reserved top band as hidden and lands the item below it', () => {
    // Index 5 is at the viewport top (200): visible to the engine, but under a 40px sticky header.
    expect(resolveScrollIntoView({ state: state(), index: 5, viewOffset: 40 })).toEqual({
      viewPosition: 0,
      viewOffset: 40,
    })
    expect(resolveScrollIntoView({ state: state(), index: 6, viewOffset: 40 })).toBeUndefined()
  })

  it('jumps an unmeasured item under the reserved band', () => {
    expect(resolveScrollIntoView({ state: state({ sizeAtIndex: () => undefined }), index: 8, viewOffset: 40 })).toEqual(
      { viewPosition: 0, viewOffset: 40 },
    )
  })
})
