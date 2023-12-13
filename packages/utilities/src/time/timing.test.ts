import { renderHook } from '@testing-library/react-hooks'
import { act } from 'react-test-renderer'
import {
  DEFAULT_DELAY,
  promiseMinDelay,
  promiseTimeout,
  useDebounceWithStatus,
  useInterval,
  useTimeout,
} from './timing'

jest.useFakeTimers()

const timedPromise = (duration: number, shouldResolve = true): Promise<string> =>
  new Promise((resolve, reject) =>
    setTimeout(() => (shouldResolve ? resolve('resolve') : reject(new Error('reject'))), duration)
  )

describe('promiseTimeout', () => {
  it("returns null if the provided promise doesn't resolve or reject in time", async () => {
    const promise = promiseTimeout(timedPromise(2000), 1000) // 2 seconds promise with 1 second timeout

    jest.advanceTimersByTime(2000)

    const result = await promise
    expect(result).toBeNull()
  })

  it('returns the result of the provided promise if it resolves in time', async () => {
    const promise = promiseTimeout(timedPromise(500), 1000) // 0.5 seconds promise with 1 second timeout

    jest.advanceTimersByTime(1000)

    const result = await promise
    expect(result).toBe('resolve')
  })

  it('rejects if the provided promise rejects in time', async () => {
    const promise = promiseTimeout(timedPromise(500, false), 1000) // 0.5 seconds promise with 1 second timeout

    jest.advanceTimersByTime(1000)

    await expect(promise).rejects.toThrow('reject')
  })
})

describe('promiseMinDelay', () => {
  it('returns result only after specified minimum delay time', async () => {
    const promise = promiseMinDelay(timedPromise(500), 1000) // 0.5 seconds promise with 1 second min delay

    jest.advanceTimersByTime(999)

    const stillPending = 'still pending'
    const promiseOrNull = Promise.race([Promise.resolve(stillPending), promise])
    expect(await promiseOrNull).toBe(stillPending) // Shouldn't have resolved yet

    jest.advanceTimersByTime(1)

    const result = await promise

    // Now should have resolved because 1000 ms have passed
    expect(result).toBe('resolve')
  })

  it('returns result after the promise resolves if it resolves after the minimum timeout', async () => {
    const promise = promiseMinDelay(timedPromise(2000), 1000) // 2 seconds promise with 1 second min delay

    jest.advanceTimersByTime(1999)

    const stillPending = 'still pending'
    const promiseOrNull = Promise.race([Promise.resolve(stillPending), promise])
    expect(await promiseOrNull).toBe(stillPending) // Shouldn't have resolved yet

    jest.advanceTimersByTime(1)

    const result = await promise

    // Now should have resolved because the promise resolved after 2000 ms
    expect(result).toBe('resolve')
  })

  it('rejects if the promise rejects before the minimum timeout', async () => {
    const promise = promiseMinDelay(timedPromise(500, false), 1000) // 0.5 seconds promise with 1 second min delay

    jest.advanceTimersByTime(1000)

    await expect(promise).rejects.toThrow('reject')
  })

  it('rejects if the promise rejects after the minimum timeout', async () => {
    const promise = promiseMinDelay(timedPromise(2000, false), 1000) // 2 seconds promise with 1 second min delay

    jest.advanceTimersByTime(2000)

    await expect(promise).rejects.toThrow('reject')
  })
})

describe('useInterval', () => {
  it('calls the callback with the specified interval', () => {
    const callback = jest.fn()
    renderHook(() => useInterval(callback, 1000))

    expect(callback).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1000)

    expect(callback).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(1000)

    expect(callback).toHaveBeenCalledTimes(2)
  })

  it("doesn't call the callback if the delay is null", () => {
    const callback = jest.fn()
    renderHook(() => useInterval(callback, null))

    expect(callback).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1000)

    expect(callback).not.toHaveBeenCalled()
  })

  it('calls the callback immediately if immediateStart is true', () => {
    const callback = jest.fn()
    renderHook(() => useInterval(callback, 1000, true))

    expect(callback).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(1000)

    expect(callback).toHaveBeenCalledTimes(2)
  })
})

describe('useTimeout', () => {
  it('calls the callback after the specified delay', () => {
    const callback = jest.fn()
    renderHook(() => useTimeout(callback, 1000))

    expect(callback).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1000)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('calls the timeout with the 0ms delay if no delay is specified', () => {
    const callback = jest.fn()
    renderHook(() => useTimeout(callback))

    expect(callback).not.toHaveBeenCalled()

    jest.advanceTimersByTime(0)

    expect(callback).toHaveBeenCalledTimes(1)
  })
})

describe('useDebounceWithStatus', () => {
  it('correctly delays updating the value', async () => {
    let value = 'first'
    const { result, rerender } = renderHook(() => useDebounceWithStatus(value))

    expect(result.current[0]).toEqual('first')
    value = 'second'

    rerender()
    expect(result.current[0]).toEqual('first')

    await act(() => {
      jest.advanceTimersByTime(DEFAULT_DELAY)
    })
    rerender()
    expect(result.current[0]).toEqual('second')
  })

  it('correctly returns debounce state', async () => {
    let value = 'first'
    const { result, rerender } = renderHook(() => useDebounceWithStatus(value))

    expect(result.current[1]).toEqual(true)
    value = 'second'

    rerender()
    expect(result.current[1]).toEqual(true)

    await act(() => {
      jest.advanceTimersByTime(DEFAULT_DELAY / 2)
    })
    rerender()
    expect(result.current[1]).toEqual(true)

    await act(() => {
      jest.advanceTimersByTime(DEFAULT_DELAY / 2)
    })
    rerender()
    expect(result.current[1]).toEqual(false)
  })
})
