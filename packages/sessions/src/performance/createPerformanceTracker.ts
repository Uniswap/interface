import type { PerformanceTracker } from '@universe/sessions/src/performance/types'

/** Sentinel value indicating performance tracking is disabled */
export const PERFORMANCE_TRACKING_DISABLED = -1

interface CreatePerformanceTrackerContext {
  /** Feature flag to enable/disable performance tracking. Required. */
  getIsPerformanceTrackingEnabled: () => boolean
  /**
   * Injected timing function. This is the actual performance API.
   * Allows the caller to pass performance.now, Date.now, or a mock.
   * Required - no implicit dependency on globalThis.performance.
   */
  getNow: () => number
}

/**
 * Creates a performance tracker with feature flag control.
 *
 * Behavior:
 * - If tracking is disabled (feature flag returns false), returns -1 (sentinel)
 * - Otherwise calls the injected getNow() function
 *
 * The sentinel value (-1) allows analytics consumers to distinguish
 * between "0ms duration" and "tracking was disabled".
 *
 * Note: All dependencies are explicitly passed in - no implicit globals.
 */
function createPerformanceTracker(ctx: CreatePerformanceTrackerContext): PerformanceTracker {
  function now(): number {
    // If disabled via feature flag, return sentinel (-1)
    if (!ctx.getIsPerformanceTrackingEnabled()) {
      return PERFORMANCE_TRACKING_DISABLED
    }

    return ctx.getNow()
  }

  return { now }
}

export { createPerformanceTracker }
export type { CreatePerformanceTrackerContext }
