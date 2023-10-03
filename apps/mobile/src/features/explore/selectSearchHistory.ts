import { MobileState } from 'src/app/reducer'
import { SearchResult } from './SearchResult'

export const selectSearchHistory = (state: MobileState): SearchResult[] => {
  return state.searchHistory.results
}
