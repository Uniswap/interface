import { PersistState } from 'redux-persist'

export type PersistAppStateV18 = {
  _persist: PersistState
  userSettings?: {
    hideSmallBalances: boolean
    hideSpamTokens: boolean
  }
}

/**
 * Migrate existing UserSettings to set any missing default values, since currentLanguage and currentCurrency are overwritten in migration14.
 */
export const migration18 = (state: PersistAppStateV18 | undefined) => {
  if (!state?.userSettings) {
    return undefined
  }
  const newState: any = { ...state }

  // default values sourced from `initialUserSettingsState` in settings slice at time of writing migration
  newState.userSettings.currentLanguage ??= 'en' // sourced from `Language.English` at time of writing migration
  newState.userSettings.currentCurrency ??= 'USD' // sourced from `FiatCurrency.UnitedStatesDollar` at time of writing migration

  return { ...newState, _persist: { ...state._persist, version: 18 } }
}
