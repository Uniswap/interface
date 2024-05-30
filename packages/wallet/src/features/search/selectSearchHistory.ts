import { SharedState } from 'wallet/src/state/reducer'
import { SearchResult } from './SearchResult'

export const selectSearchHistory = (state: SharedState): SearchResult[] => {
  return state.searchHistory.results
}
