import { SearchHistoryResult } from 'uniswap/src/features/search/SearchHistoryResult'
import { UniswapState } from 'uniswap/src/state/uniswapReducer'

export const selectSearchHistory = (state: UniswapState): SearchHistoryResult[] => {
  return state.searchHistory.results
}
