import { useMemo } from 'react'
import { OnchainItemListOptionType, PoolOption } from 'uniswap/src/components/lists/items/types'
import { PoolSearchResult } from 'uniswap/src/features/search/SearchResult'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { CurrencyId } from 'uniswap/src/types/currency'

export function usePoolSearchResultsToPoolOptions(searchResults: PoolSearchResult[]): PoolOption[] {
  // combine all pool search results' tokens' currencyIds in an array of de-duped currencyIds
  // & then fetch currencyInfos for all
  const currencyIds: CurrencyId[] = useMemo(
    () => Array.from(new Set(searchResults.flatMap((result) => [result.token0CurrencyId, result.token1CurrencyId]))),
    [searchResults],
  )
  const currencyInfos = useCurrencyInfos(currencyIds)

  return useMemo(() => {
    // create a map of { currencyId: currencyInfo }
    const currencyIdToCurrencyInfo = Object.fromEntries(
      currencyInfos.map((currencyInfo) => [currencyInfo?.currencyId.toLowerCase(), currencyInfo]),
    )

    // build PoolOptions
    return searchResults
      .map((searchResult): PoolOption | undefined => {
        const { chainId, poolId, protocolVersion, hookAddress, feeTier, token0CurrencyId, token1CurrencyId } =
          searchResult
        const token0CurrencyInfo = currencyIdToCurrencyInfo[token0CurrencyId.toLowerCase()]
        const token1CurrencyInfo = currencyIdToCurrencyInfo[token1CurrencyId.toLowerCase()]

        if (!poolId || !chainId || !protocolVersion || !feeTier || !token0CurrencyInfo || !token1CurrencyInfo) {
          return undefined
        }

        return {
          type: OnchainItemListOptionType.Pool,
          poolId,
          chainId,
          protocolVersion,
          hookAddress,
          feeTier,
          token0CurrencyInfo,
          token1CurrencyInfo,
        }
      })
      .filter((option): option is PoolOption => option !== undefined)
  }, [currencyInfos, searchResults])
}
