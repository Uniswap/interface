import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import {
  PRICE_DIFFERENCE_CRITICAL_THRESHOLD,
  PRICE_DIFFERENCE_WARNING_THRESHOLD,
} from 'uniswap/src/constants/transactions'
import type { MarginBounds } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'

const WAD = 10n ** 18n
const BPS_DENOM = 10_000n

// Which way the leg trades, which is NOT the position's direction: the swap always sells the
// market's debt to buy its collateral on the way in and the reverse on the way out, for LONG and
// SHORT alike. Keying the sign off direction instead reports every close and delever as favourable.
export type MarginSwapSide = 'BUY_COLLATERAL' | 'SELL_COLLATERAL'

/**
 * Execution price against the venue's oracle mark, in bps, clamped at 0 for a favourable fill.
 * Returns undefined when either price is absent or zero so the row hides instead of rendering NaN.
 *
 * Both prices arrive display-scaled: every margin BL runs them through toDisplayPriceX18,
 * which reciprocates for a SHORT. The reciprocal
 * cancels in the ratio, but not in the expression — (exec−mark)/mark on reciprocated inputs is not
 * the same number — so a SHORT is un-reciprocated first and one formula then covers both.
 *
 * This is execution-vs-ORACLE-mark, not the swap surface's pool-mid price impact: no pool mid is
 * read anywhere in the margin backend, so the figure also carries the standing pool-vs-oracle basis.
 */
export function marginPriceImpactBps(params: {
  execPriceX18: string | undefined
  markPriceX18: string | undefined
  swapSide: MarginSwapSide
  direction: MarginDirection
}): number | undefined {
  const { execPriceX18, markPriceX18, swapSide, direction } = params
  if (!execPriceX18 || !markPriceX18) {
    return undefined
  }
  const execDisplay = BigInt(execPriceX18)
  const markDisplay = BigInt(markPriceX18)
  if (execDisplay <= 0n || markDisplay <= 0n) {
    return undefined
  }

  const exec = direction === MarginDirection.SHORT ? (WAD * WAD) / execDisplay : execDisplay
  const mark = direction === MarginDirection.SHORT ? (WAD * WAD) / markDisplay : markDisplay

  const adverse = swapSide === 'BUY_COLLATERAL' ? exec - mark : mark - exec
  if (adverse <= 0n) {
    return 0
  }
  return Number((adverse * BPS_DENOM) / mark)
}

/**
 * Warning severity for an impact figure, or undefined below the warning threshold — the row is
 * noise at ordinary impacts and only earns its place once the fill is materially worse than the
 * mark. Thresholds are the swap surface's, so margin reads as one product.
 */
export function marginPriceImpactSeverity(bps: number | undefined): WarningSeverity | undefined {
  if (bps === undefined) {
    return undefined
  }
  const percent = bps / 100
  if (percent > PRICE_DIFFERENCE_CRITICAL_THRESHOLD) {
    return WarningSeverity.High
  }
  if (percent > PRICE_DIFFERENCE_WARNING_THRESHOLD) {
    return WarningSeverity.Medium
  }
  return undefined
}

/**
 * Which way an adjust's swap leg trades. The encoder emits an increase (borrow) bound or a decrease
 * (repay) bound, never both, and a plain deposit or withdraw populates neither — that case has no
 * effectivePrice either, so the impact row hides regardless of what this returns.
 */
export function marginAdjustSwapSide(bounds: MarginBounds | undefined): MarginSwapSide {
  return bounds?.decrease ? 'SELL_COLLATERAL' : 'BUY_COLLATERAL'
}
