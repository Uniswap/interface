import { getDeviceId } from '@amplitude/analytics-browser'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAmplitudeDeviceId } from '~/app/bootstrap/useAmplitudeDeviceId'

vi.mock('@amplitude/analytics-browser', () => ({
  getDeviceId: vi.fn(),
}))

const mockGetDeviceId = vi.mocked(getDeviceId)

describe('useAmplitudeDeviceId', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockGetDeviceId.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves synchronously when the device id is already available', () => {
    mockGetDeviceId.mockReturnValue('device-1')

    const { result } = renderHook(() => useAmplitudeDeviceId())

    expect(result.current).toEqual({ deviceId: 'device-1', isDeviceIdPending: false, didTimeOut: false })
  })

  it('stays pending until Amplitude assigns a device id, then resolves', () => {
    mockGetDeviceId.mockReturnValue(undefined)

    const { result } = renderHook(() => useAmplitudeDeviceId())
    expect(result.current).toEqual({ deviceId: undefined, isDeviceIdPending: true, didTimeOut: false })

    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(result.current.isDeviceIdPending).toBe(true)

    mockGetDeviceId.mockReturnValue('device-2')
    act(() => {
      vi.advanceTimersByTime(50)
    })

    expect(result.current).toEqual({ deviceId: 'device-2', isDeviceIdPending: false, didTimeOut: false })
  })

  it('stops polling once the device id resolves', () => {
    mockGetDeviceId.mockReturnValue(undefined)
    renderHook(() => useAmplitudeDeviceId())

    mockGetDeviceId.mockReturnValue('device-3')
    act(() => {
      vi.advanceTimersByTime(50)
    })

    const callsAfterResolve = mockGetDeviceId.mock.calls.length
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(mockGetDeviceId.mock.calls.length).toBe(callsAfterResolve)
  })

  it('gives up after the 3s cap and reports the timeout', () => {
    mockGetDeviceId.mockReturnValue(undefined)

    const { result } = renderHook(() => useAmplitudeDeviceId())

    act(() => {
      vi.advanceTimersByTime(2950)
    })
    expect(result.current).toEqual({ deviceId: undefined, isDeviceIdPending: true, didTimeOut: false })

    act(() => {
      vi.advanceTimersByTime(50)
    })

    expect(result.current).toEqual({ deviceId: undefined, isDeviceIdPending: false, didTimeOut: true })
  })

  // `StatsigProvider` reads `didTimeOut` from the render that releases the hold, so the flag
  // has to be final by then: it must flip in the same update as `isDeviceIdPending` and never
  // move again, including once Amplitude belatedly produces an id.
  it('settles didTimeOut in the same update that releases the wait, and never changes it after', () => {
    mockGetDeviceId.mockReturnValue(undefined)

    const { result, rerender } = renderHook(() => useAmplitudeDeviceId())

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current).toEqual({ deviceId: undefined, isDeviceIdPending: false, didTimeOut: true })

    mockGetDeviceId.mockReturnValue('late-device-id')
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    rerender()

    expect(result.current).toEqual({ deviceId: undefined, isDeviceIdPending: false, didTimeOut: true })
  })

  it('clears its interval on unmount', () => {
    mockGetDeviceId.mockReturnValue(undefined)
    const { unmount } = renderHook(() => useAmplitudeDeviceId())

    unmount()
    const callsAfterUnmount = mockGetDeviceId.mock.calls.length
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(mockGetDeviceId.mock.calls.length).toBe(callsAfterUnmount)
  })
})
