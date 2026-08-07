import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSharedMachineTimeMs } from '~/hooks/useMachineTime'

describe('useSharedMachineTimeMs', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the same timestamp for every subscriber, including late mounts', () => {
    const first = renderHook(() => useSharedMachineTimeMs(1000))

    // Mount a second subscriber mid-interval — it must not start its own out-of-phase clock
    act(() => {
      vi.advanceTimersByTime(500)
    })
    const second = renderHook(() => useSharedMachineTimeMs(1000))

    expect(second.result.current).toBe(first.result.current)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(first.result.current).toBe(second.result.current)
  })

  it('ticks all subscribers together on the shared interval', () => {
    const start = Date.now()
    const first = renderHook(() => useSharedMachineTimeMs(1000))
    const second = renderHook(() => useSharedMachineTimeMs(1000))

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(first.result.current).toBe(start + 1000)
    expect(second.result.current).toBe(start + 1000)
  })

  it('stops the clock when the last subscriber unmounts and restarts it fresh', () => {
    const first = renderHook(() => useSharedMachineTimeMs(1000))
    first.unmount()

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    const start = Date.now()
    const second = renderHook(() => useSharedMachineTimeMs(1000))
    expect(second.result.current).toBe(start)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(second.result.current).toBe(start + 1000)
  })
})
