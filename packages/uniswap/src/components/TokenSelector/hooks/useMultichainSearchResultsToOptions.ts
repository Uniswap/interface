import { useMemo } from 'react'
import { MultichainTokenOption, OnchainItemListOptionType } from 'uniswap/src/components/lists/items/types'
import { MultichainSearchResult } from 'uniswap/src/features/dataApi/types'

export function multichainSearchResultsToOptions(
  results: MultichainSearchResult[] | undefined,
): MultichainTokenOption[] | undefined {
  if (!results) {
    return undefined
  }

  return results.reduce<MultichainTokenOption[]>((acc, r) => {
    const primaryCurrencyInfo = r.tokens[0]
    if (primaryCurrencyInfo) {
      acc.push({
        type: OnchainItemListOptionType.MultichainToken,
        multichainResult: r,
        primaryCurrencyInfo,
      })
    }
    return acc
  }, [])
}

export function useMultichainSearchResultsToOptions({
  results,
}: {
  results?: MultichainSearchResult[]
}): MultichainTokenOption[] | undefined {
  return useMemo(() => multichainSearchResultsToOptions(results), [results])
}
