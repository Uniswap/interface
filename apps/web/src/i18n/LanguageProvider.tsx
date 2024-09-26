import { navigatorLocale, parseLocale, storeLocale, useActiveLocale } from 'hooks/useActiveLocale'
import { ReactNode, useEffect } from 'react'
import { useAppDispatch } from 'state/hooks'
import { DEFAULT_LOCALE, mapLocaleToLanguage } from 'uniswap/src/features/language/constants'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { setCurrentLanguage } from 'uniswap/src/features/settings/slice'
import { changeLanguage } from 'uniswap/src/i18n'

function setupInitialLanguage() {
  const lngQuery = typeof window !== 'undefined' ? new URL(window.location.href).searchParams.get('lng') : ''
  const initialLocale = parseLocale(lngQuery) ?? storeLocale() ?? navigatorLocale() ?? DEFAULT_LOCALE
  changeLanguage(initialLocale)
}

if (process.env.NODE_ENV !== 'test') {
  setupInitialLanguage()
}

export function LanguageProvider({ children }: { children: ReactNode }): JSX.Element {
  const activeLocale = useActiveLocale()
  const userLocale = useCurrentLocale()
  const dispatch = useAppDispatch()
  const locale = userLocale || activeLocale

  useEffect(() => {
    changeLanguage(locale)
    document.documentElement.setAttribute('lang', locale)
    // stores the selected locale to persist across sessions
    dispatch(setCurrentLanguage(mapLocaleToLanguage[locale]))
  }, [locale, dispatch])

  return <>{children}</>
}
