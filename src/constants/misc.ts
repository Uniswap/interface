export const DEFAULT_SLIPPAGE_TOLERANCE = 5
export const DEFAULT_DEADLINE_S = 60 * 30 // 30 minutes

// Polling interval (in milliseconds) for RTK-Query
export enum PollingInterval {
  Slow = 5 * 60 * 1000, // 5 minutes
  Normal = 60 * 1000, // 1 minute
  Fast = 15 * 1000, // 15 seconds
}
