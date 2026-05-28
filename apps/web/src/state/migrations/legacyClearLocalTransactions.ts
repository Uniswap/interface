import { PersistState } from 'redux-persist'

type PersistAppStateLocalTransactions = {
  _persist: PersistState
  localWebTransactions?: any
}

export function legacyCreateLocalTransactionClearingMigration(version: number) {
  return (state: PersistAppStateLocalTransactions | undefined) => {
    if (!state) {
      return undefined
    }

    return {
      ...state,
      localWebTransactions: {},
      _persist: { ...state._persist, version },
    }
  }
}
