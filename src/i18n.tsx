import React, { useEffect } from 'react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ReactNode } from 'react'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { SupportedLocale } from 'constants/locales'

export async function dynamicActivate(locale: SupportedLocale) {
  try {
    const { messages } = await import(`@lingui/loader!./locales/${locale}.po`)
    i18n.loadLocaleData(locale, { plurals: () => null })
    i18n.load(locale, messages)
    i18n.activate(locale)
  } catch (error) {
    console.error(`Failed to load locale data for ${locale}`, error)
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useActiveLocale()

  useEffect(() => {
    dynamicActivate(locale)
  }, [locale])

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}
