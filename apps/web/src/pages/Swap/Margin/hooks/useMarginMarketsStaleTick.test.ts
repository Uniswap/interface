import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MARGIN_MARKETS_REFETCH_MS } from '~/constants/margin'
import { useMarginMarketsStaleTick } from '~/pages/Swap/Margin/hooks/useMarginMarketsStaleTick'

// The bound this exists for compares against Date.now(), which only advances a RENDER. A successful
// poll re-renders on its own — but react-query stops fetching when the browser goes offline, and a
// failing refetch eventually stops changing state, which is exactly when a mark ages out.
describe('useMarginMarketsStaleTick', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('re-renders its host once per markets-poll interval with no other input', () => {
    let renders = 0
    renderHook(() => {
      renders += 1
      useMarginMarketsStaleTick()
    })
    const initial = renders

    act(() => void vi.advanceTimersByTime(MARGIN_MARKETS_REFETCH_MS * 2))

    expect(renders).toBeGreaterThan(initial)
  })

  it('stops ticking once unmounted', () => {
    let renders = 0
    const { unmount } = renderHook(() => {
      renders += 1
      useMarginMarketsStaleTick()
    })
    unmount()
    const afterUnmount = renders

    act(() => void vi.advanceTimersByTime(MARGIN_MARKETS_REFETCH_MS * 3))

    expect(renders).toBe(afterUnmount)
  })
})
