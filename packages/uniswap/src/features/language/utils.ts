import { Language, mapLocaleToLanguage } from 'uniswap/src/features/language/constants'
import { navigatorLocale } from 'uniswap/src/features/language/hooks'

// Determines the current language based on the user's locale settings, falling back to English if no mapping exists.
export function getCurrentLanguageFromNavigator(): Language {
  const locale = navigatorLocale()
  return locale ? mapLocaleToLanguage[locale] : Language.English
}
