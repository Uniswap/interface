import {
  QUICK_LAUNCH_DURATION_SECONDS,
  QUICK_LAUNCH_FLOOR_FDV_USD,
  QUICK_LAUNCH_TOTAL_SUPPLY,
} from '@uniswap/liquidity-launcher-sdk'
import type { CreateAuctionStoreState } from '~/pages/Liquidity/CreateAuction/types'
import { TimeLockPreset } from '~/pages/Liquidity/CreateAuction/types'

// Create-flow glue over the canonical quick-launch preset in `@uniswap/liquidity-launcher-sdk`.
// The defining parameters (supply, 4h duration, floor FDV, permanent buyback-&-burn LP) live in the
// SDK — the single source of truth shared with data-api — so this file only maps them onto the
// wizard store and derives the values the create request needs (floor price, auction window).

/** $5k floor FDV, re-exported from the SDK so importers keep a single reference. */
export { QUICK_LAUNCH_FLOOR_FDV_USD }

/** Total supply in whole tokens (1B), for the plain-number floor-price math below. */
const QUICK_LAUNCH_TOTAL_SUPPLY_TOKENS = Number(QUICK_LAUNCH_TOTAL_SUPPLY)

/** The canonical 4h window, in milliseconds. */
const QUICK_LAUNCH_DURATION_MS = QUICK_LAUNCH_DURATION_SECONDS * 1000

/** Floor price fallback when the ETH/USD oracle hasn't resolved yet (assumes ~$2.5k ETH). */
export const QUICK_LAUNCH_FALLBACK_FLOOR_ETH_PER_TOKEN = '0.000000002'

/** Floor price in ETH per token for the $5k-FDV floor, as a plain decimal (the service rejects scientific notation). */
export function getQuickLaunchFloorPricePerToken(raiseUsdPrice: number | null): string {
  if (raiseUsdPrice === null || !Number.isFinite(raiseUsdPrice) || raiseUsdPrice <= 0) {
    return QUICK_LAUNCH_FALLBACK_FLOOR_ETH_PER_TOKEN
  }
  const floorUsdPerToken = QUICK_LAUNCH_FLOOR_FDV_USD / QUICK_LAUNCH_TOTAL_SUPPLY_TOKENS
  const floorEthPerToken = floorUsdPerToken / raiseUsdPrice
  const fixed = floorEthPerToken.toFixed(18).replace(/0+$/, '').replace(/\.$/, '')
  // A sub-wei floor (absurd oracle value) serializes as "0", which the backend reads as unset.
  return fixed === '0' || fixed === '' ? QUICK_LAUNCH_FALLBACK_FLOOR_ETH_PER_TOKEN : fixed
}

/** 1-minute start lead — the service only rejects past starts; the standard wizard's 5-minute lead is a UI affordance. */
export const QUICK_LAUNCH_START_LEAD_MINUTES = 1

/** "Instant start": start = now + the quick-launch lead, end = start + the fixed 4h window. */
export function getQuickLaunchAuctionWindow(now: Date = new Date()): { startTime: Date; endTime: Date } {
  const startTime = new Date(now.getTime() + QUICK_LAUNCH_START_LEAD_MINUTES * 60 * 1000)
  const endTime = new Date(startTime.getTime() + QUICK_LAUNCH_DURATION_MS)
  return { startTime, endTime }
}

/** Writes a fresh preset window into the store — shared by the quick-launch handoff and the stale-start retry. */
export function applyQuickLaunchAuctionWindow(
  actions: Pick<CreateAuctionStoreState['actions'], 'setStartTime' | 'setEndTime'>,
): void {
  const { startTime, endTime } = getQuickLaunchAuctionWindow()
  actions.setStartTime(startTime)
  actions.setEndTime(endTime)
}

/** Locks the pool to the quick-launch preset — permanently timelocked LP with buyback & burn; the rest is the wizard default. */
export function applyQuickLaunchPoolPreset(actions: CreateAuctionStoreState['actions']): void {
  actions.setTimeLockEnabled(true)
  actions.setTimeLockPreset(TimeLockPreset.Permanent)
  actions.setBuybackAndBurnEnabled(true)
}
