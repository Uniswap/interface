import { PersistState } from 'redux-persist'
import { LocalWebTransactionState } from 'state/migrations/legacy'

export type PersistAppStateV13 = {
  _persist: PersistState
} & { transactions?: LocalWebTransactionState }

/**
 * Renaming transactions to localWebTransactions to disambiguate with wallet
 */
export const migration13 = (state: PersistAppStateV13 | undefined) => {
  if (!state?.transactions) {
    return state
  }

  const newState: any = { ...state }

  // Copy transactions to new name
  newState.localWebTransactions = state.transactions

  // Delete old name
  delete newState.transactions

  return { ...newState, _persist: { ...state._persist, version: 13 } }
}
