import { PersistState } from 'redux-persist'

type PersistAppStateV14 = {
  _persist: PersistState
}

export const hideSmallBalancesAtomName = 'hideSmallBalances'
export const hideSpamBalancesAtomName = 'hideSpamBalances'

/**
 * Migrate existing setting atoms to shared redux state
 */
export const migration14 = (state: PersistAppStateV14 | undefined) => {
  if (!state) {
    return undefined
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
