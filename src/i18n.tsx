import React from 'react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ReactNode } from 'react'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useEffect } from '@storybook/addons'
import { useLocale } from 'state/user/hooks'
import { SupportedLocale, supportedLocales, defaultFallback } from './constants/locales'

function parseLocale(maybeSupportedLocale: string): SupportedLocale | undefined {
  return supportedLocales.find((locale) => locale === maybeSupportedLocale)
}

function navigatorLocale(): SupportedLocale | undefined {
  if (!navigator.language) return undefined

  const [language, region] = navigator.language
    .split('-')
    .map((split, index) => (index === 0 ? split.toLocaleLowerCase() : split.toLocaleUpperCase()))
  return parseLocale(`${language}-${region}`) ?? parseLocale(language)
}

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
  const parsed = useParsedQueryString()
  const userLocale = useLocale()

  useEffect(() => {
    const parsedLocale = (typeof parsed.lng === 'string' && parseLocale(parsed.lng)) || undefined

    dynamicActivate(parsedLocale ?? userLocale ?? navigatorLocale() ?? defaultFallback)
  }, [userLocale, parsed])

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}
