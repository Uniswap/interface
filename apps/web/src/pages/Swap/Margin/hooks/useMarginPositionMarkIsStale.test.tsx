import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MARGIN_POSITIONS_REFETCH_MS } from '~/constants/margin'
import { useMarginPositionMarkIsStale } from '~/pages/Swap/Margin/hooks/useMarginPositionMarkIsStale'

const { mockDataUpdatedAt } = vi.hoisted(() => ({ mockDataUpdatedAt: { current: 0 } }))

// The query is the seam: this hook's job is deciding when its `dataUpdatedAt` has aged out, not fetching.
vi.mock('uniswap/src/data/apiClients/tradingApi/useMarginPositionsQuery', () => ({
  useMarginPositionsQuery: () => ({ dataUpdatedAt: mockDataUpdatedAt.current }),
}))

vi.mock('~/hooks/useAccount', () => ({
  useAccount: () => ({ address: '0x00000000000000000000000000000000000000A1' }),
}))

describe('useMarginPositionMarkIsStale', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockDataUpdatedAt.current = Date.now()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reports fresh on a mark stamped by the last poll', () => {
    const { result } = renderHook(() => useMarginPositionMarkIsStale())
    expect(result.current).toBe(false)
  })

  // The case the caption exists for. react-query stops fetching when the browser goes offline, so the
  // query re-renders nothing — without a ticker of its own the threshold is never re-evaluated and the
  // sheet keeps presenting an aged mark as current. No query activity happens anywhere in this test.
  it('flips to stale on its own clock, with no poll to re-render it', () => {
    const { result } = renderHook(() => useMarginPositionMarkIsStale())
    expect(result.current).toBe(false)

    act(() => {
      vi.advanceTimersByTime(MARGIN_POSITIONS_REFETCH_MS * 3)
    })
    expect(result.current).toBe(true)
  })

  it('stops its ticker on unmount', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval')
    const { unmount } = renderHook(() => useMarginPositionMarkIsStale())
    unmount()
    expect(clearSpy).toHaveBeenCalled()
  })
})
