import { ONE_MINUTE_MS } from 'src/utils/time'
import { isDevBuild } from 'src/utils/version'

export const DEFAULT_SLIPPAGE_TOLERANCE = 5
export const DEFAULT_DEADLINE_S = 60 * 30 // 30 minutes in seconds

// temporarily increase polling on dev builds to test out performance assumptions
const scalingFactor = isDevBuild() ? 5 : 1

// Polling interval (in milliseconds) for RTK-Query
export enum PollingInterval {
  Slow = scalingFactor * 5 * ONE_MINUTE_MS * 1000,
  Normal = scalingFactor * ONE_MINUTE_MS * 1000,
  Fast = scalingFactor * 12 * 1000, // block times for mainnet
  LightningMcQueen = 3 * 1000, // 3 seconds, approx block times for polygon
}

// Used when referential equality is required
// useful as a catch-all
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EMPTY_ARRAY: any[] = []
