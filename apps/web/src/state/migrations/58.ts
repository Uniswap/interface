import { PersistState } from 'redux-persist'
import { Language, mapLocaleToLanguage } from 'uniswap/src/features/language/constants'
import { navigatorLocale } from 'uniswap/src/features/language/hooks'

type PersistAppStateV58 = {
  _persist: PersistState
  userSettings?: {
    currentLanguage: Language
  }
}

// Languages that were removed
const REMOVED_LANGUAGES: Language[] = [
  'af' as Language, // Afrikaans
  'ar' as Language, // Arabic
  'ca-ES' as Language, // Catalan
  'cs' as Language, // Czech
  'da' as Language, // Danish
  'el' as Language, // Greek
  'fi' as Language, // Finnish
  'he' as Language, // Hebrew
  'hi' as Language, // Hindi
  'hu' as Language, // Hungarian
  'it' as Language, // Italian
  'ms' as Language, // Malay
  'no' as Language, // Norwegian
  'pl' as Language, // Polish
  'ro' as Language, // Romanian
  'sr' as Language, // Serbian
  'sv' as Language, // Swedish
  'sw' as Language, // Swahili
  'uk' as Language, // Ukrainian
  'ur' as Language, // Urdu
]

/**
 * Gets the browser's default language, falling back to English if unavailable
 */
function getBrowserLanguageOrEnglish(): Language {
  try {
    const locale = navigatorLocale()
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (locale && mapLocaleToLanguage[locale]) {
      return mapLocaleToLanguage[locale]
    }
  } catch {
    // If there's any error accessing navigator language, fall back to English
  }
  return Language.English
}

/**
 * Migration 58: Reset currentLanguage to browser default (or English if unavailable) if it is set to a removed language
 */
export const migration58 = (state: PersistAppStateV58 | undefined) => {
  if (!state?.userSettings) {
    return state ? { ...state, _persist: { ...state._persist, version: 58 } } : undefined
  }

  // Check if the current language is one of the removed languages
  if (REMOVED_LANGUAGES.includes(state.userSettings.currentLanguage)) {
    return {
      ...state,
      userSettings: {
        ...state.userSettings,
        currentLanguage: getBrowserLanguageOrEnglish(),
      },
      _persist: { ...state._persist, version: 58 },
    }
  }

  return { ...state, _persist: { ...state._persist, version: 58 } }
}
