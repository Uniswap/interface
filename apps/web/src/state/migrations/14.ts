import { PersistState } from 'redux-persist'
import { LocalWebTransactionState } from 'state/transactions/reducer'

type PersistAppStateV13 = {
  _persist: PersistState
} & { transactions?: LocalWebTransactionState }

export const hideSmallBalancesAtomName = 'hideSmallBalances'
export const hideSpamBalancesAtomName = 'hideSpamBalances'

/**
 * Migrate existing setting atoms to shared redux state
 */
export const migration14 = (state: PersistAppStateV13 | undefined) => {
  if (!state) {
    return
  }

  const newState: any = { ...state }

  const atomSmallBalancesValue = localStorage.getItem(hideSmallBalancesAtomName)
  const atomSpamValue = localStorage.getItem(hideSpamBalancesAtomName)

  // Copy transactions to new name
  newState.userSettings = {
    hideSmallBalances: atomSmallBalancesValue !== 'false',
    hideSpamTokens: atomSpamValue !== 'false',
  }

  // Delete the atom values
  localStorage.removeItem(hideSmallBalancesAtomName)
  localStorage.removeItem(hideSpamBalancesAtomName)

  return { ...newState, _persist: { ...state._persist, version: 14 } }
}
