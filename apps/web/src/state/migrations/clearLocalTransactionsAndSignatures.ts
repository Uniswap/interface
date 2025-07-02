import { PersistState } from 'redux-persist'

type PersistAppStateLocalTransactionsAndSignatures = {
  _persist: PersistState
  localWebTransactions?: any
  signatures?: any
}

export function createLocalTransactionAndSignatureClearingMigration(version: number) {
  return (state: PersistAppStateLocalTransactionsAndSignatures | undefined) => {
    if (!state) {
      return undefined
    }

    return {
      ...state,
      localWebTransactions: {},
      signatures: {},
      _persist: { ...state._persist, version },
    }
  }
}
