import React from 'react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { detect, fromNavigator } from '@lingui/detect-locale'
import { ReactNode } from 'react'

export const supportedLocales = [
  'en',
  'pseudo-en',
  'de',
  'es-AR',
  'es-US',
  'it-IT',
  'iw',
  'ro',
  'ru',
  'vi',
  'zh-CN',
  'zh-TW',
]
export const defaultFallback = () => 'en'

export const isSupportedLocale = (locale: string): boolean => supportedLocales.includes(locale)

export const getDetectedLocale = (): string => {
  const detected = detect(fromNavigator())
  return detected && isSupportedLocale(detected) ? detected : defaultFallback()
}

export async function dynamicActivate(locale: string) {
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
  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}
