import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useMarginRowMenu } from '~/pages/Swap/Margin/hooks/marginRowMenuStore'

const ROW_A = '0x000000000000000000000000000000000000000A'
const ROW_B = '0x000000000000000000000000000000000000000B'

describe('useMarginRowMenu', () => {
  beforeEach(() => {
    // Module singleton — reset between cases or state leaks across them. Claim the single slot before
    // releasing it: closing is identity-checked, so closing ROW_A while ROW_B holds the slot is a no-op
    // and the leak survives.
    const { result } = renderHook(() => useMarginRowMenu(ROW_A))
    act(() => result.current.setOpen(true))
    act(() => result.current.setOpen(false))
  })

  it('starts closed', () => {
    const { result } = renderHook(() => useMarginRowMenu(ROW_A))
    expect(result.current.isOpen).toBe(false)
  })

  it('opens only the row it was asked for', () => {
    const a = renderHook(() => useMarginRowMenu(ROW_A))
    const b = renderHook(() => useMarginRowMenu(ROW_B))
    act(() => a.result.current.setOpen(true))
    expect(a.result.current.isOpen).toBe(true)
    expect(b.result.current.isOpen).toBe(false)
  })

  // The store's stated invariant: at most one open at a time, across every row.
  it('closes the previously open row when another opens', () => {
    const a = renderHook(() => useMarginRowMenu(ROW_A))
    const b = renderHook(() => useMarginRowMenu(ROW_B))
    act(() => a.result.current.setOpen(true))
    act(() => b.result.current.setOpen(true))
    expect(a.result.current.isOpen).toBe(false)
    expect(b.result.current.isOpen).toBe(true)
  })

  it('closing a row clears the store rather than leaving it pointed elsewhere', () => {
    const a = renderHook(() => useMarginRowMenu(ROW_A))
    const b = renderHook(() => useMarginRowMenu(ROW_B))
    act(() => a.result.current.setOpen(true))
    act(() => a.result.current.setOpen(false))
    expect(a.result.current.isOpen).toBe(false)
    expect(b.result.current.isOpen).toBe(false)
  })

  // Every mounted ContextMenu registers a document-level outside-click listener whether or not that
  // instance is open, so a CLOSED sibling can call setOpen(false) while another row's menu is up. An
  // unconditional clear would dismiss the open popover before the clicked item's own click lands —
  // invisible to a single-instance test, and the ordinary case once table + drawer are both mounted.
  it('ignores a close from a row that does not own the open menu', () => {
    const a = renderHook(() => useMarginRowMenu(ROW_A))
    const b = renderHook(() => useMarginRowMenu(ROW_B))
    act(() => a.result.current.setOpen(true))

    act(() => b.result.current.setOpen(false))

    expect(a.result.current.isOpen).toBe(true)
    expect(b.result.current.isOpen).toBe(false)
  })

  it('keeps setOpen referentially stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useMarginRowMenu(ROW_A))
    const first = result.current.setOpen
    rerender()
    expect(result.current.setOpen).toBe(first)
  })

  // The reset itself, in the only order that can catch it: the first case deliberately ends with a row
  // OTHER than the one beforeEach names still open.
  describe('reset between cases', () => {
    it('can end a case with ROW_B holding the slot', () => {
      const b = renderHook(() => useMarginRowMenu(ROW_B))
      act(() => b.result.current.setOpen(true))
      expect(b.result.current.isOpen).toBe(true)
    })

    it('starts the next case with no row open at all', () => {
      const b = renderHook(() => useMarginRowMenu(ROW_B))
      expect(b.result.current.isOpen).toBe(false)
    })
  })
})
