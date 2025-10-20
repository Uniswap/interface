import { PersistState } from 'redux-persist'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { tokenAddressOrNativeAddress } from 'uniswap/src/features/search/utils'
import { isPoolSearchResult, PreV55SearchResult, PreV55SearchResultType } from 'uniswap/src/state/oldTypes'

export type PersistAppStateV17 = {
  _persist: PersistState
  searchHistory?: {
    results: PreV55SearchResult[]
  }
}

// eslint-disable-next-line consistent-return
function searchResultId(searchResult: PreV55SearchResult): string {
  const { type } = searchResult
  const address = isPoolSearchResult(searchResult) ? searchResult.poolId : searchResult.address
  const normalizedAddress = address ? normalizeTokenAddressForCache(address) : null

  switch (type) {
    case PreV55SearchResultType.Token:
      return `token-${searchResult.chainId}-${normalizedAddress}`
    case PreV55SearchResultType.ENSAddress:
      return `ens-${normalizedAddress}`
    case PreV55SearchResultType.Unitag:
      return `unitag-${normalizedAddress}`
    case PreV55SearchResultType.WalletByAddress:
      return `wallet-${normalizedAddress}`
    case PreV55SearchResultType.Etherscan:
      return `etherscan-${normalizedAddress}`
    case PreV55SearchResultType.NFTCollection:
      return `nftCollection-${searchResult.chainId}-${normalizedAddress}`
    case PreV55SearchResultType.Pool:
      return `pool-${searchResult.chainId}-${normalizedAddress}-${searchResult.feeTier}`
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
  newState.searchHistory.results.forEach((result: PreV55SearchResult) => {
    if (result.type === PreV55SearchResultType.Token && result.address) {
      const nativeAddress = tokenAddressOrNativeAddress(result.address, result.chainId)
      if (result.address !== nativeAddress) {
        result.address = nativeAddress
        result.searchId = searchResultId(result)
      }
    }
  })

  // dedupe search history
  const dedupedSearchHistory = newState.searchHistory.results.filter(
    // eslint-disable-next-line max-params
    (result: PreV55SearchResult, index: number, self: PreV55SearchResult[]) =>
      self.findIndex((t) => t.searchId === result.searchId) === index,
  )

  newState.searchHistory.results = dedupedSearchHistory

  return { ...newState, _persist: { ...state._persist, version: 17 } }
}
