/** Vocabulary shared by the common/ views. Product folders may import it; it imports nothing from them. */
import type { WarningLevel } from '@universe/transactions-ui/src/common/warningLevel'

/** An exchange rate in both directions, pre-formatted. */
export interface RateDisplay {
  /** e.g. `1 UNI = 0.0031 ETH` */
  rate: string
  /** Fiat value of the `rate` side, pre-formatted. The swap adapter passes the formatter's placeholder (`-`) when the price is unknown; other callers may omit it. */
  rateUsd?: string
  /** Set only when `rate` was abbreviated (e.g. `1.24B`): the same rate written out in full, shown on hover. */
  fullPrecisionRate?: string
  /** e.g. `1 ETH = 322.58 UNI` */
  invertedRate: string
  invertedRateUsd?: string
  invertedFullPrecisionRate?: string
}

/** The slippage tolerance a transaction executes under, pre-formatted. */
export interface SlippageDisplay {
  /** Formatted percent, e.g. `0.50%`. */
  tolerance: string
  /** Tolerance is exactly 0; the row renders "None" instead of `tolerance`. */
  isZero: boolean
  /** User set the tolerance by hand. false = auto, which renders the Auto pill. */
  isCustom: boolean
  /** Tolerance exceeds the auto value; the value renders in the warning color. */
  exceedsAuto: boolean
}

/**
 * How risky the slippage tolerance is, for the slippage editors and the settings trigger.
 * `warning`: above the auto value, or (LP, native pools) below the minimum the pool needs.
 * `critical`: at or above the frontrun threshold (20% today). Within range means no prop.
 * Adapters derive it from the same comparisons uniswap's getSlippageWarningColor makes.
 */
export type SlippageWarningLevel = Extract<WarningLevel, 'warning' | 'critical'>
