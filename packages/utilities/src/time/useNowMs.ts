import { useSyncExternalStore } from 'react'

/**
 * Shared wall clock for countdowns and ages, floored to `tickMs`.
 *
 * One interval per distinct tick for the whole tab no matter how many
 * components read it, and the snapshot only changes when the FLOORED value
 * moves — a consumer re-renders when its displayed time changes, not once per
 * raw millisecond sample. Reads the clock on every tick, so no drift
 * accumulates and a clock correction made after mount lands within one tick.
 *
 * The interval stops while the document is hidden and resyncs before resuming:
 * a backgrounded phone does no clock work, and the first frame back is already
 * correct.
 */

interface Ticker {
  now: number
  interval: ReturnType<typeof setInterval> | undefined
  listeners: Set<() => void>
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => number
  getServerSnapshot: () => number
}

/** SSR (and React Native) has no document: the snapshot must read fresh there
 * (module state is shared across requests), but stay cached during hydration —
 * React reads the server snapshot twice and compares. */
const isBrowser = typeof document !== 'undefined'

function isHidden(): boolean {
  return isBrowser && document.visibilityState === 'hidden'
}

/** Builds a `useNowMs` reading `clock` instead of `Date.now()` — e.g. a
 * server-anchored clock that corrects a skewed system clock. Each hook it
 * returns keeps its own tickers. */
export function createUseNowMs(clock: () => number): (tickMs: number) => number {
  const tickers = new Map<number, Ticker>()
  let subscriberCount = 0

  function floorToTick(tickMs: number): number {
    return Math.floor(clock() / tickMs) * tickMs
  }

  /** Notifies only when the floored value actually moved. */
  function sync(ticker: Ticker, tickMs: number): void {
    const next = floorToTick(tickMs)
    if (next === ticker.now) {
      return
    }
    ticker.now = next
    for (const notify of ticker.listeners) {
      notify()
    }
  }

  function start(ticker: Ticker, tickMs: number): void {
    ticker.interval ??= setInterval(() => sync(ticker, tickMs), tickMs)
  }

  function stop(ticker: Ticker): void {
    if (ticker.interval !== undefined) {
      clearInterval(ticker.interval)
      ticker.interval = undefined
    }
  }

  function stopAll(): void {
    for (const ticker of tickers.values()) {
      stop(ticker)
    }
  }

  /** `pageshow` also fires on a tab opened in the background, so this has to
   * re-check visibility rather than trust the event. */
  function resumeAll(): void {
    if (isHidden()) {
      return
    }
    for (const [tickMs, ticker] of tickers) {
      if (ticker.listeners.size > 0) {
        sync(ticker, tickMs)
        start(ticker, tickMs)
      }
    }
  }

  function handleVisibilityChange(): void {
    if (isHidden()) {
      stopAll()
    } else {
      resumeAll()
    }
  }

  /** `pagehide`/`pageshow` as well as `visibilitychange`: Safari doesn't reliably
   * fire visibilitychange across a bfcache round trip, which is every app switch
   * on mobile web. */
  function bindLifecycle(): void {
    if (!isBrowser) {
      return
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', stopAll)
    window.addEventListener('pageshow', resumeAll)
  }

  function unbindLifecycle(): void {
    if (!isBrowser) {
      return
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('pagehide', stopAll)
    window.removeEventListener('pageshow', resumeAll)
  }

  function getTicker(tickMs: number): Ticker {
    const existing = tickers.get(tickMs)
    if (existing !== undefined) {
      // Cold store: the last consumer left and the clock stopped, so the cached
      // snapshot is however old that gap was. Refresh before the first render
      // reads it, or the remount paints one frame of stale time.
      if (existing.listeners.size === 0) {
        existing.now = floorToTick(tickMs)
      }
      return existing
    }
    const ticker: Ticker = {
      now: floorToTick(tickMs),
      interval: undefined,
      listeners: new Set(),
      subscribe: (listener) => {
        ticker.listeners.add(listener)
        subscriberCount += 1
        if (subscriberCount === 1) {
          bindLifecycle()
        }
        if (!isHidden()) {
          sync(ticker, tickMs)
          start(ticker, tickMs)
        }
        return () => {
          ticker.listeners.delete(listener)
          subscriberCount -= 1
          if (ticker.listeners.size === 0) {
            stop(ticker)
          }
          if (subscriberCount === 0) {
            unbindLifecycle()
          }
        }
      },
      getSnapshot: () => ticker.now,
      getServerSnapshot: () => (isBrowser ? ticker.now : floorToTick(tickMs)),
    }
    tickers.set(tickMs, ticker)
    return ticker
  }

  return function useNowMs(tickMs: number): number {
    const ticker = getTicker(tickMs)
    return useSyncExternalStore(ticker.subscribe, ticker.getSnapshot, ticker.getServerSnapshot)
  }
}

/** Wall clock (`Date.now()`) floored to `tickMs`. Shared interval; paused while hidden. */
export const useNowMs = createUseNowMs(() => Date.now())
