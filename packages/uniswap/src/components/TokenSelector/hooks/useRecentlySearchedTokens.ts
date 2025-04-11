import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { MAX_RECENT_SEARCH_RESULTS } from 'uniswap/src/components/TokenSelector/constants'
import { currencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { TokenOption } from 'uniswap/src/components/lists/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { SearchResultType, TokenSearchResult } from 'uniswap/src/features/search/SearchResult'
import { selectSearchHistory } from 'uniswap/src/features/search/selectSearchHistory'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'

export function useRecentlySearchedTokens(chainFilter: UniverseChainId | null): TokenOption[] | undefined {
  const searchHistory = useSelector(selectSearchHistory)

  const searchHistoryCurrencyInfos = useSearchHistoryToCurrencyInfos(
    searchHistory
      .filter((searchResult): searchResult is TokenSearchResult => searchResult.type === SearchResultType.Token)
      .filter((searchResult) => (chainFilter ? searchResult.chainId === chainFilter : true))
      .slice(0, MAX_RECENT_SEARCH_RESULTS),
  )

  return useMemo(() => {
    return currencyInfosToTokenOptions(searchHistoryCurrencyInfos)
  }, [searchHistoryCurrencyInfos])
}

// TODO(WEB-5131): Clean up searchHistory slice so that we only save chainId & address to redux
function useSearchHistoryToCurrencyInfos(searchHistory: TokenSearchResult[]): Maybe<CurrencyInfo>[] {
  const currencyIds = searchHistory.map((searchResult) => {
    return searchResult.address
      ? buildCurrencyId(searchResult.chainId, searchResult.address)
      : buildNativeCurrencyId(searchResult.chainId)
  })

  return useCurrencyInfos(currencyIds)
}
