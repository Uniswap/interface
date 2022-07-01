import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'src/app/rootReducer'

const SEARCH_HISTORY_LENGTH = 5

export enum SearchResultType {
  Wallet,
  Token,
  Etherscan,
}

export interface SearchResultBase {
  type: SearchResultType
  searchId?: string
}

export interface WalletSearchResult extends SearchResultBase {
  type: SearchResultType.Wallet
  address: Address
  ensName?: string
}

export interface TokenSearchResult extends SearchResultBase {
  type: SearchResultType.Token
  id: string
  name: string
  symbol: string
  image: string
}

export interface EtherscanSearchResult extends SearchResultBase {
  type: SearchResultType.Etherscan
  address: Address
}

export type SearchResult = TokenSearchResult | WalletSearchResult | EtherscanSearchResult

export function searchResultId(searchResult: SearchResult) {
  switch (searchResult.type) {
    case SearchResultType.Token:
      return `token-${(searchResult as TokenSearchResult).id}`
    case SearchResultType.Wallet:
      return `wallet-${(searchResult as WalletSearchResult).address}`
    case SearchResultType.Etherscan:
      return `etherscan-${(searchResult as EtherscanSearchResult).address}`
  }
}

export interface SearchHistoryState {
  results: SearchResult[]
}

const initialSearchHistoryState: Readonly<SearchHistoryState> = {
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
        .filter(
          (result, index, self) =>
            index === self.findIndex((value) => value.searchId === result.searchId)
        )
        .slice(0, SEARCH_HISTORY_LENGTH)
    },
    clearSearchHistory: (state) => {
      state.results = []
    },
  },
})

export const selectSearchHistory = (state: RootState): SearchResult[] => {
  return state.searchHistory.results
}

export const { addToSearchHistory, clearSearchHistory } = slice.actions
export const { reducer: searchHistoryReducer, actions: searchHistoryActions } = slice
