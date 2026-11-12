import {
  getQuickLaunchFloorPricePerToken as getSdkQuickLaunchFloorPricePerToken,
  getQuickLaunchGraduationPricePerToken as getSdkQuickLaunchGraduationPricePerToken,
  QUICK_LAUNCH_DURATION_SECONDS,
  QUICK_LAUNCH_FLOOR_FDV_USD,
} from '@uniswap/liquidity-launcher-sdk'
import { logger } from 'utilities/src/logger/logger'
import type { CreateAuctionStoreState } from '~/pages/Liquidity/CreateAuction/types'
import { TimeLockPreset } from '~/pages/Liquidity/CreateAuction/types'

// Create-flow glue over the canonical quick-launch preset in `@uniswap/liquidity-launcher-sdk`.
// The defining parameters (supply, 1h duration, floor FDV, permanent buyback-&-burn LP) live in the
// SDK — the single source of truth shared with data-api — so this file only maps them onto the
// wizard store and derives the values the create request needs (floor price, auction window).

/** Preset floor FDV, re-exported from the SDK so importers keep a single reference. */
export { QUICK_LAUNCH_FLOOR_FDV_USD }

/** The canonical 1h window, in milliseconds. */
const QUICK_LAUNCH_DURATION_MS = QUICK_LAUNCH_DURATION_SECONDS * 1000

/** ETH/USD assumed by the price fallbacks when the oracle hasn't resolved yet (~$2.5k ETH). */
const QUICK_LAUNCH_FALLBACK_ETH_USD_PRICE = 2500

// The two fallbacks below are ETH-DENOMINATED (derived at ~$2.5k/ETH). They are only correct for a
// native-ETH raise — the on-chain quick-launch config is ETH-only (rh-cca hardcodes the native
// sentinel; the apps/web handoff omits the graduation pin entirely when the raise is non-native and
// the price is unresolved, see QuickLaunchSection). A degraded oracle drops onto these values, so
// every fallback is logged (below) to make a bad feed visible instead of silently mispricing.

/** Floor price fallback when the ETH/USD oracle hasn't resolved yet — the SDK preset floor at the assumed ETH/USD. */
export const QUICK_LAUNCH_FALLBACK_FLOOR_ETH_PER_TOKEN = getSdkQuickLaunchFloorPricePerToken(
  QUICK_LAUNCH_FALLBACK_ETH_USD_PRICE,
)

/** Graduation price fallback at the same assumed ETH/USD, so the grad/floor ratio holds under fallback too. */
export const QUICK_LAUNCH_FALLBACK_GRADUATION_ETH_PER_TOKEN = getSdkQuickLaunchGraduationPricePerToken(
  QUICK_LAUNCH_FALLBACK_ETH_USD_PRICE,
)

/**
 * Floor price in ETH per token for the preset floor FDV, as a plain decimal (the service rejects
 * scientific notation). Delegates to the SDK derivation; a missing/absurd price maps to the fixed
 * ETH-denominated fallback and is logged so a degraded price feed is observable.
 */
export function getQuickLaunchFloorPricePerToken(raiseUsdPrice: number | null): string {
  if (raiseUsdPrice === null) {
    return QUICK_LAUNCH_FALLBACK_FLOOR_ETH_PER_TOKEN
  }
  try {
    return getSdkQuickLaunchFloorPricePerToken(raiseUsdPrice)
  } catch (error) {
    logger.warn(
      'quickLaunchPreset',
      'getQuickLaunchFloorPricePerToken',
      'floor price derivation failed; using the ETH-denominated fallback floor',
      { error, raiseUsdPrice },
    )
    return QUICK_LAUNCH_FALLBACK_FLOOR_ETH_PER_TOKEN
  }
}

/**
 * Graduation price in ETH per token for the preset graduation FDV, same encoding and fallback
 * behavior as the floor. Sent as the request's `graduation_price_raise_per_token`, which the
 * service turns into `requiredCurrencyRaised = graduationPrice x soldSupply` — decoupling the
 * graduation gate from the floor. A missing/absurd price maps to the fixed ETH-denominated fallback
 * and is logged so a degraded price feed is observable.
 */
export function getQuickLaunchGraduationPricePerToken(raiseUsdPrice: number | null): string {
  if (raiseUsdPrice === null) {
    return QUICK_LAUNCH_FALLBACK_GRADUATION_ETH_PER_TOKEN
  }
  try {
    return getSdkQuickLaunchGraduationPricePerToken(raiseUsdPrice)
  } catch (error) {
    logger.warn(
      'quickLaunchPreset',
      'getQuickLaunchGraduationPricePerToken',
      'graduation price derivation failed; using the ETH-denominated fallback graduation price',
      { error, raiseUsdPrice },
    )
    return QUICK_LAUNCH_FALLBACK_GRADUATION_ETH_PER_TOKEN
  }
}

/** 1-minute start lead — the service only rejects past starts; the standard wizard's 5-minute lead is a UI affordance. */
export const QUICK_LAUNCH_START_LEAD_MINUTES = 1

/** "Instant start": start = now + the quick-launch lead, end = start + the fixed 1h window. */
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
