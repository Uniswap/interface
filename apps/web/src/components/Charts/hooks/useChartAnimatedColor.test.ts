import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useChartAnimatedColor } from '~/components/Charts/hooks/useChartAnimatedColor'

function parseHex(hex: string): [number, number, number] | null {
  const match = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return match ? [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)] : null
}

function toHex(rgb: [number, number, number]): string {
  return `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
}

function expectedColorAtElapsed(from: string, to: string, elapsed: number, duration: number): string {
  const t = Math.min(elapsed / duration, 1)
  const eased = 1 - Math.pow(1 - t, 3)
  const fromRgb = parseHex(from)
  const toRgb = parseHex(to)

  if (!fromRgb || !toRgb) {
    return to
  }

  return toHex([
    fromRgb[0] + (toRgb[0] - fromRgb[0]) * eased,
    fromRgb[1] + (toRgb[1] - fromRgb[1]) * eased,
    fromRgb[2] + (toRgb[2] - fromRgb[2]) * eased,
  ])
}

describe('useChartAnimatedColor', () => {
  let currentTime = 0
  let pendingRafCallback: FrameRequestCallback | null = null
  let nextRafId = 0
  let requestAnimationFrameMock: ReturnType<typeof vi.fn>
  let cancelAnimationFrameMock: ReturnType<typeof vi.fn>

  const flushRaf = (now = currentTime): void => {
    if (pendingRafCallback) {
      const callback = pendingRafCallback
      pendingRafCallback = null
      callback(now)
    }
  }

  const advanceTime = (ms: number): void => {
    currentTime += ms
    flushRaf(currentTime)
  }

  const runAnimationToCompletion = (duration: number): void => {
    const endTime = currentTime + duration
    let iterations = 0

    while (pendingRafCallback !== null && iterations < 500) {
      if (currentTime < endTime) {
        currentTime = Math.min(currentTime + 16, endTime)
      }
      flushRaf(currentTime)
      iterations += 1
    }
  }

  beforeEach(() => {
    currentTime = 1_000
    pendingRafCallback = null
    nextRafId = 0

    vi.spyOn(performance, 'now').mockImplementation(() => currentTime)

    requestAnimationFrameMock = vi.fn((callback: FrameRequestCallback) => {
      pendingRafCallback = callback
      nextRafId += 1
      return nextRafId
    })
    cancelAnimationFrameMock = vi.fn(() => {
      pendingRafCallback = null
    })

    vi.stubGlobal('requestAnimationFrame', requestAnimationFrameMock)
    vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrameMock)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('should return the initial target color without scheduling animation', () => {
    const { result } = renderHook(() => useChartAnimatedColor('#ff0000'))

    expect(result.current).toBe('#ff0000')
    expect(requestAnimationFrameMock).not.toHaveBeenCalled()
  })

  it('should not schedule animation when the target is unchanged on rerender', () => {
    const { rerender } = renderHook(({ target }) => useChartAnimatedColor(target), {
      initialProps: { target: '#112233' },
    })

    act(() => {
      rerender({ target: '#112233' })
    })

    expect(requestAnimationFrameMock).not.toHaveBeenCalled()
  })

  it('should interpolate between hex colors using cubic ease-out', () => {
    const duration = 400
    const from = '#000000'
    const to = '#ffffff'
    const { result, rerender } = renderHook(({ target }) => useChartAnimatedColor(target, duration), {
      initialProps: { target: from },
    })

    act(() => {
      rerender({ target: to })
    })

    act(() => {
      advanceTime(200)
    })

    const easedMidpoint = expectedColorAtElapsed(from, to, 200, duration)
    // Linear midpoint at t=0.5 would be #808080; ease-out should be lighter.
    expect(result.current).toBe(easedMidpoint)
    expect(result.current).not.toBe('#808080')
  })

  it('should reach the target color when the animation completes', () => {
    const duration = 400
    const { result, rerender } = renderHook(({ target }) => useChartAnimatedColor(target, duration), {
      initialProps: { target: '#000000' },
    })

    act(() => {
      rerender({ target: '#00ff00' })
    })

    act(() => {
      runAnimationToCompletion(duration)
    })

    expect(result.current).toBe('#00ff00')
    expect(pendingRafCallback).toBeNull()
  })

  it('should support uppercase hex targets', () => {
    const duration = 400
    const { result, rerender } = renderHook(({ target }) => useChartAnimatedColor(target, duration), {
      initialProps: { target: '#000000' },
    })

    act(() => {
      rerender({ target: '#AABBCC' })
    })

    act(() => {
      runAnimationToCompletion(duration)
    })

    expect(result.current).toBe('#aabbcc')
  })

  it('should cancel an in-flight animation when the target changes again', () => {
    const duration = 400
    const { result, rerender } = renderHook(({ target }) => useChartAnimatedColor(target, duration), {
      initialProps: { target: '#000000' },
    })

    act(() => {
      rerender({ target: '#ffffff' })
    })

    act(() => {
      advanceTime(100)
    })

    const callsBeforeRetarget = cancelAnimationFrameMock.mock.calls.length

    act(() => {
      rerender({ target: '#ff0000' })
    })

    expect(cancelAnimationFrameMock.mock.calls.length).toBeGreaterThan(callsBeforeRetarget)

    act(() => {
      runAnimationToCompletion(duration)
    })

    expect(result.current).toBe('#ff0000')
  })

  it('should cancel pending frames on unmount', () => {
    const { rerender, unmount } = renderHook(({ target }) => useChartAnimatedColor(target, 400), {
      initialProps: { target: '#000000' },
    })

    act(() => {
      rerender({ target: '#ffffff' })
    })

    expect(pendingRafCallback).not.toBeNull()

    act(() => {
      unmount()
    })

    expect(cancelAnimationFrameMock).toHaveBeenCalled()
  })

  it('should jump directly to the target when either color is not a valid hex string', () => {
    const duration = 400
    const { result, rerender } = renderHook(({ target }) => useChartAnimatedColor(target, duration), {
      initialProps: { target: 'red' },
    })

    act(() => {
      rerender({ target: '#0000ff' })
    })

    act(() => {
      flushRaf(currentTime)
    })

    expect(result.current).toBe('#0000ff')
  })

  it('should respect a custom animation duration', () => {
    const shortDuration = 200
    const longDuration = 800
    const from = '#000000'
    const to = '#ffffff'

    const { result: shortResult, rerender: rerenderShort } = renderHook(
      ({ target, duration }) => useChartAnimatedColor(target, duration),
      { initialProps: { target: from, duration: shortDuration } },
    )

    act(() => {
      rerenderShort({ target: to, duration: shortDuration })
    })

    act(() => {
      advanceTime(100)
    })

    const shortMidColor = shortResult.current

    currentTime = 1_000
    pendingRafCallback = null
    requestAnimationFrameMock.mockClear()
    cancelAnimationFrameMock.mockClear()

    const { result: longResult, rerender: rerenderLong } = renderHook(
      ({ target, duration }) => useChartAnimatedColor(target, duration),
      { initialProps: { target: from, duration: longDuration } },
    )

    act(() => {
      rerenderLong({ target: to, duration: longDuration })
    })

    act(() => {
      advanceTime(100)
    })

    const longMidColor = longResult.current

    expect(shortMidColor).toBe(expectedColorAtElapsed(from, to, 100, shortDuration))
    expect(longMidColor).toBe(expectedColorAtElapsed(from, to, 100, longDuration))
    expect(shortMidColor).not.toBe(longMidColor)
  })

  it('should restart animation when duration changes mid-flight', () => {
    const { rerender } = renderHook(({ target, duration }) => useChartAnimatedColor(target, duration), {
      initialProps: { target: '#000000', duration: 400 },
    })

    act(() => {
      rerender({ target: '#ffffff', duration: 400 })
    })

    act(() => {
      advanceTime(100)
    })

    const callsBeforeDurationChange = cancelAnimationFrameMock.mock.calls.length

    act(() => {
      rerender({ target: '#ffffff', duration: 800 })
    })

    expect(cancelAnimationFrameMock.mock.calls.length).toBeGreaterThan(callsBeforeDurationChange)
    expect(requestAnimationFrameMock).toHaveBeenCalled()
  })
})
