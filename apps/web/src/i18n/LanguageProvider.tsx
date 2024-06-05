import { useActiveLocale } from 'hooks/useActiveLocale'
import { dynamicActivate } from 'i18n/dynamicActivate'
import { ReactNode, useEffect } from 'react'
import { useUserLocaleManager } from 'state/user/hooks'

export function LanguageProvider({ children }: { children: ReactNode }): JSX.Element {
  const activeLocale = useActiveLocale()
  const [userLocale, setUserLocale] = useUserLocaleManager()
  const locale = userLocale || activeLocale

  useEffect(() => {
    dynamicActivate(locale)
    document.documentElement.setAttribute('lang', locale)
    setUserLocale(locale) // stores the selected locale to persist across sessions
  }, [setUserLocale, locale])

  return <>{children}</>
}
