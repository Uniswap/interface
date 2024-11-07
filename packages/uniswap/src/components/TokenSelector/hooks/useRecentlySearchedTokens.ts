import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { MAX_RECENT_SEARCH_RESULTS } from 'uniswap/src/components/TokenSelector/constants'
import { currencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { TokenOption } from 'uniswap/src/components/TokenSelector/types'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils'
import { SearchResultType, TokenSearchResult } from 'uniswap/src/features/search/SearchResult'
import { selectSearchHistory } from 'uniswap/src/features/search/selectSearchHistory'
import { currencyId } from 'uniswap/src/utils/currencyId'

export function useRecentlySearchedTokens(chainFilter: UniverseChainId | null): TokenOption[] | undefined {
  const searchHistory = useSelector(selectSearchHistory)

  return useMemo(
    () =>
      currencyInfosToTokenOptions(
        searchHistory
          .filter((searchResult): searchResult is TokenSearchResult => searchResult.type === SearchResultType.Token)
          .filter((searchResult) => (chainFilter ? searchResult.chainId === chainFilter : true))
          .slice(0, MAX_RECENT_SEARCH_RESULTS)
          .map(searchResultToCurrencyInfo),
      ),
    [chainFilter, searchHistory],
  )
}

function searchResultToCurrencyInfo({
  chainId,
  address,
  symbol,
  name,
  logoUrl,
  safetyLevel,
  safetyInfo,
  feeData,
}: TokenSearchResult): CurrencyInfo | null {
  const currency = buildCurrency({
    chainId: chainId as UniverseChainId,
    address,
    decimals: 0, // this does not matter in a context of CurrencyInfo here, as we do not provide any balance
    symbol,
    name,
    buyFeeBps: feeData?.buyFeeBps,
    sellFeeBps: feeData?.sellFeeBps,
  })

  if (!currency) {
    return null
  }

  return buildCurrencyInfo({
    currency,
    currencyId: currencyId(currency),
    logoUrl,
    safetyLevel: safetyLevel ?? SafetyLevel.StrongWarning,
    // defaulting to not spam, as user has searched and chosen this token before
    isSpam: false,
    safetyInfo,
  })
}
