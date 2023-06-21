import { parseUnits } from '@ethersproject/units'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { logger } from 'wallet/src/features/logger/logger'
import { convertScientificNotationToNumber } from 'wallet/src/utils/convertScientificNotation'

export enum ValueType {
  'Raw' = 'uint256', // integer format (the "raw" uint256) - usually used in smart contracts / how data is stored on-chain
  'Exact' = 'float', // float format (the "exact" human readable number) - the typical way to display token amounts to users
}

/**
 * Converts a token value to a currency CurrencyAmount.
 *
 * @param value - The quantity of a given token
 * @param valueType - The format of the token quantity `value`
 * @param currency - The currency which corresponds to the value
 *
 * @example
 * const tokenAmount = getCurrencyAmount({ value: 10000000000000000, valueType: ValueType.Raw, currency })
 */
export function getCurrencyAmount<T extends Currency>({
  value,
  valueType,
  currency,
}: {
  value?: string
  valueType: ValueType
  currency?: T | null
}): CurrencyAmount<T> | null | undefined {
  if (!value || !currency) return undefined

  try {
    let parsedValue = convertScientificNotationToNumber(value)

    if (valueType === ValueType.Exact) {
      parsedValue = parseUnits(parsedValue, currency.decimals).toString()
      if (parsedValue === '0') return null
    }

    return CurrencyAmount.fromRawAmount(currency, parsedValue)
  } catch (error) {
    // will fail when currency decimal information is incorrect
    logger.error('Failed to parse a currency amount', {
      tags: {
        file: 'getCurrencyAmount',
        function: 'getCurrencyAmount',
        value,
        valueType,
        symbol: currency.symbol,
        chain: currency.chainId,
        address: currency.wrapped.address,
        decimals: currency.decimals,
        error: JSON.stringify(error),
      },
    })

    return null
  }
}
