import React from 'react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { detect, fromNavigator } from '@lingui/detect-locale'
import { ReactNode, useEffect } from 'react'
import { useLocale } from 'state/user/hooks'

//www.codetwo.com/admins-blog/list-of-office-365-language-id/
export enum Locales {
  'en' = 'English',
  'de' = 'Deutsch',
  'es-AR' = 'español (Argentina)',
  'es-US' = 'español (Estados Unidos)',
  'it-IT' = 'italiano',
  'iw' = 'Hebrew',
  'ro' = 'română',
  'ru' = 'русский',
  'vi' = 'Tiếng Việt',
  'zh-CN' = '中文 ( 中国 )',
  'zh-TW' = '中文 ( 台灣 )',
  'pseudo-en' = '',
}
export const defaultLocale = 'en'

export const isSupportedLocale = (locale: string): boolean => locale in Locales

export const getNavigatorLocale = (): string | undefined => {
  const detected = detect(fromNavigator())
  return detected && isSupportedLocale(detected) ? detected : undefined
}

export async function dynamicActivate(locale: string) {
  const { messages } = await import(`@lingui/loader!./locales/${locale}.po`)
  i18n.loadLocaleData(locale, { plurals: () => null })
  i18n.load(locale, messages)
  i18n.activate(locale)
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useLocale()

  useEffect(() => {
    if (!isSupportedLocale(locale)) {
      return
    }

    dynamicActivate(locale).catch((error) => {
      console.error(`Failed to load locale data for ${locale}`, error)
    })
  }, [locale])

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}
