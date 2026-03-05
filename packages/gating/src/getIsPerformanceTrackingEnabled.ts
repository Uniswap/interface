import { FeatureFlags } from '@universe/gating/src/flags'
import { getFeatureFlag, useFeatureFlag } from '@universe/gating/src/hooks'

/**
 * Returns whether sessions performance tracking is enabled.
 *
 * Defaults to false (disabled) - must be explicitly enabled via Statsig flag.
 * When enabled, session analytics will include duration measurements.
 * When disabled, duration values will be -1 (sentinel value).
 */
function getIsSessionsPerformanceTrackingEnabled(): boolean {
  return getFeatureFlag(FeatureFlags.SessionsPerformanceTrackingEnabled)
}

function useIsSessionsPerformanceTrackingEnabled(): boolean {
  return useFeatureFlag(FeatureFlags.SessionsPerformanceTrackingEnabled)
}

export { getIsSessionsPerformanceTrackingEnabled, useIsSessionsPerformanceTrackingEnabled }
