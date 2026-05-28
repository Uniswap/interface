import { ReactNode, useEffect } from 'react'
import store from 'state'
import { useAppDispatch } from 'state/hooks'
import { DEFAULT_LOCALE, Locale, mapLocaleToLanguage } from 'uniswap/src/features/language/constants'
import { getLocale, navigatorLocale, parseLocale, useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { setCurrentLanguage } from 'uniswap/src/features/settings/slice'
import { changeLanguage } from 'uniswap/src/i18n'
import { isTestEnv } from 'utilities/src/environment/env'

function getStoreLocale(): Locale | undefined {
  const storeLanguage = store.getState().userSettings.currentLanguage
  return getLocale(storeLanguage)
}

function setupInitialLanguage() {
  const lngQuery = typeof window !== 'undefined' ? new URL(window.location.href).searchParams.get('lng') : ''
  const initialLocale = parseLocale(lngQuery) ?? getStoreLocale() ?? navigatorLocale() ?? DEFAULT_LOCALE
  changeLanguage(initialLocale)
}

if (!isTestEnv()) {
  setupInitialLanguage()
}

export function LanguageProvider({ children }: { children: ReactNode }): JSX.Element {
  const dispatch = useAppDispatch()
  const locale = useCurrentLocale()

  useEffect(() => {
    changeLanguage(locale)
    document.documentElement.setAttribute('lang', locale)
    // stores the selected locale to persist across sessions
    dispatch(setCurrentLanguage(mapLocaleToLanguage[locale]))
  }, [locale, dispatch])

  return <>{children}</>
}
