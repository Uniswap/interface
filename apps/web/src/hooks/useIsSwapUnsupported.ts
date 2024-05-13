import { Currency } from '@uniswap/sdk-core'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useMemo } from 'react'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

/**
 * Returns true if the input currency or output currency cannot be traded in the interface
 * @param currencyIn the input currency to check
 * @param currencyOut the output currency to check
 */
export function useIsSwapUnsupported(currencyIn?: Currency, currencyOut?: Currency): boolean {
  const currencyInInfo = useCurrencyInfo(currencyIn)
  const currencyOutInfo = useCurrencyInfo(currencyOut)
  return useMemo(() => {
    return currencyInInfo?.safetyLevel === SafetyLevel.Blocked || currencyOutInfo?.safetyLevel === SafetyLevel.Blocked
  }, [currencyInInfo?.safetyLevel, currencyOutInfo?.safetyLevel])
}
