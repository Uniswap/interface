import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useMemo } from 'react'

export function useGasFeeHighRelativeToValue(
  gasFeeUSD: string | undefined,
  value: Maybe<CurrencyAmount<Currency>>
): boolean {
  return useMemo(() => {
    if (!value) {
      return false
    }
    const tenthOfOutputValue = parseFloat(value.toExact()) / 10
    return Number(gasFeeUSD ?? 0) > tenthOfOutputValue
  }, [gasFeeUSD, value])
}
