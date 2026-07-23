interface VisibilitySettlingControllerContext {
  /** Get the time (ms) the block timestamp was last fetched (from useCurrentBlockTimestamp). */
  getBlockTimestampUpdatedAt: () => number
  /** Whether the document is currently visible. */
  getIsDocumentVisible: () => boolean
  /** Current wall-clock time in ms (Date.now()-equivalent). Injected for tests. */
  getWallClockTimeMs: () => number
  /** Subscribe to document visibility changes. Returns an unsubscribe function. */
  subscribeToVisibilityChange: (listener: () => void) => () => void
  /** How long to wait after returning to a visible tab if the block timestamp has not refreshed. */
  visibilitySettlingMs: number
  /** Poll interval in ms — used together with visibilitySettlingMs to detect large gaps. */
  pollIntervalMs: number
}

/**
 * Result of a single controller tick.
 *
 * - `shouldEvaluateAlerts`: false when the document is hidden — callers should skip alert evaluation entirely.
 * - `suppressChainConnectivity`: true while we are inside the post-refocus settling window
 *   and the cached block timestamp has not yet refreshed.
 */
export interface VisibilitySettlingTickResult {
  shouldEvaluateAlerts: boolean
  suppressChainConnectivity: boolean
}

export interface VisibilitySettlingController {
  /** Prime internal state and subscribe to visibility events. Must be called before tick(). */
  start: () => void
  /** Tear down subscription and reset internal state. */
  stop: () => void
  /** Called once per poll. See VisibilitySettlingTickResult. */
  tick: () => VisibilitySettlingTickResult
}

/**
 * Stateful controller that decides when to suppress the chain-connectivity banner
 * after the tab regains visibility (or after a large poll gap suggests the tab was paused).
 *
 * Settling rules:
 * - When the document becomes visible from hidden, the visibilitychange listener captures
 *   `visibleSinceMs = getWallClockTimeMs()` at the event moment.
 * - On each visible poll, suppression stays in effect until either
 *   (a) `blockTimestampUpdatedAt >= visibleSinceMs` — wagmi refetched after refocus, or
 *   (b) `wallClockTimeMs - visibleSinceMs >= visibilitySettlingMs` — the window elapsed.
 * - A "large poll gap" (gap between consecutive visible polls > pollIntervalMs + visibilitySettlingMs)
 *   restarts settling, but only if the visibilitychange listener has not already captured a
 *   refocus newer than the last poll. This preserves the listener-event timestamp so that a
 *   wagmi refetch landing between the listener and the first visible poll is not missed.
 */
export function createVisibilitySettlingController(
  ctx: VisibilitySettlingControllerContext,
): VisibilitySettlingController {
  const {
    getBlockTimestampUpdatedAt,
    getIsDocumentVisible,
    getWallClockTimeMs,
    subscribeToVisibilityChange,
    visibilitySettlingMs,
    pollIntervalMs,
  } = ctx

  // Settling state, mutated across ticks and reset by start()/stop():
  // - wasDocumentVisible: visibility at the previous observation, to detect hidden→visible transitions
  // - visibleSinceMs: wall-clock anchor of the active settling window; null when not settling
  // - lastPollTimeMs: wall-clock time of the last visible tick, used to detect large (device-sleep) gaps
  // - unsubscribeVisibilityChange: teardown handle for the visibilitychange subscription
  let wasDocumentVisible = true
  let visibleSinceMs: number | null = null
  let lastPollTimeMs: number | null = null
  let unsubscribeVisibilityChange: (() => void) | null = null

  /** Begin (or restart) a settling window anchored at `visibleAtMs`. */
  const startSettling = (visibleAtMs: number): void => {
    wasDocumentVisible = true
    visibleSinceMs = visibleAtMs
  }

  /** Listener for visibilitychange events; runs synchronously when the event fires. */
  const updateVisibilityState = (): void => {
    if (!getIsDocumentVisible()) {
      wasDocumentVisible = false
      visibleSinceMs = null
      return
    }

    if (!wasDocumentVisible) {
      startSettling(getWallClockTimeMs())
    }
  }

  const start = (): void => {
    wasDocumentVisible = getIsDocumentVisible()
    visibleSinceMs = null
    lastPollTimeMs = null
    unsubscribeVisibilityChange = subscribeToVisibilityChange(updateVisibilityState)
  }

  const stop = (): void => {
    unsubscribeVisibilityChange?.()
    unsubscribeVisibilityChange = null
    wasDocumentVisible = true
    visibleSinceMs = null
    lastPollTimeMs = null
  }

  const tick = (): VisibilitySettlingTickResult => {
    if (!getIsDocumentVisible()) {
      updateVisibilityState()
      return { shouldEvaluateAlerts: false, suppressChainConnectivity: false }
    }

    const currentTimeMs = getWallClockTimeMs()
    // Capture the previous poll time BEFORE overwriting so we can decide whether the
    // visibilitychange listener already handled a refocus between polls.
    const previousPollTimeMs = lastPollTimeMs
    lastPollTimeMs = currentTimeMs

    if (!wasDocumentVisible) {
      // Defensive: the visibilitychange listener should have handled this, but if it
      // didn't (e.g., subscription lost), start settling from the first visible poll.
      startSettling(currentTimeMs)
    } else if (
      // Browser timers can pause during foreground device sleep without a visibilitychange event.
      // Narrowing previousPollTimeMs to non-null inside this branch is intentional.
      previousPollTimeMs !== null &&
      currentTimeMs - previousPollTimeMs > pollIntervalMs + visibilitySettlingMs
    ) {
      // If the visibilitychange listener already captured a refocus newer than the
      // last visible poll, it has us covered — preserve its timestamp. Otherwise the
      // gap was unobserved (foreground sleep), and we anchor settling to now.
      const listenerAlreadyHandledRefocus = visibleSinceMs !== null && visibleSinceMs > previousPollTimeMs
      if (!listenerAlreadyHandledRefocus) {
        startSettling(currentTimeMs)
      }
    }

    const blockTimestampUpdatedAt = getBlockTimestampUpdatedAt()
    const suppressChainConnectivity =
      visibleSinceMs !== null &&
      !hasSettledAfterBecomingVisible({
        visibleSinceMs,
        blockTimestampUpdatedAt,
        currentTimeMs,
        visibilitySettlingMs,
      })

    // Once settled, clear the anchor so subsequent ticks don't re-enter the settling window.
    if (!suppressChainConnectivity) {
      visibleSinceMs = null
    }

    return { shouldEvaluateAlerts: true, suppressChainConnectivity }
  }

  return { start, stop, tick }
}

/**
 * Returns true once the chain-connectivity check is safe to evaluate after the tab became visible.
 * "Settled" means either the block timestamp refreshed since refocus, or the settling window has elapsed.
 */
function hasSettledAfterBecomingVisible(ctx: {
  visibleSinceMs: number
  blockTimestampUpdatedAt: number
  currentTimeMs: number
  visibilitySettlingMs: number
}): boolean {
  const { visibleSinceMs, blockTimestampUpdatedAt, currentTimeMs, visibilitySettlingMs } = ctx

  return blockTimestampUpdatedAt >= visibleSinceMs || currentTimeMs - visibleSinceMs >= visibilitySettlingMs
}

/**
 * Default `subscribeToVisibilityChange` implementation backed by the DOM `visibilitychange` event.
 * Returns a no-op unsubscribe in non-DOM environments (SSR, tests without a document).
 */
export function subscribeToDocumentVisibilityChange(listener: () => void): () => void {
  if (typeof document === 'undefined') {
    return () => undefined
  }

  document.addEventListener('visibilitychange', listener)

  return () => document.removeEventListener('visibilitychange', listener)
}
