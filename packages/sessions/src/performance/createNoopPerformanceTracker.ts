import { PERFORMANCE_TRACKING_DISABLED } from '@universe/sessions/src/performance/createPerformanceTracker'
import type { PerformanceTracker } from '@universe/sessions/src/performance/types'

/**
 * Creates a noop performance tracker that always returns the disabled sentinel.
 * Use this when performance tracking is not needed (e.g., extension, mobile, tests).
 */
function createNoopPerformanceTracker(): PerformanceTracker {
  return { now: () => PERFORMANCE_TRACKING_DISABLED }
}

export { createNoopPerformanceTracker }
