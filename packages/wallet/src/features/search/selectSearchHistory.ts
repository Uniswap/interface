import { SearchResult } from 'wallet/src/features/search/SearchResult'
import { SharedState } from 'wallet/src/state/reducer'

export const selectSearchHistory = (state: SharedState): SearchResult[] => {
  return state.searchHistory.results
}
