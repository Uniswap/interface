import { PersistState } from 'redux-persist'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { UserSettingsState } from 'uniswap/src/features/settings/slice'

export type PersistAppStateV20 = {
  _persist: PersistState
  userSettings?: UserSettingsState
}

export const activeLocalCurrencyAtomName = 'activeLocalCurrency'

/**
 * Migrate existing setting atom for currency to shared redux
 */
export const migration20 = (state: PersistAppStateV20 | undefined) => {
  if (!state) {
    return undefined
  }
  // Translate existing atom value
  const atomLocalCurrencyAtomValue = localStorage.getItem(activeLocalCurrencyAtomName) as FiatCurrency
  const migratedAtomCurrency = Object.values(FiatCurrency).includes(atomLocalCurrencyAtomValue)
    ? atomLocalCurrencyAtomValue
    : 'USD' // (FiatCurrency.UnitedStatesDollar)

  // Add migrated value to the existing state
  const newState: any = {
    ...state,
    userSettings: {
      ...state.userSettings,
      currentCurrency: migratedAtomCurrency,
    },
  }

  // Remove the atom locally
  localStorage.removeItem(activeLocalCurrencyAtomName)

  return { ...newState, _persist: { ...state._persist, version: 20 } }
}
