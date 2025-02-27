import { Currency } from '@uniswap/sdk-core'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useMemo } from 'react'
import { TokenList } from 'uniswap/src/features/dataApi/types'

/**
 * Returns true if the input currency or output currency cannot be traded in the interface
 * @param currencyIn the input currency to check
 * @param currencyOut the output currency to check
 */
export function useIsSwapUnsupported(currencyIn?: Currency, currencyOut?: Currency): boolean {
  const currencyInInfo = useCurrencyInfo(currencyIn)
  const currencyOutInfo = useCurrencyInfo(currencyOut)
  return useMemo(() => {
    return (
      currencyInInfo?.safetyInfo?.tokenList === TokenList.Blocked ||
      currencyOutInfo?.safetyInfo?.tokenList === TokenList.Blocked
    )
  }, [currencyInInfo?.safetyInfo?.tokenList, currencyOutInfo?.safetyInfo?.tokenList])
}
