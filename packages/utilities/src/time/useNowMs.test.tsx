import { act, renderHook } from '@testing-library/react'
import { createUseNowMs, useNowMs } from 'utilities/src/time/useNowMs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * jsdom's visibilityState is a readonly getter, so the tests drive it through
 * an override and dispatch the event the hook listens for.
 */
let visibility: DocumentVisibilityState = 'visible'
Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility })

function setVisibility(next: DocumentVisibilityState): void {
  visibility = next
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

interface View {
  /** Every value the hook has handed a consumer, one entry per render. */
  values: number[]
  renders: number
  unmount: () => void
}

function render(tickMs: number, count = 1, hook: (tickMs: number) => number = useNowMs): View {
  const values: number[] = []
  const mounted = Array.from({ length: count }, () =>
    renderHook(() => {
      values.push(hook(tickMs))
    }),
  )
  return {
    values,
    get renders() {
      return values.length
    },
    unmount: () => {
      for (const { unmount } of mounted) {
        unmount()
      }
    },
  }
}

describe('useNowMs', () => {
  beforeEach(() => {
    // Explicit list: faking rAF/microtasks would deadlock React's scheduler.
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] })
    vi.setSystemTime(1_700_000_000_500)
    visibility = 'visible'
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('exposes the clock floored to the tick, so the value only moves when the display does', () => {
    const view = render(1_000)
    expect(view.values[0]).toBe(1_700_000_000_000)

    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    expect(view.values.at(-1)).toBe(1_700_000_001_000)
    view.unmount()
  })

  it('does not re-render when a tick lands in the same quantum', () => {
    const view = render(5_000)
    const before = view.renders

    // Hidden, then back after 300ms: the resync recomputes the same 5s bucket,
    // so the bail-out means the consumer never re-renders.
    setVisibility('hidden')
    act(() => {
      vi.advanceTimersByTime(300)
    })
    setVisibility('visible')
    expect(view.renders).toBe(before)

    // A resync that DOES cross a bucket renders exactly once, not once per
    // elapsed tick — no catch-up burst on return.
    setVisibility('hidden')
    act(() => {
      vi.advanceTimersByTime(20_000)
    })
    setVisibility('visible')
    expect(view.renders).toBe(before + 1)
    view.unmount()
  })

  it('stops ticking while the document is hidden and resumes on return', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval')
    const view = render(1_000)

    act(() => {
      vi.advanceTimersByTime(3_000)
    })
    const whileVisible = view.renders
    expect(whileVisible).toBeGreaterThan(1)

    setVisibility('hidden')
    expect(clearSpy).toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    // A backgrounded tab does no clock work at all.
    expect(view.renders).toBe(whileVisible)

    setVisibility('visible')
    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    expect(view.renders).toBeGreaterThan(whileVisible + 1)
    view.unmount()
  })

  // `pageshow` fires at load on a tab opened in the background, so resuming on
  // the event alone would start a ticker that then never stops while hidden —
  // the exact always-on hidden interval this hook exists to avoid.
  it('does not start a ticker when pageshow fires on a hidden document', () => {
    visibility = 'hidden'
    const startSpy = vi.spyOn(globalThis, 'setInterval')
    const view = render(7_000)
    expect(startSpy).not.toHaveBeenCalled()

    act(() => {
      window.dispatchEvent(new Event('pageshow'))
    })
    expect(startSpy).not.toHaveBeenCalled()

    const before = view.renders
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(view.renders).toBe(before)

    // Becoming visible for real still starts it.
    setVisibility('visible')
    expect(startSpy).toHaveBeenCalledTimes(1)
    view.unmount()
  })

  it('serves a fresh value when a cold ticker is remounted', () => {
    const first = render(3_000)
    const firstValue = first.values[0]
    first.unmount()

    // Clock stops with the last consumer; a later remount must not paint the
    // value from before the gap.
    act(() => {
      vi.advanceTimersByTime(30_000)
    })
    const second = render(3_000)
    expect(second.values[0]).toBe((firstValue ?? 0) + 30_000)
    second.unmount()
  })

  it('runs one shared interval for every consumer on the same tick', () => {
    const startSpy = vi.spyOn(globalThis, 'setInterval')
    const view = render(2_000, 3)

    expect(startSpy).toHaveBeenCalledTimes(1)
    act(() => {
      vi.advanceTimersByTime(2_000)
    })
    // Three consumers, one tick, three renders off the same value.
    const latest = view.values.slice(-3)
    expect(latest).toEqual([latest[0], latest[0], latest[0]])
    view.unmount()
  })

  it('clears the interval on unmount and never ticks again', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval')
    const view = render(1_000)
    act(() => {
      vi.advanceTimersByTime(1_000)
    })

    view.unmount()
    expect(clearSpy).toHaveBeenCalled()

    const afterUnmount = view.renders
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(view.renders).toBe(afterUnmount)
  })

  it('keeps the interval alive until the last consumer leaves', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval')
    const first = render(4_000)
    const second = render(4_000)

    first.unmount()
    expect(clearSpy).not.toHaveBeenCalled()

    const before = second.renders
    act(() => {
      vi.advanceTimersByTime(4_000)
    })
    expect(second.renders).toBeGreaterThan(before)

    second.unmount()
    expect(clearSpy).toHaveBeenCalled()
  })
})

describe('createUseNowMs', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] })
    vi.setSystemTime(1_700_000_000_500)
    visibility = 'visible'
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('reads the clock it is given, on every tick', () => {
    let offsetMs = 0
    const useSkewedNowMs = createUseNowMs(() => Date.now() + offsetMs)
    const view = render(1_000, 1, useSkewedNowMs)
    expect(view.values[0]).toBe(1_700_000_000_000)

    // A correction recorded after mount lands within one tick.
    offsetMs = 60_000
    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    expect(view.values.at(-1)).toBe(1_700_000_061_000)
    view.unmount()
  })
})
