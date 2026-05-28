/**
 * Add jitter to a delay to prevent thundering herd on reconnect.
 * Returns a value between minDelay and minDelay + jitterRange.
 */
export function addJitter(minDelay: number, jitterRange: number): number {
  return minDelay + Math.random() * jitterRange
}

/**
 * Default jitter configuration for WebSocket reconnection.
 * Base delay of 1000ms with up to 4000ms additional jitter.
 */
export function getDefaultJitteredDelay(): number {
  return addJitter(1000, 4000)
}
