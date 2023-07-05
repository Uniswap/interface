import { ONE_MINUTE_MS, ONE_SECOND_MS } from 'wallet/src/utils/time'

// Polling interval (in milliseconds) for RTK-Query
export enum PollingInterval {
  Slow = 5 * ONE_MINUTE_MS,
  Normal = ONE_MINUTE_MS,
  KindaFast = 30 * ONE_SECOND_MS,
  Fast = 12 * ONE_SECOND_MS, // block times for mainnet
  LightningMcQueen = 3 * ONE_SECOND_MS, // 3 seconds, approx block times for polygon
}

// Used when referential equality is required
// useful as a catch-all

export const EMPTY_ARRAY = undefined
