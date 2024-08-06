import { DEFAULT_LOCALE } from 'constants/locales'
import { navigatorLocale, parseLocale, storeLocale, useActiveLocale } from 'hooks/useActiveLocale'
import { ReactNode, useEffect } from 'react'
import { useUserLocaleManager } from 'state/user/hooks'
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
  const [userLocale, setUserLocale] = useUserLocaleManager()
  const locale = userLocale || activeLocale

  useEffect(() => {
    changeLanguage(locale)
    document.documentElement.setAttribute('lang', locale)
    setUserLocale(locale) // stores the selected locale to persist across sessions
  }, [setUserLocale, locale])

  return <>{children}</>
}
