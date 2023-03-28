import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'src/app/rootReducer'
import { ChainId } from 'src/constants/chains'
import { SafetyLevel } from 'src/data/__generated__/types-and-hooks'

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
  primaryENSName?: string
}

export interface TokenSearchResult extends SearchResultBase {
  type: SearchResultType.Token
  chainId: ChainId
  address: Address | null
  name: string
  symbol: string
  logoUrl: string | null
  safetyLevel: SafetyLevel
}

export interface EtherscanSearchResult extends SearchResultBase {
  type: SearchResultType.Etherscan
  address: Address
}

export type SearchResult = TokenSearchResult | WalletSearchResult | EtherscanSearchResult

export function searchResultId(searchResult: SearchResult): string {
  switch (searchResult.type) {
    case SearchResultType.Token:
      return `token-${searchResult.chainId}-${searchResult.address}`
    case SearchResultType.Wallet:
      return `wallet-${searchResult.address}`
    case SearchResultType.Etherscan:
      return `etherscan-${searchResult.address}`
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
export const { reducer: searchHistoryReducer } = slice
