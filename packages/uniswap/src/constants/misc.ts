import { ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'

// Polling interval (in milliseconds) for data fetching
export enum PollingInterval {
  Slow = 5 * ONE_MINUTE_MS,
  Normal = ONE_MINUTE_MS,
  KindaFast = 30 * ONE_SECOND_MS,
  Fast = 15 * ONE_SECOND_MS, // slightly higher than block times for mainnet
  LightningMcQueen = 6 * ONE_SECOND_MS, // slightly higher than block times for polygon
}

export const BIPS_BASE = 10_000

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
