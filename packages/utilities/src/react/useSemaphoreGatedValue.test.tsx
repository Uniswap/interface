import { act, renderHook } from '@testing-library/react'
import { createSemaphore, useSemaphoreGatedValue } from 'utilities/src/react/useSemaphoreGatedValue'
import { vi } from 'vitest'

describe('createSemaphore', () => {
  it('grants synchronously when under capacity', () => {
    const semaphore = createSemaphore(2)
    const onGrantA = vi.fn()
    const onGrantB = vi.fn()

    semaphore.acquire(onGrantA)
    semaphore.acquire(onGrantB)

    expect(onGrantA).toHaveBeenCalledTimes(1)
    expect(onGrantB).toHaveBeenCalledTimes(1)
  })

  it('queues callers above capacity and grants in FIFO order on release', () => {
    const semaphore = createSemaphore(1)
    const order: string[] = []

    const releaseA = semaphore.acquire(() => order.push('A'))
    semaphore.acquire(() => order.push('B'))
    semaphore.acquire(() => order.push('C'))

    expect(order).toEqual(['A'])

    releaseA()
    expect(order).toEqual(['A', 'B'])
  })

  it('cancels a queued waiter without firing onGrant', () => {
    const semaphore = createSemaphore(1)
    const onGrantA = vi.fn()
    const onGrantB = vi.fn()
    const onGrantC = vi.fn()

    const releaseA = semaphore.acquire(onGrantA)
    const releaseB = semaphore.acquire(onGrantB)
    semaphore.acquire(onGrantC)

    releaseB() // cancel before grant
    releaseA() // free A's slot, queue should skip B and grant C

    expect(onGrantB).not.toHaveBeenCalled()
    expect(onGrantC).toHaveBeenCalledTimes(1)
  })

  it('releases a granted slot and processes the queue', () => {
    const semaphore = createSemaphore(1)
    const onGrantA = vi.fn()
    const onGrantB = vi.fn()

    const releaseA = semaphore.acquire(onGrantA)
    semaphore.acquire(onGrantB)

    expect(onGrantA).toHaveBeenCalledTimes(1)
    expect(onGrantB).not.toHaveBeenCalled()

    releaseA()

    expect(onGrantB).toHaveBeenCalledTimes(1)
  })

  it('treats repeated releases as no-ops', () => {
    const semaphore = createSemaphore(1)
    const onGrantB = vi.fn()

    const releaseA = semaphore.acquire(vi.fn())
    semaphore.acquire(onGrantB)

    releaseA()
    releaseA() // second call should not double-decrement
    releaseA()

    expect(onGrantB).toHaveBeenCalledTimes(1)

    // Capacity should still be honored — a third acquire must queue, not run immediately.
    const onGrantC = vi.fn()
    semaphore.acquire(onGrantC)
    expect(onGrantC).not.toHaveBeenCalled()
  })

  it('does not leak slots when a queued waiter is cancelled and a granted holder releases', () => {
    const semaphore = createSemaphore(1)
    const releaseA = semaphore.acquire(vi.fn())
    const releaseB = semaphore.acquire(vi.fn())

    releaseB() // cancel queued waiter
    releaseA() // free the only active slot

    // Capacity should be fully restored — a fresh acquire grants synchronously.
    const onGrantC = vi.fn()
    semaphore.acquire(onGrantC)
    expect(onGrantC).toHaveBeenCalledTimes(1)
  })
})

describe('useSemaphoreGatedValue', () => {
  it('returns undefined when the input value is undefined', () => {
    const semaphore = createSemaphore(2)
    const { result } = renderHook(() => useSemaphoreGatedValue<string>({ value: undefined, semaphore }))

    expect(result.current.gatedValue).toBeUndefined()
  })

  it('returns the value once a slot is granted', () => {
    const semaphore = createSemaphore(2)
    const { result } = renderHook(() => useSemaphoreGatedValue({ value: 'a', semaphore }))

    expect(result.current.gatedValue).toBe('a')
  })

  it('holds the value back until a slot frees up', () => {
    const semaphore = createSemaphore(1)
    const blocker = semaphore.acquire(vi.fn())

    const { result } = renderHook(() => useSemaphoreGatedValue({ value: 'queued', semaphore }))

    expect(result.current.gatedValue).toBeUndefined()

    act(() => {
      blocker()
    })

    expect(result.current.gatedValue).toBe('queued')
  })

  it('releases the slot on unmount so a queued consumer is granted', () => {
    const semaphore = createSemaphore(1)
    const onGrantQueued = vi.fn()

    const { unmount } = renderHook(() => useSemaphoreGatedValue({ value: 'held', semaphore }))
    semaphore.acquire(onGrantQueued)

    expect(onGrantQueued).not.toHaveBeenCalled()

    unmount()

    expect(onGrantQueued).toHaveBeenCalledTimes(1)
  })

  it('releases and re-acquires when the value changes', () => {
    const semaphore = createSemaphore(1)
    const onGrantQueued = vi.fn()

    const { result, rerender } = renderHook(({ value }) => useSemaphoreGatedValue({ value, semaphore }), {
      initialProps: { value: 'a' },
    })

    expect(result.current.gatedValue).toBe('a')
    semaphore.acquire(onGrantQueued)
    expect(onGrantQueued).not.toHaveBeenCalled()

    rerender({ value: 'b' })

    // The hook released the slot for 'a' on cleanup, so the queued waiter is granted
    // before this hook can re-acquire.
    expect(onGrantQueued).toHaveBeenCalledTimes(1)
    expect(result.current.gatedValue).toBeUndefined()
  })

  it('frees the slot when release() is called manually', () => {
    const semaphore = createSemaphore(1)
    const onGrantQueued = vi.fn()

    const { result } = renderHook(() => useSemaphoreGatedValue({ value: 'held', semaphore }))
    semaphore.acquire(onGrantQueued)

    expect(onGrantQueued).not.toHaveBeenCalled()

    act(() => {
      result.current.release()
    })

    expect(onGrantQueued).toHaveBeenCalledTimes(1)
  })

  it('keeps the gated value visible after release() so consumers can finish rendering', () => {
    const semaphore = createSemaphore(1)
    const { result } = renderHook(() => useSemaphoreGatedValue({ value: 'held', semaphore }))

    expect(result.current.gatedValue).toBe('held')

    act(() => {
      result.current.release()
    })

    expect(result.current.gatedValue).toBe('held')
  })

  it('treats release() as idempotent', () => {
    const semaphore = createSemaphore(1)
    const onGrantQueued = vi.fn()

    const { result } = renderHook(() => useSemaphoreGatedValue({ value: 'held', semaphore }))
    semaphore.acquire(onGrantQueued)

    act(() => {
      result.current.release()
      result.current.release()
      result.current.release()
    })

    expect(onGrantQueued).toHaveBeenCalledTimes(1)

    // Capacity is preserved — a fresh consumer must still queue behind the new holder.
    const onGrantExtra = vi.fn()
    semaphore.acquire(onGrantExtra)
    expect(onGrantExtra).not.toHaveBeenCalled()
  })

  it('grants the value asynchronously when capacity opens up', () => {
    const semaphore = createSemaphore(1)
    const blocker = semaphore.acquire(vi.fn())

    const { result } = renderHook(() => useSemaphoreGatedValue({ value: 'waiting', semaphore }))
    expect(result.current.gatedValue).toBeUndefined()

    act(() => {
      blocker()
    })

    expect(result.current.gatedValue).toBe('waiting')
  })

  it('works with non-string value types', () => {
    const semaphore = createSemaphore(1)
    const value = { id: 42 }
    const { result } = renderHook(() => useSemaphoreGatedValue({ value, semaphore }))

    expect(result.current.gatedValue).toBe(value)
  })
})

describe('createSemaphore with timeoutMs', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('auto-releases the slot after timeoutMs and grants the next waiter', () => {
    const semaphore = createSemaphore(1)
    const onGrantQueued = vi.fn()

    semaphore.acquire(vi.fn(), 1000)
    semaphore.acquire(onGrantQueued)

    expect(onGrantQueued).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)

    expect(onGrantQueued).toHaveBeenCalledTimes(1)
  })

  it('makes the explicit release a no-op after the timeout fires', () => {
    const semaphore = createSemaphore(1)
    const releaseTimedOut = semaphore.acquire(vi.fn(), 1000)

    vi.advanceTimersByTime(1000)
    // Slot already auto-released; queued waiter takes it.
    const onGrantQueued = vi.fn()
    semaphore.acquire(onGrantQueued)
    expect(onGrantQueued).toHaveBeenCalledTimes(1)

    // The original holder's release must not double-decrement, or capacity will drift
    // and a new caller would grant past the cap.
    releaseTimedOut()

    const onGrantExtra = vi.fn()
    semaphore.acquire(onGrantExtra)
    expect(onGrantExtra).not.toHaveBeenCalled()
  })

  it('clears the timer on explicit release so the timeout never fires', () => {
    const semaphore = createSemaphore(1)
    const release = semaphore.acquire(vi.fn(), 1000)

    release()

    // A new holder takes the slot. If the prior timer hadn't been cleared, it would
    // double-decrement here and let an extra caller through.
    semaphore.acquire(vi.fn())
    vi.advanceTimersByTime(1000)

    const onGrantExtra = vi.fn()
    semaphore.acquire(onGrantExtra)
    expect(onGrantExtra).not.toHaveBeenCalled()
  })

  it('does not start a timer for queued waiters until they are granted', () => {
    const semaphore = createSemaphore(1)
    const releaseFirst = semaphore.acquire(vi.fn())

    const onGrantSecond = vi.fn()
    semaphore.acquire(onGrantSecond, 1000)

    // While queued, advancing time should not affect anything.
    vi.advanceTimersByTime(5000)
    expect(onGrantSecond).not.toHaveBeenCalled()

    releaseFirst()
    expect(onGrantSecond).toHaveBeenCalledTimes(1)

    // Now the timer is running for the second holder.
    const onGrantThird = vi.fn()
    semaphore.acquire(onGrantThird)
    expect(onGrantThird).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)
    expect(onGrantThird).toHaveBeenCalledTimes(1)
  })
})

describe('useSemaphoreGatedValue with timeoutMs', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reclaims the slot after timeoutMs even if the consumer never calls release()', () => {
    const semaphore = createSemaphore(1)
    renderHook(() => useSemaphoreGatedValue({ value: 'held', semaphore, timeoutMs: 1000 }))

    const onGrantQueued = vi.fn()
    semaphore.acquire(onGrantQueued)
    expect(onGrantQueued).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(onGrantQueued).toHaveBeenCalledTimes(1)
  })

  it('keeps the gated value visible after the timeout fires', () => {
    const semaphore = createSemaphore(1)
    const { result } = renderHook(() => useSemaphoreGatedValue({ value: 'held', semaphore, timeoutMs: 1000 }))

    expect(result.current.gatedValue).toBe('held')

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // Slot is reclaimed but the value stays — consumer may still be rendering it.
    expect(result.current.gatedValue).toBe('held')
  })

  it('clears the timer on unmount', () => {
    const semaphore = createSemaphore(1)
    const { unmount } = renderHook(() => useSemaphoreGatedValue({ value: 'held', semaphore, timeoutMs: 1000 }))

    unmount()

    // After unmount the slot is freed; a new holder takes it. If the timer hadn't been
    // cleared, advancing time would double-decrement and let an extra caller through.
    semaphore.acquire(vi.fn())
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    const onGrantExtra = vi.fn()
    semaphore.acquire(onGrantExtra)
    expect(onGrantExtra).not.toHaveBeenCalled()
  })
})
