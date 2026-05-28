/**
 * Returns the time elapsed since the app started in milliseconds.
 * Uses performance.now() (supported by Hermes) with Date.now() fallback.
 *
 * Note: Unlike the web version, React Native does not support performance.mark(),
 * so we use performance.now() directly which returns milliseconds since app start.
 */
export function calculateElapsedTimeWithPerformanceMarkMs(
  _markName: string,
  fallbackStartTime?: number,
): number | undefined {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now()
  }
  if (fallbackStartTime !== undefined) {
    return Date.now() - fallbackStartTime
  }
  return undefined
}
