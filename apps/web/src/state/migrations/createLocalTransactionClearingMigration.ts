import { PersistState } from 'redux-persist'

type PersistAppStateWithTransactions = {
  _persist: PersistState
  transactions?: any
}

export function createLocalTransactionClearingMigration(version: number) {
  return (state: PersistAppStateWithTransactions | undefined) => {
    if (!state) {
      return undefined
    }

    return {
      ...state,
      transactions: {},
      _persist: { ...state._persist, version },
    }
  }
}
