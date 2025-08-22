import { PersistState } from 'redux-persist'

type PersistAppStateLocalTransactions = {
  _persist: PersistState
  transactions?: any
}

export function createLocalTransactionClearingMigration(version: number) {
  return (state: PersistAppStateLocalTransactions | undefined) => {
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
