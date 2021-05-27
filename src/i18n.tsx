import React from 'react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { detect, fromUrl } from '@lingui/detect-locale'
import { ReactNode, useEffect } from 'react'

export const locales = [
  'en',
  'pseudo-en',
  'de',
  'en',
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
export const defaultLocale = 'en'

// load locale data for each supported language
locales.forEach((locale) => i18n.loadLocaleData(locale, { plurals: () => null }))

const getDetectedLocale = () => {
  const detected =
    detect(
      fromUrl('lang'), // helps local development
      defaultLocale
    ) ?? defaultLocale
  return locales.includes(detected) ? detected : defaultLocale
}

export async function dynamicActivate(locale: string) {
  const { messages } = await import(`@lingui/loader!./locales/${locale}/messages.po`)
  i18n.load(locale, messages)
  i18n.activate(locale)
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    dynamicActivate(getDetectedLocale())
  }, [])

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}
