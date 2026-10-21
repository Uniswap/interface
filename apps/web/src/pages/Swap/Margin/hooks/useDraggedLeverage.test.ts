import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { MarginMarket } from '~/constants/margin'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { useDraggedLeverage } from '~/pages/Swap/Margin/hooks/useDraggedLeverage'
import { MANAGE_MIN_LEVERAGE } from '~/pages/Swap/Margin/marginOpenButtonGate'

const MARKET = getDefaultMarginMarket() // maxLeverage 5
const capped = (maxLeverage: number): MarginMarket => ({ ...MARKET, maxLeverage })

describe('useDraggedLeverage', () => {
  it('clamps an explicit target to the venue ceiling and floors it at the minimum', () => {
    const { result } = renderHook(() => useDraggedLeverage({ market: MARKET }))
    act(() => result.current.setExplicitLeverage(9))
    expect(result.current.draggedLeverage).toBe(5)
    // MANAGE_MIN_LEVERAGE, not 1: a manage target of exactly 1x is a full deleverage the backend refuses.
    act(() => result.current.setExplicitLeverage(0.1))
    expect(result.current.draggedLeverage).toBe(MANAGE_MIN_LEVERAGE)
  })

  // The rule this hook exists for. A markets poll can lower the ceiling under an open sheet, and the
  // STORED value is what the quote request reads — so a target left above the new ceiling is one the
  // backend refuses. Both manage sheets spelled this separately, and only one of them had it.
  it('re-clamps a stored target when a poll lowers the venue ceiling', () => {
    const { result, rerender } = renderHook(({ market }) => useDraggedLeverage({ market }), {
      initialProps: { market: MARKET },
    })
    act(() => result.current.setExplicitLeverage(4))
    expect(result.current.draggedLeverage).toBe(4)

    rerender({ market: capped(3) })
    expect(result.current.draggedLeverage).toBe(3)
  })

  // A market publishing NO ceiling floors `cap` to the minimum. Clamping against that would drop the
  // slider to 1x with no way back, so absence of a ceiling must not be read as a low one.
  it('leaves a stored target alone when the market publishes no ceiling', () => {
    const { result, rerender } = renderHook(({ market }) => useDraggedLeverage({ market }), {
      initialProps: { market: MARKET },
    })
    act(() => result.current.setExplicitLeverage(4))

    rerender({ market: { ...MARKET, maxLeverage: undefined } as unknown as MarginMarket })
    expect(result.current.draggedLeverage).toBe(4)
  })

  // The other half of the same rule: absence of a ceiling must not bound a value the user CHOSE
  // either. Clamping to the floored `cap` snapped every commit to 1.10x — the "no way back" the
  // stored-target case above exists to prevent, reached through the numeric field instead.
  it('imposes no ceiling on an explicit target when the market publishes none', () => {
    const { result } = renderHook(() =>
      useDraggedLeverage({ market: { ...MARKET, maxLeverage: undefined } as unknown as MarginMarket }),
    )
    act(() => result.current.setExplicitLeverage(5))
    expect(result.current.draggedLeverage).toBe(5)
  })

  it('commits a parseable draft and discards one that is blank or not a number', () => {
    const { result } = renderHook(() => useDraggedLeverage({ market: MARKET }))
    act(() => result.current.setLeverageDraft('3'))
    act(() => result.current.commitLeverageDraft())
    expect(result.current.draggedLeverage).toBe(3)
    expect(result.current.leverageDraft).toBeUndefined()

    for (const draft of ['', 'abc', '0']) {
      act(() => result.current.setLeverageDraft(draft))
      act(() => result.current.commitLeverageDraft())
      // An abandoned edit leaves the slider where the user last put it, never at zero.
      expect(result.current.draggedLeverage).toBe(3)
    }
  })

  it('reports an explicit change so a sheet can release its hold-leverage toggle', () => {
    const onExplicitChange = vi.fn()
    const { result } = renderHook(() => useDraggedLeverage({ market: MARKET, onExplicitChange }))
    act(() => result.current.onSliderChange(3))
    expect(onExplicitChange).toHaveBeenCalled()
  })

  it('clears both the stored target and the draft together', () => {
    const { result } = renderHook(() => useDraggedLeverage({ market: MARKET }))
    act(() => result.current.setExplicitLeverage(4))
    act(() => result.current.setLeverageDraft('2'))
    act(() => result.current.clearDraggedLeverage())
    expect(result.current.draggedLeverage).toBeUndefined()
    expect(result.current.leverageDraft).toBeUndefined()
  })
})
