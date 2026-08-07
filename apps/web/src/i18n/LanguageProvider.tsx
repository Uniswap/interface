import { isTestEnv } from '@universe/environment'
import { ReactNode, useEffect } from 'react'
import { DEFAULT_LOCALE, Locale, mapLocaleToLanguage } from 'uniswap/src/features/language/constants'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { getLocale, navigatorLocale, parseLocale } from 'uniswap/src/features/language/navigatorLocale'
import { setCurrentLanguage } from 'uniswap/src/features/settings/slice'
import { changeLanguage } from 'uniswap/src/i18n'
import { useStateRehydrated } from '~/hooks/useStateRehydrated'
import store from '~/state'
import { useAppDispatch } from '~/state/hooks'

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
  const rehydrated = useStateRehydrated()

  useEffect(() => {
    changeLanguage(locale)
    document.documentElement.setAttribute('lang', locale)
    // stores the selected locale to persist across sessions; `persist/REHYDRATE` replaces
    // `userSettings` wholesale, so this must run again once rehydration completes for the
    // locale to survive in the store (e.g. when set via the `lng` query param)
    dispatch(setCurrentLanguage(mapLocaleToLanguage[locale]))
  }, [locale, rehydrated, dispatch])

  return <>{children}</>
}
