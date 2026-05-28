import { SearchResult } from 'uniswap/src/features/search/SearchResult'
import { UniswapState } from 'uniswap/src/state/uniswapReducer'

export const selectSearchHistory = (state: UniswapState): SearchResult[] => {
  return state.searchHistory.results
}
