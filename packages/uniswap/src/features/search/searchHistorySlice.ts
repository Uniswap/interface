import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { normalizeTokenAddressForCache } from '@universe/chains'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import {
  isMultichainTokenSearchHistoryResult,
  isTokenSearchHistoryResult,
  SearchHistoryResult,
  SearchHistoryResultType,
} from 'uniswap/src/features/search/SearchHistoryResult'

// Capped per type so a burst of one type can't evict another tab's recents.
const SEARCH_HISTORY_LENGTH_PER_TYPE = 30

// Multichain and single-chain tokens share the Tokens tab, so they share a cap.
function capKey(result: SearchHistoryResult): SearchHistoryResultType {
  return result.type === SearchHistoryResultType.MultichainToken ? SearchHistoryResultType.Token : result.type
}

/** Dedupes by searchId (first occurrence wins) and keeps at most SEARCH_HISTORY_LENGTH_PER_TYPE per type. */
function trimSearchHistory(results: SearchHistoryResult[]): SearchHistoryResult[] {
  const seenIds = new Set<string | undefined>()
  const countByType = new Map<SearchHistoryResultType, number>()
  return results.filter((result) => {
    if (seenIds.has(result.searchId)) {
      return false
    }
    seenIds.add(result.searchId)
    const key = capKey(result)
    const count = (countByType.get(key) ?? 0) + 1
    countByType.set(key, count)
    return count <= SEARCH_HISTORY_LENGTH_PER_TYPE
  })
}

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

      const searchId = searchResultId(searchResult)
      state.results = trimSearchHistory([{ ...searchResult, searchId }, ...state.results])
    },
    clearSearchHistory: (state) => {
      state.results = []
    },
  },
})

export const { addToSearchHistory, clearSearchHistory } = slice.actions
export const { reducer: searchHistoryReducer } = slice
