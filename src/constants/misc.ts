export const DEFAULT_SLIPPAGE_TOLERANCE = 5
export const DEFAULT_DEADLINE_S = 60 * 30 // 30 minutes

// Polling interval (in milliseconds) for RTK-Query
export enum PollingInterval {
  Slow = 5 * 60 * 1000, // 5 minutes
  Normal = 60 * 1000, // 1 minute
  Fast = 12 * 1000, // 12 seconds, block times for mainnet
  LightningMcQueen = 3 * 1000, // 3 seconds, approx block times for polygon
}

// Used when referential equality is required
// useful as a catch-all
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EMPTY_ARRAY: any[] = []
