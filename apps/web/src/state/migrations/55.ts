import { PersistState } from 'redux-persist'
import { PreV55SearchResult } from 'uniswap/src/state/oldTypes'
import { migrateSearchHistory } from 'uniswap/src/state/uniswapMigrations'

type PersistAppStateV55 = {
  _persist: PersistState
  searchHistory?: {
    results: PreV55SearchResult[]
  }
}

/**
 * 1. Remove dynamic fields from TokenSearchHistoryResult (name, symbol, logoUrl)
 *    to align with the new structure where these are fetched at runtime instead of stored
 * 2. Merge ENSAddress and Unitag results into WalletByAddress since ens/unitags are dynamic and should be fetched at runtime instead of stored
 * 3. Handle enum reordering - remove ENSAddress and Unitag, and update remaining values
 */
export const migration55 = (state: PersistAppStateV55 | undefined) => {
  if (!state) {
    return undefined
  }

  const newState = migrateSearchHistory(state)

  return { ...newState, _persist: { ...state._persist, version: 55 } }
}
