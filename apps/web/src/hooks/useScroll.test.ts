import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ScrollDirection, useScroll } from '~/hooks/useScroll'

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

describe('useScroll', () => {
  beforeEach(() => {
    mockScrollY = 0
    mockListeners.clear()
  })

  it('returns direction: undefined and isScrolledDown: false when scrollY is 0', () => {
    const { result } = renderHook(() => useScroll())

    expect(result.current.direction).toBeUndefined()
    expect(result.current.isScrolledDown).toBe(false)
  })

  it('returns isScrolledDown: true when initial scrollY is above 0', () => {
    mockScrollY = 100

    const { result } = renderHook(() => useScroll())

    expect(result.current.isScrolledDown).toBe(true)
  })

  it('sets direction DOWN and isScrolledDown: true when scrolling down from top', () => {
    const { result } = renderHook(() => useScroll())

    simulateScroll(50)

    expect(result.current.direction).toBe(ScrollDirection.DOWN)
    expect(result.current.isScrolledDown).toBe(true)
  })

  it('sets direction UP when scrolling back up', () => {
    const { result } = renderHook(() => useScroll())

    simulateScroll(100)
    simulateScroll(50)

    expect(result.current.direction).toBe(ScrollDirection.UP)
  })

  it('sets isScrolledDown: false when returning to the top', () => {
    const { result } = renderHook(() => useScroll())

    simulateScroll(100)
    expect(result.current.isScrolledDown).toBe(true)

    simulateScroll(0)
    expect(result.current.isScrolledDown).toBe(false)
  })

  it('preserves last direction when isScrolledDown changes but direction did not', () => {
    const { result } = renderHook(() => useScroll())

    simulateScroll(100)
    expect(result.current.direction).toBe(ScrollDirection.DOWN)

    simulateScroll(0)

    expect(result.current.direction).toBe(ScrollDirection.UP)
    expect(result.current.isScrolledDown).toBe(false)
  })

  it('unsubscribes from the store on unmount', () => {
    const { unmount } = renderHook(() => useScroll())

    expect(mockListeners.size).toBe(1)
    unmount()
    expect(mockListeners.size).toBe(0)
  })
})
