import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useScrollCompact } from '~/hooks/useScrollCompact'

let mockScrollY = 0
const mockListeners = new Set<() => void>()

vi.mock('~/state/scroll/scrollStore', () => ({
  getScrollY: () => mockScrollY,
  subscribe: (cb: () => void) => {
    mockListeners.add(cb)
    return () => mockListeners.delete(cb)
  },
}))

function simulateScroll(y: number): void {
  mockScrollY = y
  act(() => {
    mockListeners.forEach((cb) => cb())
  })
}

describe('useScrollCompact', () => {
  beforeEach(() => {
    mockScrollY = 0
    mockListeners.clear()
  })

  it('returns false initially', () => {
    const { result } = renderHook(() => useScrollCompact({}))
    expect(result.current).toBe(false)
  })

  it('becomes compact when scrolling past threshold', () => {
    const { result } = renderHook(() => useScrollCompact({}))
    expect(result.current).toBe(false)

    simulateScroll(150)
    expect(result.current).toBe(true)
  })

  it('maintains compact state in hysteresis zone', () => {
    const { result } = renderHook(() => useScrollCompact({}))

    simulateScroll(150)
    expect(result.current).toBe(true)

    // Should stay compact at 80px (between 60 and 120)
    simulateScroll(80)
    expect(result.current).toBe(true)
  })

  it('returns to expanded when scrolling below expanded threshold', () => {
    const { result } = renderHook(() => useScrollCompact({}))

    simulateScroll(150)
    expect(result.current).toBe(true)

    simulateScroll(50)
    expect(result.current).toBe(false)
  })

  it('respects custom thresholds', () => {
    const { result } = renderHook(() => useScrollCompact({ thresholdCompact: 200, thresholdExpanded: 100 }))

    simulateScroll(150)
    expect(result.current).toBe(false)

    simulateScroll(250)
    expect(result.current).toBe(true)

    simulateScroll(150)
    expect(result.current).toBe(true)

    simulateScroll(50)
    expect(result.current).toBe(false)
  })
})
