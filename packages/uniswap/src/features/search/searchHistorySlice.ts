import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import {
  isMultichainTokenSearchHistoryResult,
  isTokenSearchHistoryResult,
  SearchHistoryResult,
  SearchHistoryResultType,
} from 'uniswap/src/features/search/SearchHistoryResult'

const SEARCH_HISTORY_LENGTH = 5

export function searchResultId(searchResult: SearchHistoryResult): string {
  switch (searchResult.type) {
    case SearchHistoryResultType.Token: {
      const normalizedAddress = searchResult.address ? normalizeTokenAddressForCache(searchResult.address) : null
      return `token-${searchResult.chainId}-${normalizedAddress}`
    }
    case SearchHistoryResultType.WalletByAddress: {
      const normalizedAddress = normalizeTokenAddressForCache(searchResult.address)
      return `wallet-${normalizedAddress}`
    }
    case SearchHistoryResultType.Etherscan: {
      const normalizedAddress = normalizeTokenAddressForCache(searchResult.address)
      return `etherscan-${normalizedAddress}`
    }
    case SearchHistoryResultType.Pool: {
      const normalizedAddress = normalizeTokenAddressForCache(searchResult.poolId)
      return `pool-${searchResult.chainId}-${normalizedAddress}-${searchResult.feeTier}`
    }
    case SearchHistoryResultType.MultichainToken: {
      const suffix = searchResult.tdpChainFilter != null ? String(searchResult.tdpChainFilter) : 'all'
      return `multichain-token-${searchResult.multichainId}-${suffix}`
    }
    default: {
      const _unexpected: never = searchResult
      throw new Error(`Unexpected search history type: ${String(_unexpected)}`)
    }
  }
}

export interface SearchHistoryState {
  results: SearchHistoryResult[]
}

export const initialSearchHistoryState: Readonly<SearchHistoryState> = {
  results: [],
}

const slice = createSlice({
  name: 'searchHistory',
  initialState: initialSearchHistoryState,
  reducers: {
    addToSearchHistory: (state, action: PayloadAction<{ searchResult: SearchHistoryResult }>) => {
      const { searchResult } = action.payload

      // Validate chainId for token results to prevent storing invalid data
      if (isTokenSearchHistoryResult(searchResult) && !isUniverseChainId(searchResult.chainId)) {
        return
      }

      if (
        isMultichainTokenSearchHistoryResult(searchResult) &&
        (!searchResult.multichainId || !searchResult.tokenCurrencyIds.length)
      ) {
        return
      }

      // Store search results with a standard searchId to prevent duplicates
      const searchId = searchResultId(searchResult)
      // Optimistically push search result to array
      state.results.unshift({ ...searchResult, searchId })
      // Filter out to only uniques & keep size under SEARCH_HISTORY_LENGTH
      state.results = state.results
        // oxlint-disable-next-line max-params
        .filter((result, index, self) => index === self.findIndex((value) => value.searchId === result.searchId))
        .slice(0, SEARCH_HISTORY_LENGTH)
    },
    clearSearchHistory: (state) => {
      state.results = []
    },
  },
})

export const { addToSearchHistory, clearSearchHistory } = slice.actions
export const { reducer: searchHistoryReducer } = slice
