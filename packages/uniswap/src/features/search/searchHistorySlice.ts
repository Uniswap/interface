import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { isPoolSearchResult, SearchResult, SearchResultType } from 'uniswap/src/features/search/SearchResult'

const SEARCH_HISTORY_LENGTH = 5

// eslint-disable-next-line consistent-return
export function searchResultId(searchResult: SearchResult): string {
  const { type } = searchResult
  const address = isPoolSearchResult(searchResult) ? searchResult.poolId : searchResult.address
  const normalizedAddress = address?.toLowerCase() ?? null

  switch (type) {
    case SearchResultType.Token:
      return `token-${searchResult.chainId}-${normalizedAddress}`
    case SearchResultType.ENSAddress:
      return `ens-${normalizedAddress}`
    case SearchResultType.Unitag:
      return `unitag-${normalizedAddress}`
    case SearchResultType.WalletByAddress:
      return `wallet-${normalizedAddress}`
    case SearchResultType.Etherscan:
      return `etherscan-${normalizedAddress}`
    case SearchResultType.NFTCollection:
      return `nftCollection-${searchResult.chainId}-${normalizedAddress}`
    case SearchResultType.Pool:
      return `pool-${searchResult.chainId}-${normalizedAddress}-${searchResult.feeTier}`
  }
}

export interface SearchHistoryState {
  results: SearchResult[]
}

export const initialSearchHistoryState: Readonly<SearchHistoryState> = {
  results: [],
}

const slice = createSlice({
  name: 'searchHistory',
  initialState: initialSearchHistoryState,
  reducers: {
    addToSearchHistory: (state, action: PayloadAction<{ searchResult: SearchResult }>) => {
      const { searchResult } = action.payload
      // Store search results with a standard searchId to prevent duplicates
      const searchId = searchResultId(searchResult)
      // Optimistically push search result to array
      state.results.unshift({ ...searchResult, searchId })
      // Filter out to only uniques & keep size under SEARCH_HISTORY_LENGTH
      state.results = state.results
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
