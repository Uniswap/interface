import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import {
  isPoolSearchHistoryResult,
  SearchHistoryResult,
  SearchHistoryResultType,
} from 'uniswap/src/features/search/SearchHistoryResult'

const SEARCH_HISTORY_LENGTH = 5

// eslint-disable-next-line consistent-return
export function searchResultId(searchResult: SearchHistoryResult): string {
  const { type } = searchResult
  const address = isPoolSearchHistoryResult(searchResult) ? searchResult.poolId : searchResult.address
  const normalizedAddress = address ? normalizeTokenAddressForCache(address) : null

  switch (type) {
    case SearchHistoryResultType.Token:
      return `token-${searchResult.chainId}-${normalizedAddress}`
    case SearchHistoryResultType.WalletByAddress:
      return `wallet-${normalizedAddress}`
    case SearchHistoryResultType.Etherscan:
      return `etherscan-${normalizedAddress}`
    case SearchHistoryResultType.NFTCollection:
      return `nftCollection-${searchResult.chainId}-${normalizedAddress}`
    case SearchHistoryResultType.Pool:
      return `pool-${searchResult.chainId}-${normalizedAddress}-${searchResult.feeTier}`
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
      // Store search results with a standard searchId to prevent duplicates
      const searchId = searchResultId(searchResult)
      // Optimistically push search result to array
      state.results.unshift({ ...searchResult, searchId })
      // Filter out to only uniques & keep size under SEARCH_HISTORY_LENGTH
      state.results = state.results
        // eslint-disable-next-line max-params
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
