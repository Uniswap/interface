import { SupportedLocale } from 'constants/locales'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { Provider } from 'lib/i18n'
import { ReactNode, useCallback } from 'react'
import { useUserLocaleManager } from 'state/user/hooks'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useActiveLocale()
  const [, setUserLocale] = useUserLocaleManager()

  const onActivate = useCallback(
    (locale: SupportedLocale) => {
      document.documentElement.setAttribute('lang', locale)
      setUserLocale(locale) // stores the selected locale to persist across sessions
    },
    [setUserLocale]
  )

  return (
    <Provider locale={locale} forceRenderAfterLocaleChange={false} onActivate={onActivate}>
      {children}
    </Provider>
  )
}
