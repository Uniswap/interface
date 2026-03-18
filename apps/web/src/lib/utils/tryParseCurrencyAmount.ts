import { parseUnits } from '@ethersproject/units'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { logger } from 'utilities/src/logger/logger'

function truncateValue(value: string, decimals: number): string {
  const parts = value.split(/[.,]/)
  const symbol = value.includes('.') ? '.' : ','
  if (parts.length > 1 && parts[1].length > decimals) {
    return parts[0] + symbol + parts[1].slice(0, decimals)
  }
  return value
}

/**
 * Parses a CurrencyAmount from the passed string.
 * Returns the CurrencyAmount, or undefined if parsing fails.
 */
export default function tryParseCurrencyAmount<T extends Currency>(
  value?: string,
  currency?: Maybe<T>,
): CurrencyAmount<T> | undefined {
  if (!value || !currency || isNaN(parseFloat(value))) {
    return undefined
  }
  try {
    const typedValueParsed = parseUnits(truncateValue(value, currency.decimals), currency.decimals).toString()
    if (typedValueParsed !== '0') {
      return CurrencyAmount.fromRawAmount(currency, JSBI.BigInt(typedValueParsed))
    }
  } catch (error) {
    // fails if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    logger.debug('tryParseCurrencyAmount', 'tryParseCurrencyAmount', `Failed to parse input amount: "${value}"`, error)
  }
  return undefined
}
