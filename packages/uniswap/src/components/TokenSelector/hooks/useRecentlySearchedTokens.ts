import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { MAX_RECENT_SEARCH_RESULTS } from 'uniswap/src/components/TokenSelector/constants'
import { currencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { SearchHistoryResultType, TokenSearchHistoryResult } from 'uniswap/src/features/search/SearchHistoryResult'
import { selectSearchHistory } from 'uniswap/src/features/search/selectSearchHistory'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'

export function useRecentlySearchedTokens(
  chainFilter: UniverseChainId | null,
  numberOfResults = MAX_RECENT_SEARCH_RESULTS,
): TokenOption[] {
  const searchHistory = useSelector(selectSearchHistory)

  const searchHistoryCurrencyInfos = useSearchHistoryToCurrencyInfos(
    searchHistory
      .filter(
        (searchResult): searchResult is TokenSearchHistoryResult => searchResult.type === SearchHistoryResultType.Token,
      )
      .filter((searchResult) => (chainFilter ? searchResult.chainId === chainFilter : true))
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
