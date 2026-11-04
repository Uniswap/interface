import { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { MAX_RECENT_SEARCH_RESULTS } from 'uniswap/src/components/TokenSelector/constants'
import { currencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import {
  isMultichainTokenSearchHistoryResult,
  isTokenSearchHistoryResult,
  MultichainTokenSearchHistoryResult,
  SearchHistoryResult,
} from 'uniswap/src/features/search/SearchHistoryResult'
import { selectSearchHistory } from 'uniswap/src/features/search/selectSearchHistory'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { CurrencyId } from 'uniswap/src/types/currency'
import {
  buildCurrencyId,
  buildNativeCurrencyId,
  currencyIdToChain,
  normalizeCurrencyIdForMapLookup,
} from 'uniswap/src/utils/currencyId'

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

  const currencyIds = useMemo(() => {
    const isAllowedChain = (chainId: UniverseChainId): boolean =>
      chainFilter ? chainId === chainFilter : (chainIdSet?.has(chainId) ?? true)
    const seen = new Set<string>()
    const ids: CurrencyId[] = []
    for (const searchResult of searchHistory) {
      const id = searchHistoryResultToCurrencyId(searchResult, isAllowedChain)
      const key = id && normalizeCurrencyIdForMapLookup(id)
      if (!id || !key || seen.has(key)) {
        continue
      }
      seen.add(key)
      ids.push(id)
      if (ids.length >= numberOfResults) {
        break
      }
    }
    return ids
  }, [searchHistory, chainFilter, chainIdSet, numberOfResults])

  const searchHistoryCurrencyInfos = useCurrencyInfos(currencyIds)

  return useMemo(() => {
    return currencyInfosToTokenOptions(searchHistoryCurrencyInfos) ?? []
  }, [searchHistoryCurrencyInfos])
}

/**
 * The one currency a history entry contributes to the selector's recents, or undefined when none
 * of its chains pass the filter. A multichain entry is a single row here: its `tdpChainFilter`
 * leg (the one the user picked) when allowed, otherwise the first allowed leg.
 */
function searchHistoryResultToCurrencyId(
  searchResult: SearchHistoryResult,
  isAllowedChain: (chainId: UniverseChainId) => boolean,
): CurrencyId | undefined {
  if (isTokenSearchHistoryResult(searchResult)) {
    // Corrupted history may carry chain ids we no longer support
    if (!isUniverseChainId(searchResult.chainId) || !isAllowedChain(searchResult.chainId)) {
      return undefined
    }
    return searchResult.address
      ? buildCurrencyId(searchResult.chainId, searchResult.address)
      : buildNativeCurrencyId(searchResult.chainId)
  }
  if (isMultichainTokenSearchHistoryResult(searchResult)) {
    return multichainHistoryToCurrencyId(searchResult, isAllowedChain)
  }
  return undefined
}

function multichainHistoryToCurrencyId(
  searchResult: MultichainTokenSearchHistoryResult,
  isAllowedChain: (chainId: UniverseChainId) => boolean,
): CurrencyId | undefined {
  const allowed = searchResult.tokenCurrencyIds.filter((id) => {
    const chainId = currencyIdToChain(id)
    return chainId !== null && isAllowedChain(chainId)
  })
  const preferred = allowed.find((id) => currencyIdToChain(id) === searchResult.tdpChainFilter)
  return preferred ?? allowed[0]
}
