import { PersistState } from 'redux-persist'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { getDeviceFiatCurrency } from 'uniswap/src/features/fiatCurrency/utils'
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
    : getDeviceFiatCurrency() // Also runs for first-time visitors, so this is the web default.

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
