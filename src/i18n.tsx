import React from 'react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ReactNode, useEffect } from 'react'

export const locales = ['en']
export const defaultLocale = 'en'

locales.map((locale) => i18n.loadLocaleData(locale, { plurals: () => null }))

export async function dynamicActivate(locale: string) {
  const { messages } = await import(`@lingui/loader!./locales/${locale}/messages.po`)
  i18n.load(locale, messages)
  i18n.activate(locale)
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    dynamicActivate(defaultLocale)
  })

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}
