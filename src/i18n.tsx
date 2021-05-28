import React from 'react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ReactNode } from 'react'
import { useDispatch } from 'react-redux'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useEffect } from '@storybook/addons'
import { AppDispatch } from 'state'
import { useLocale } from 'state/user/hooks'

type IE11NavigatorLanguage = {
  userLanguage?: string
}

const supportedLocales = [
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
] as const
export type SupportedLocale = typeof supportedLocales[number]

const defaultFallback = () => 'en' as SupportedLocale

function parseLocale(maybeSupportedLocale: string): SupportedLocale | undefined {
  return supportedLocales.find((locale) => locale === maybeSupportedLocale)
}

function getDetectedLocale(
  navigator: Partial<Navigator & IE11NavigatorLanguage> = window.navigator
): SupportedLocale | undefined {
  const language = navigator.language ?? navigator.language

  if (!language) return undefined

  return parseLocale(language) ?? parseLocale(language.split('-')[0])
}

function getActiveLocale(cached: SupportedLocale | undefined, qs: SupportedLocale | undefined): SupportedLocale {
  return qs ?? cached ?? getDetectedLocale() ?? defaultFallback()
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
  const dispatch = useDispatch<AppDispatch>()
  const parsed = useParsedQueryString()
  const userLocale = useLocale()

  useEffect(() => {
    const parsedLocale = (typeof parsed.lng === 'string' && parseLocale(parsed.lng)) || undefined

    const activeLocale = getActiveLocale(userLocale ?? undefined, parsedLocale)
    if (activeLocale) {
      dynamicActivate(activeLocale)
    }
  }, [dispatch, userLocale, parsed])

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}
