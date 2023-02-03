import { ONE_MINUTE_MS, ONE_SECOND_MS } from 'src/utils/time'
import { isDevBuild } from 'src/utils/version'

// temporarily increase polling on dev builds to test out performance assumptions
const scalingFactor = isDevBuild() ? 0.2 : 1

// Polling interval (in milliseconds) for RTK-Query
export enum PollingInterval {
  Slow = Math.round(scalingFactor * 5 * ONE_MINUTE_MS),
  Normal = Math.round(scalingFactor * ONE_MINUTE_MS),
  Fast = Math.round(scalingFactor * 12 * ONE_SECOND_MS), // block times for mainnet
  LightningMcQueen = 3 * ONE_SECOND_MS, // 3 seconds, approx block times for polygon
}

// Used when referential equality is required
// useful as a catch-all
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EMPTY_ARRAY: any[] = []
