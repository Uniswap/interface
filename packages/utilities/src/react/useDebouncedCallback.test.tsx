import { waitFor } from '@testing-library/react'
import { act, renderHook } from '@testing-library/react-hooks'
import { useDebouncedCallback } from 'utilities/src/react/useDebouncedCallback'

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should debounce the callback and only execute after delay period', async () => {
    const callback = jest.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 1000))

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
      jest.advanceTimersByTime(500)
    })
    expect(callback).toHaveBeenCalledTimes(0)
    expect(result.current[1]).toBe(true) // Still pending

    // Advance time to complete the delay
    act(() => {
      jest.advanceTimersByTime(500)
    })

    // Wait for the async callback and state update to complete
    await waitFor(() => {
      expect(callback).toHaveBeenCalledTimes(1)
    })

    expect(callback).toHaveBeenLastCalledWith('arg4')

    // Wait for the pending state to update
    await waitFor(() => {
      expect(result.current[1]).toBe(false)
    })
  })

  it('should reset the timer when called again before delay completes', async () => {
    const callback = jest.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 1000))
    const [debouncedCallback] = result.current

    // First call
    act(() => {
      debouncedCallback('first')
    })
    expect(result.current[1]).toBe(true)

    // Advance time partially
    act(() => {
      jest.advanceTimersByTime(800)
    })
    expect(callback).toHaveBeenCalledTimes(0)

    // Call again before delay completes - should reset timer
    act(() => {
      debouncedCallback('second')
    })

    // Advance time by 800ms again (less than full delay from second call)
    act(() => {
      jest.advanceTimersByTime(800)
    })
    expect(callback).toHaveBeenCalledTimes(0) // Still not called

    // Complete the delay from second call
    act(() => {
      jest.advanceTimersByTime(200)
    })

    await waitFor(() => {
      expect(callback).toHaveBeenCalledTimes(1)
    })
    expect(callback).toHaveBeenLastCalledWith('second')
  })

  it('should handle async callbacks and errors properly', async () => {
    const asyncCallback = jest.fn().mockRejectedValue(new Error('Test error'))
    const { result } = renderHook(() => useDebouncedCallback(asyncCallback, 500))
    const [debouncedCallback] = result.current

    act(() => {
      debouncedCallback()
    })

    expect(result.current[1]).toBe(true)

    // Complete the delay
    act(() => {
      jest.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(asyncCallback).toHaveBeenCalledTimes(1)
    })

    // Wait for the pending state to update even after error
    await waitFor(() => {
      expect(result.current[1]).toBe(false)
    })
  })

  it('should clean up timeout on unmount', async () => {
    const callback = jest.fn()
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 1000))
    const [debouncedCallback] = result.current

    act(() => {
      debouncedCallback()
    })

    unmount()

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('should handle multiple arguments correctly with latest call winning', async () => {
    const callback = jest.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 100))
    const [debouncedCallback] = result.current

    act(() => {
      debouncedCallback('first', 1)
      debouncedCallback('second', 2)
      debouncedCallback('third', 3)
    })

    act(() => {
      jest.advanceTimersByTime(100)
    })

    await waitFor(() => {
      expect(callback).toHaveBeenCalledTimes(1)
    })
    expect(callback).toHaveBeenLastCalledWith('third', 3)
  })

  it('should handle async callbacks correctly', async () => {
    const asyncCallback = jest.fn().mockResolvedValue('result')
    const { result } = renderHook(() => useDebouncedCallback(asyncCallback, 100))
    const [debouncedCallback] = result.current

    act(() => {
      debouncedCallback('test')
    })

    act(() => {
      jest.advanceTimersByTime(100)
    })

    await waitFor(() => {
      expect(asyncCallback).toHaveBeenCalledWith('test')
    })

    await waitFor(() => {
      expect(result.current[1]).toBe(false)
    })
  })

  it('should maintain pending state correctly throughout debounce cycle', async () => {
    const callback = jest.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 1000))
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
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(result.current[1]).toBe(false)
    })
  })
})
