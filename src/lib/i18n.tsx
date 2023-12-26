import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { DEFAULT_LOCALE, DEFAULT_MESSAGES, SupportedLocale } from 'constants/locales'
import { ReactNode, useEffect } from 'react'

// Initialize the locale immediately to DEFAULT_LOCALE/DEFAULT_MESSAGES,
// so that messages are shown while the appropriate translation load.
// This is necessary for initial macro translations (t``) to work in the DEFAULT_LOCALE.
i18n.load(DEFAULT_LOCALE, DEFAULT_MESSAGES)
i18n.activate(DEFAULT_LOCALE)

export async function dynamicActivate(locale: SupportedLocale) {
  if (i18n.locale === locale) return
  try {
    const catalog = await import(`locales/${locale}.js`)
    // Bundlers will either export it as default or as a named export named default.
    i18n.load(locale, catalog.messages || catalog.default.messages)
  } catch (error: unknown) {
    console.error(new Error(`Unable to load locale (${locale}): ${error}`))
  }
  i18n.activate(locale)
}

interface ProviderProps {
  locale: SupportedLocale
  onActivate?: (locale: SupportedLocale) => void
  children: ReactNode
}

export function Provider({ locale, onActivate, children }: ProviderProps) {
  useEffect(() => {
    dynamicActivate(locale)
      .then(() => onActivate?.(locale))
      .catch((error) => {
        console.error('Failed to activate locale', locale, error)
      })
  }, [locale, onActivate])

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}
