import { act, renderHook } from '@testing-library/react'
import {
  isRequestStale,
  REQUEST_EXPIRY_TIME_MS,
  useIsRequestStale,
} from 'src/app/features/dappRequests/hooks/useIsRequestStale'

describe('isRequestStale', () => {
  it('returns false for requests created less than 30 minutes ago', () => {
    const createdAt = Date.now() - (REQUEST_EXPIRY_TIME_MS - 60000) // 1 minute before expiry
    expect(isRequestStale(createdAt)).toBe(false)
  })

  it('returns true for requests created exactly 30 minutes ago', () => {
    const createdAt = Date.now() - REQUEST_EXPIRY_TIME_MS // Exactly at expiry time
    expect(isRequestStale(createdAt)).toBe(true)
  })

  it('returns true for requests created more than 30 minutes ago', () => {
    const createdAt = Date.now() - (REQUEST_EXPIRY_TIME_MS + 60000) // 1 minute past expiry
    expect(isRequestStale(createdAt)).toBe(true)
  })

  it('handles edge case where createdAt is in the future', () => {
    const createdAt = Date.now() + 60 * 1000 // 1 minute in the future
    expect(isRequestStale(createdAt)).toBe(false)
  })
})

describe('useIsRequestStale', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('returns false initially for fresh request', () => {
    const createdAt = Date.now() - 1000 // 1 second ago
    const { result } = renderHook(() => useIsRequestStale(createdAt))
    expect(result.current).toBe(false)
  })

  it('returns true initially for stale request', () => {
    const createdAt = Date.now() - (REQUEST_EXPIRY_TIME_MS + 60000) // 1 minute past expiry
    const { result } = renderHook(() => useIsRequestStale(createdAt))
    expect(result.current).toBe(true)
  })

  it('updates from false to true when request becomes stale', () => {
    const createdAt = Date.now() - (REQUEST_EXPIRY_TIME_MS - 60000) // 1 minute before expiry
    const { result } = renderHook(() => useIsRequestStale(createdAt))

    expect(result.current).toBe(false)

    // Fast-forward past expiry time
    act(() => {
      jest.advanceTimersByTime(120000) // 2 minutes
    })

    expect(result.current).toBe(true)
  })

  it('recalculates when createdAt changes', () => {
    const initialCreatedAt = Date.now() - 1000 // 1 second ago
    const { result, rerender } = renderHook(({ timestamp }) => useIsRequestStale(timestamp), {
      initialProps: { timestamp: initialCreatedAt },
    })

    expect(result.current).toBe(false)

    // Change createdAt to a stale timestamp
    const staleCreatedAt = Date.now() - (REQUEST_EXPIRY_TIME_MS + 60000) // 1 minute past expiry
    act(() => {
      rerender({ timestamp: staleCreatedAt })
    })

    // Need to advance timer to trigger the interval check
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(result.current).toBe(true)
  })

  it('checks staleness every second', () => {
    const createdAt = Date.now() - (REQUEST_EXPIRY_TIME_MS - 30000) // 30 seconds before expiry
    const { result } = renderHook(() => useIsRequestStale(createdAt))

    expect(result.current).toBe(false)

    // Fast-forward by 30 seconds to reach expiry time
    act(() => {
      jest.advanceTimersByTime(30000)
    })

    // Should now be stale
    expect(result.current).toBe(true)

    // Verify it stays stale after more time passes
    act(() => {
      jest.advanceTimersByTime(10000)
    })

    expect(result.current).toBe(true)
  })
})
