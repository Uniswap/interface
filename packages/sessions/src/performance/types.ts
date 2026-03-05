/**
 * Contract for performance timing.
 * Abstraction over performance.now() that can be:
 * - Injected for testing
 * - Disabled via feature flag
 * - Platform-specific (browser vs React Native vs Node)
 */
export interface PerformanceTracker {
  /** Returns current high-resolution timestamp in milliseconds */
  now(): number
}
