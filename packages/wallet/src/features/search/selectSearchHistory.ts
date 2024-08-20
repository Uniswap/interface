import { SearchResult } from 'wallet/src/features/search/SearchResult'
import { WalletState } from 'wallet/src/state/walletReducer'

export const selectSearchHistory = (state: WalletState): SearchResult[] => {
  return state.searchHistory.results
}
