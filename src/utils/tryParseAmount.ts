import { parseUnits } from '@ethersproject/units'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { logger } from 'src/utils/logger'

// try to parse a user entered amount for a given token
export function tryParseAmount<T extends Currency>(
  value?: string,
  currency?: T | null
): CurrencyAmount<T> | null | undefined {
  if (!value || !currency) {
    return undefined
  }
  try {
    const typedValueParsed = parseUnits(value, currency.decimals).toString()
    if (typedValueParsed !== '0') {
      return CurrencyAmount.fromRawAmount(currency, JSBI.BigInt(typedValueParsed))
    }
  } catch (error) {
    // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    logger.debug('tryParseAmount', '', `Failed to parse input amount: "${value}"`, error)
  }
  // necessary for all paths to return a value
  return null
}
