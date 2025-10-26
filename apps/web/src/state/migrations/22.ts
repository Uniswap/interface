import { PersistState } from 'redux-persist'
import { Language } from 'uniswap/src/features/language/constants'
import { getCurrentLanguageFromNavigator } from 'uniswap/src/features/language/utils'
import { isWebApp } from 'utilities/src/platform'

type PersistAppStateV22 = {
  _persist: PersistState
  userSettings?: {
    currentLanguage: Language
  }
}

/**
 * Migration 22: Unset currentLanguage if it is set to English ('en'), and set currentLanguage based on navigator language - (Interface only)
 */
export const migration22 = (state: PersistAppStateV22 | undefined) => {
  if (!state?.userSettings) {
    return undefined
  }

  const newState: any = { ...state }

  if (newState.userSettings.currentLanguage === Language.English && isWebApp) {
    newState.userSettings.currentLanguage = getCurrentLanguageFromNavigator()
  }

  return { ...newState, _persist: { ...state._persist, version: 22 } }
}
