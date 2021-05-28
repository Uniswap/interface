import React from 'react'
import { useLocale } from './hooks'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { detect, fromNavigator } from '@lingui/detect-locale'
import { ReactNode } from 'react'
import { useDispatch } from 'react-redux'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useEffect } from '@storybook/addons'
import { AppDispatch } from 'state'

type IE11NavigatorLanguage = {
  userLanguage?: string
}

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

const isSupportedLocale = (locale: string): boolean => supportedLocales.includes(locale)

const getDetectedLocale = (
  navigator: Partial<Navigator & IE11NavigatorLanguage> = window.navigator
): string | undefined => {
  const language = navigator.language ?? navigator.language
  if (!language) return undefined

  if (isSupportedLocale(language)) return navigator.language

  // fallack to generic dialect, if supported
  const [subtag] = language.split('-')
  if (isSupportedLocale(subtag)) return subtag

  return undefined
}

const getActiveLocale = (cached: string | undefined, qs: string | undefined): string => {
  return qs ?? cached ?? getDetectedLocale() ?? defaultFallback()
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
  const dispatch = useDispatch<AppDispatch>()
  const parsed = useParsedQueryString()
  const userLocale = useLocale()

  useEffect(() => {
    const parsedLocale = typeof parsed.lng === 'string' && isSupportedLocale(parsed.lng) ? parsed.lng : undefined

    const activeLocale = getActiveLocale(userLocale, parsedLocale)
    if (activeLocale) {
      dynamicActivate(activeLocale)
    }
  }, [dispatch, userLocale, parsed])

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}
