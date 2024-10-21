import { PersistState } from 'redux-persist'
import { SearchResult, SearchResultType } from 'uniswap/src/features/search/SearchResult'
import { searchResultId } from 'uniswap/src/features/search/searchHistorySlice'
import { tokenAddressOrNativeAddress } from 'uniswap/src/features/search/utils'

export type PersistAppStateV17 = {
  _persist: PersistState
  searchHistory?: {
    results: SearchResult[]
  }
}

/**
 * Move potentially invalid native asset search history items to valid format
 */
export const migration17 = (state: PersistAppStateV17 | undefined) => {
  if (!state) {
    return undefined
  }

  const newState: any = { ...state }

  // amend existing recently searched native assets that were saved with
  // an address when they should not have been
  newState.searchHistory.results.forEach((result: SearchResult) => {
    if (result.type === SearchResultType.Token && result.address) {
      const nativeAddress = tokenAddressOrNativeAddress(result.address, result.chainId)
      if (result.address !== nativeAddress) {
        result.address = nativeAddress
        result.searchId = searchResultId(result)
      }
    }
  })

  // dedupe search history
  const dedupedSearchHistory = newState.searchHistory.results.filter(
    (result: SearchResult, index: number, self: SearchResult[]) =>
      self.findIndex((t) => t.searchId === result.searchId) === index,
  )

  newState.searchHistory.results = dedupedSearchHistory

  return { ...newState, _persist: { ...state._persist, version: 17 } }
}
