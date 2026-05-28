import { PersistState } from 'redux-persist'
import { Language, Locale, mapLocaleToLanguage } from 'uniswap/src/features/language/constants'

export type PersistAppStateV19 = {
  _persist: PersistState
  user?: {
    userLocale: string
  }
  userSettings?: {
    currentLanguage: Language
  }
}

/**
 * Migrate existing UserSettings to set any missing default values, since currentLanguage and currentCurrency are overwritten in migration14.
 */
export const migration19 = (state: PersistAppStateV19 | undefined) => {
  if (!state) {
    return undefined
  }

  // Copy state
  const newState: any = { ...state }

  // lookup table from old locale to new locale
  const oldToNew = {
    'zh-CN': Locale.ChineseSimplified,
    'zh-TW': Locale.ChineseTraditional,
  }

  // migrate old language if an equivalent exists
  const oldLocale = state.user?.userLocale
  if (oldLocale) {
    const oldLocaleTranslated = Object.keys(oldToNew).includes(oldLocale)
      ? oldToNew[oldLocale as 'zh-CN' | 'zh-TW']
      : (oldLocale as Locale)
    if (Object.values(Locale).includes(oldLocaleTranslated)) {
      newState.userSettings.currentLanguage = mapLocaleToLanguage[oldLocaleTranslated]
    }
  }

  // remove old locale state
  delete newState.user.userLocale

  return { ...newState, _persist: { ...state._persist, version: 19 } }
}
