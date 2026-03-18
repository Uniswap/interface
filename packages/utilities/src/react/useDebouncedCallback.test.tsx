import { act, renderHook } from '@testing-library/react'
import { useDebouncedCallback } from 'utilities/src/react/useDebouncedCallback'
import { vi } from 'vitest'

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should debounce the callback and only execute after delay period', async () => {
    const callback = vi.fn()
    const { result, rerender } = renderHook(() => useDebouncedCallback(callback, 1000))

    // Multiple rapid calls should not execute the callback immediately
    act(() => {
      result.current[0]('arg1')
      result.current[0]('arg2')
      result.current[0]('arg3')
      result.current[0]('arg4')
    })

    // Callback should not have been called yet
    expect(callback).toHaveBeenCalledTimes(0)
    expect(result.current[1]).toBe(true) // isPending should be true

    // Advance time by less than delay - callback still shouldn't execute
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(callback).toHaveBeenCalledTimes(0)
    expect(result.current[1]).toBe(true) // Still pending

    // Advance time to complete the delay and run all timers
    await act(async () => {
      vi.advanceTimersByTime(500)
      await vi.runAllTimersAsync()
    })

    // Force a rerender to get updated state
    rerender()

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenLastCalledWith('arg4')
    expect(result.current[1]).toBe(false)
  })

  it('should reset the timer when called again before delay completes', async () => {
    const callback = vi.fn()
    const { result, rerender } = renderHook(() => useDebouncedCallback(callback, 1000))
    const [debouncedCallback] = result.current

    // First call
    act(() => {
      debouncedCallback('first')
    })
    expect(result.current[1]).toBe(true)

    // Advance time partially
    act(() => {
      vi.advanceTimersByTime(800)
    })
    expect(callback).toHaveBeenCalledTimes(0)

    // Call again before delay completes - should reset timer
    act(() => {
      debouncedCallback('second')
    })

    // Advance time by 800ms again (less than full delay from second call)
    act(() => {
      vi.advanceTimersByTime(800)
    })
    expect(callback).toHaveBeenCalledTimes(0) // Still not called

    // Complete the delay from second call and run all timers
    await act(async () => {
      vi.advanceTimersByTime(200)
      await vi.runAllTimersAsync()
    })

    // Force a rerender to get updated state
    rerender()

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenLastCalledWith('second')
  })

  it('should handle async callbacks and errors properly', async () => {
    const asyncCallback = vi.fn().mockRejectedValue(new Error('Test error'))
    const { result, rerender } = renderHook(() => useDebouncedCallback(asyncCallback, 500))
    const [debouncedCallback] = result.current

    act(() => {
      debouncedCallback()
    })

    expect(result.current[1]).toBe(true)

    // Complete the delay and run all timers
    await act(async () => {
      vi.advanceTimersByTime(500)
      await vi.runAllTimersAsync()
    })

    rerender()

    expect(asyncCallback).toHaveBeenCalledTimes(1)
    expect(result.current[1]).toBe(false)
  })

  it('should clean up timeout on unmount', async () => {
    const callback = vi.fn()
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 1000))
    const [debouncedCallback] = result.current

    act(() => {
      debouncedCallback()
    })

    unmount()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('should handle multiple arguments correctly with latest call winning', async () => {
    const callback = vi.fn()
    const { result, rerender } = renderHook(() => useDebouncedCallback(callback, 100))
    const [debouncedCallback] = result.current

    act(() => {
      debouncedCallback('first', 1)
      debouncedCallback('second', 2)
      debouncedCallback('third', 3)
    })

    await act(async () => {
      vi.advanceTimersByTime(100)
      await vi.runAllTimersAsync()
    })

    rerender()

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenLastCalledWith('third', 3)
  })

  it('should handle async callbacks correctly', async () => {
    const asyncCallback = vi.fn().mockResolvedValue('result')
    const { result, rerender } = renderHook(() => useDebouncedCallback(asyncCallback, 100))
    const [debouncedCallback] = result.current

    act(() => {
      debouncedCallback('test')
    })

    await act(async () => {
      vi.advanceTimersByTime(100)
      await vi.runAllTimersAsync()
    })

    rerender()

    expect(asyncCallback).toHaveBeenCalledWith('test')
    expect(result.current[1]).toBe(false)
  })

  it('should maintain pending state correctly throughout debounce cycle', async () => {
    const callback = vi.fn()
    const { result, rerender } = renderHook(() => useDebouncedCallback(callback, 1000))
    const [debouncedCallback] = result.current

    // Initially not pending
    expect(result.current[1]).toBe(false)

    // After call, should be pending
    act(() => {
      debouncedCallback()
    })
    expect(result.current[1]).toBe(true)

    // Multiple calls should maintain pending state
    act(() => {
      debouncedCallback()
      debouncedCallback()
    })
    expect(result.current[1]).toBe(true)

    // After timeout completes, should no longer be pending
    await act(async () => {
      vi.advanceTimersByTime(1000)
      await vi.runAllTimersAsync()
    })

    rerender()

    expect(result.current[1]).toBe(false)
  })
})
