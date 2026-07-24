import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { MAX_RECENT_SEARCH_RESULTS } from 'uniswap/src/components/TokenSelector/constants'
import { currencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { SearchHistoryResultType, TokenSearchHistoryResult } from 'uniswap/src/features/search/SearchHistoryResult'
import { selectSearchHistory } from 'uniswap/src/features/search/selectSearchHistory'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'

export function useRecentlySearchedTokens(
  chainFilter: UniverseChainId | null,
  {
    chainIds,
    numberOfResults = MAX_RECENT_SEARCH_RESULTS,
  }: {
    chainIds?: UniverseChainId[]
    numberOfResults?: number
  } = {},
): TokenOption[] {
  const searchHistory = useSelector(selectSearchHistory)
  const chainIdSet = useMemo(() => (chainIds ? new Set(chainIds) : undefined), [chainIds])

  const searchHistoryCurrencyInfos = useSearchHistoryToCurrencyInfos(
    searchHistory
      .filter(
        (searchResult): searchResult is TokenSearchHistoryResult => searchResult.type === SearchHistoryResultType.Token,
      )
      // Filter out invalid chainIds to prevent crashes from corrupted search history data
      .filter((searchResult) => isUniverseChainId(searchResult.chainId))
      .filter((searchResult) =>
        chainFilter ? searchResult.chainId === chainFilter : (chainIdSet?.has(searchResult.chainId) ?? true),
      )
      .slice(0, numberOfResults),
  )

  return useMemo(() => {
    return currencyInfosToTokenOptions(searchHistoryCurrencyInfos) ?? []
  }, [searchHistoryCurrencyInfos])
}

function useSearchHistoryToCurrencyInfos(searchHistory: TokenSearchHistoryResult[]): Maybe<CurrencyInfo>[] {
  const currencyIds = searchHistory.map((searchResult) => {
    return searchResult.address
      ? buildCurrencyId(searchResult.chainId, searchResult.address)
      : buildNativeCurrencyId(searchResult.chainId)
  })

  return useCurrencyInfos(currencyIds)
}
