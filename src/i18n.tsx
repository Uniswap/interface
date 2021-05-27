import React from 'react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { detect, fromNavigator, fromUrl } from '@lingui/detect-locale'
import { ReactNode, useEffect } from 'react'
import { useLocale } from 'state/user/hooks'

export const locales = ['en', 'pseudo-en', 'de', 'es-AR', 'es-US', 'it-IT', 'iw', 'ro', 'ru', 'vi', 'zh-CN', 'zh-TW']
export const defaultLocale = 'en'

// Attemps to detect a locale from the URL or navigator.
export const getDetectedLocale = (): string | undefined => {
  const detected = detect(
    fromUrl('lang'), // helps local development
    fromNavigator()
  )
  return detected && locales.includes(detected) ? detected : undefined
}

export async function dynamicActivate(locale: string) {
  const { messages } = await import(`@lingui/loader!./locales/${locale}.po`)
  i18n.loadLocaleData(locale, { plurals: () => null })
  i18n.load(locale, messages)
  i18n.activate(locale)
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale] = useLocale()

  useEffect(() => {
    dynamicActivate(locale).catch((error) => {
      console.error(`Failed to load locale data for ${locale}`, error)
    })
  }, [locale])

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}
