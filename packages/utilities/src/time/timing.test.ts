import { act, renderHook } from '@testing-library/react'
import {
  DEFAULT_DELAY,
  promiseMinDelay,
  promiseTimeout,
  useDebounceWithStatus,
  useInterval,
  useTimeout,
} from 'utilities/src/time/timing'
import { vi } from 'vitest'

vi.useFakeTimers()

const timedPromise = (duration: number, shouldResolve = true): Promise<string> =>
  new Promise((resolve, reject) =>
    setTimeout(() => (shouldResolve ? resolve('resolve') : reject(new Error('reject'))), duration),
  )

describe('promiseTimeout', () => {
  it("returns null if the provided promise doesn't resolve or reject in time", async () => {
    const promise = promiseTimeout(timedPromise(2000), 1000) // 2 seconds promise with 1 second timeout

    vi.advanceTimersByTime(2000)

    const result = await promise
    expect(result).toBeNull()
  })

  it('returns the result of the provided promise if it resolves in time', async () => {
    const promise = promiseTimeout(timedPromise(500), 1000) // 0.5 seconds promise with 1 second timeout

    vi.advanceTimersByTime(1000)

    const result = await promise
    expect(result).toBe('resolve')
  })

  it('rejects if the provided promise rejects in time', async () => {
    const promise = promiseTimeout(timedPromise(500, false), 1000) // 0.5 seconds promise with 1 second timeout

    vi.advanceTimersByTime(1000)

    await expect(promise).rejects.toThrow('reject')
  })
})

describe('promiseMinDelay', () => {
  it('returns result only after specified minimum delay time', async () => {
    const promise = promiseMinDelay(timedPromise(500), 1000) // 0.5 seconds promise with 1 second min delay

    vi.advanceTimersByTime(999)

    const stillPending = 'still pending'
    const promiseOrNull = Promise.race([Promise.resolve(stillPending), promise])
    expect(await promiseOrNull).toBe(stillPending) // Shouldn't have resolved yet

    vi.advanceTimersByTime(1)

    const result = await promise

    // Now should have resolved because 1000 ms have passed
    expect(result).toBe('resolve')
  })

  it('returns result after the promise resolves if it resolves after the minimum timeout', async () => {
    const promise = promiseMinDelay(timedPromise(2000), 1000) // 2 seconds promise with 1 second min delay

    vi.advanceTimersByTime(1999)

    const stillPending = 'still pending'
    const promiseOrNull = Promise.race([Promise.resolve(stillPending), promise])
    expect(await promiseOrNull).toBe(stillPending) // Shouldn't have resolved yet

    vi.advanceTimersByTime(1)

    const result = await promise

    // Now should have resolved because the promise resolved after 2000 ms
    expect(result).toBe('resolve')
  })

  it('rejects if the promise rejects before the minimum timeout', async () => {
    const promise = promiseMinDelay(timedPromise(500, false), 1000) // 0.5 seconds promise with 1 second min delay

    vi.advanceTimersByTime(1000)

    await expect(promise).rejects.toThrow('reject')
  })

  it('rejects if the promise rejects after the minimum timeout', async () => {
    const promise = promiseMinDelay(timedPromise(2000, false), 1000) // 2 seconds promise with 1 second min delay

    vi.advanceTimersByTime(2000)

    await expect(promise).rejects.toThrow('reject')
  })
})

describe('useInterval', () => {
  it('calls the callback with the specified interval', () => {
    const callback = vi.fn()
    renderHook(() => useInterval(callback, 1000))

    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)

    expect(callback).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1000)

    expect(callback).toHaveBeenCalledTimes(2)
  })

  it("doesn't call the callback if the delay is null", () => {
    const callback = vi.fn()
    renderHook(() => useInterval(callback, null))

    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)

    expect(callback).not.toHaveBeenCalled()
  })

  it('calls the callback immediately if immediateStart is true', () => {
    const callback = vi.fn()
    renderHook(() => useInterval(callback, 1000, true))

    expect(callback).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1000)

    expect(callback).toHaveBeenCalledTimes(2)
  })
})

describe('useTimeout', () => {
  it('calls the callback after the specified delay', () => {
    const callback = vi.fn()
    renderHook(() => useTimeout(callback, 1000))

    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('calls the timeout with the 0ms delay if no delay is specified', () => {
    const callback = vi.fn()
    renderHook(() => useTimeout(callback))

    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(0)

    expect(callback).toHaveBeenCalledTimes(1)
  })
})

describe('useDebounceWithStatus', () => {
  it('correctly delays updating the value', async () => {
    let value = 'first'
    const { result, rerender } = renderHook(() => useDebounceWithStatus({ value, delay: DEFAULT_DELAY }))

    expect(result.current[0]).toEqual('first')
    value = 'second'

    rerender()
    expect(result.current[0]).toEqual('first')

    await act(() => {
      vi.advanceTimersByTime(DEFAULT_DELAY)
    })
    rerender()
    expect(result.current[0]).toEqual('second')
  })

  it('correctly returns debounce state', async () => {
    let value = 'first'
    const { result, rerender } = renderHook(() => useDebounceWithStatus({ value }))

    expect(result.current[1]).toEqual(true)
    value = 'second'

    rerender()
    expect(result.current[1]).toEqual(true)

    await act(() => {
      vi.advanceTimersByTime(DEFAULT_DELAY / 2)
    })
    rerender()
    expect(result.current[1]).toEqual(true)

    await act(() => {
      vi.advanceTimersByTime(DEFAULT_DELAY / 2)
    })
    rerender()
    expect(result.current[1]).toEqual(false)
  })

  it('updates value immediately when skip is true', () => {
    let value = 'first'
    const { result, rerender } = renderHook(() => useDebounceWithStatus({ value, skipDebounce: true }))

    expect(result.current[0]).toEqual('first')
    expect(result.current[1]).toEqual(false)

    value = 'second'
    rerender()

    expect(result.current[0]).toEqual('second')
    expect(result.current[1]).toEqual(false)

    // Advancing time should not affect the result
    vi.advanceTimersByTime(DEFAULT_DELAY)
    expect(result.current[0]).toEqual('second')
    expect(result.current[1]).toEqual(false)
  })

  it('transitions from skip to non-skip correctly', async () => {
    let value = 'first'
    let skipDebounce = true
    const { result, rerender } = renderHook(() => useDebounceWithStatus({ value, delay: DEFAULT_DELAY, skipDebounce }))

    expect(result.current[0]).toEqual('first')
    expect(result.current[1]).toEqual(false)

    // Change value while skipping
    value = 'second'
    rerender()
    expect(result.current[0]).toEqual('second')
    expect(result.current[1]).toEqual(false)

    // Disable skip
    skipDebounce = false
    rerender()
    expect(result.current[0]).toEqual('second')
    expect(result.current[1]).toEqual(true)

    // Change value again
    value = 'third'
    rerender()
    expect(result.current[0]).toEqual('second')
    expect(result.current[1]).toEqual(true)

    await act(() => {
      vi.advanceTimersByTime(DEFAULT_DELAY)
    })
    expect(result.current[0]).toEqual('third')
    expect(result.current[1]).toEqual(false)
  })
})
