import type { CreateAuctionStoreState } from '~/pages/Liquidity/CreateAuction/types'
import {
  DEFAULT_QUICK_LAUNCH_DURATION,
  QuickLaunchDuration,
  TimeLockPreset,
} from '~/pages/Liquidity/CreateAuction/types'
import { MS_PER_HOUR } from '~/pages/Liquidity/CreateAuction/utils/duration'

// The QuickLaunch v1 preset, using only parameters the live Toucan (CCA) contracts
// support — the doc's mandated-price / escalating-bracket mechanism has no on-chain counterpart.

/** Duration presets behind the quick-launch segmented control: 30 min / 1 h / 4 h per the design brief. */
export const QUICK_LAUNCH_DURATION_MS: Record<QuickLaunchDuration, number> = {
  [QuickLaunchDuration.ThirtyMinutes]: MS_PER_HOUR / 2,
  [QuickLaunchDuration.OneHour]: MS_PER_HOUR,
  [QuickLaunchDuration.FourHours]: 4 * MS_PER_HOUR,
}

/** FDV at the floor price, in USD — the doc's conservative $5k floor (launch threshold ≈ the raise at this FDV). */
export const QUICK_LAUNCH_FLOOR_FDV_USD = 5_000

/** Quick-launch preset supply, in whole tokens. Matches the wizard's default. */
export const QUICK_LAUNCH_TOTAL_SUPPLY_TOKENS = 1_000_000_000

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

/** "Instant start": start = now + the quick-launch lead, end = start + the selected duration preset. */
export function getQuickLaunchAuctionWindow(
  duration: QuickLaunchDuration = DEFAULT_QUICK_LAUNCH_DURATION,
  now: Date = new Date(),
): { startTime: Date; endTime: Date } {
  const startTime = new Date(now.getTime() + QUICK_LAUNCH_START_LEAD_MINUTES * 60 * 1000)
  const endTime = new Date(startTime.getTime() + QUICK_LAUNCH_DURATION_MS[duration])
  return { startTime, endTime }
}

/** Writes a fresh preset window into the store — shared by the quick-launch handoff and the stale-start retry. */
export function applyQuickLaunchAuctionWindow(
  actions: Pick<CreateAuctionStoreState['actions'], 'setStartTime' | 'setEndTime'>,
  duration: QuickLaunchDuration = DEFAULT_QUICK_LAUNCH_DURATION,
): void {
  const { startTime, endTime } = getQuickLaunchAuctionWindow(duration)
  actions.setStartTime(startTime)
  actions.setEndTime(endTime)
}

/** Locks the pool to the quick-launch preset — permanently timelocked LP with buyback & burn; the rest is the wizard default. */
export function applyQuickLaunchPoolPreset(actions: CreateAuctionStoreState['actions']): void {
  actions.setTimeLockEnabled(true)
  actions.setTimeLockPreset(TimeLockPreset.Permanent)
  actions.setBuybackAndBurnEnabled(true)
}
