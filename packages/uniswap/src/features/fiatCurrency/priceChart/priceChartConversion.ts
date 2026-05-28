import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import type {
  FiatDeltaFormatOptions,
  FormattedFiatDelta,
} from 'uniswap/src/features/fiatCurrency/priceChart/formatters/shared/types'
import { createStablecoinFormatter } from 'uniswap/src/features/fiatCurrency/priceChart/formatters/stablecoinFormatter'
import { createStandardFormatter } from 'uniswap/src/features/fiatCurrency/priceChart/formatters/standardFormatter'

/**
 * Utility for formatting fiat currency delta values in price charts.
 *
 * This module provides specialized formatting for price change amounts with:
 * - Dynamic decimal precision based on value magnitude (2-6 decimal places)
 * - Threshold formatting for very small values (<$0.000001)
 * - Intelligent trailing zero trimming while preserving minimum decimals
 * - Support for multiple fiat currencies with proper symbol extraction
 * - Special handling for stablecoins (simplified precision rules)
 */
export function formatChartFiatDelta({
  startingPrice,
  endingPrice,
  isStablecoin = false,
  currency = FiatCurrency.UnitedStatesDollar,
  formatNumberOrString,
}: FiatDeltaFormatOptions): FormattedFiatDelta {
  const formatter = isStablecoin ? createStablecoinFormatter() : createStandardFormatter()
  const rawDelta = endingPrice - startingPrice

  const formatted = formatter.format({
    value: rawDelta,
    currency,
    formatNumberOrString,
  })

  const belowThreshold = formatter.shouldShowBelowThreshold(Math.abs(rawDelta))

  return {
    formatted,
    rawDelta,
    ...(belowThreshold && { belowThreshold: true }),
  }
}
