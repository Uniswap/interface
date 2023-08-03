import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { DEFAULT_LOCALE, SupportedLocale } from 'constants/locales'
import { ReactNode, useEffect } from 'react'

export async function dynamicActivate(locale: SupportedLocale) {
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
  forceRenderAfterLocaleChange?: boolean
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

  // Initialize the locale immediately if it is DEFAULT_LOCALE, so that keys are shown while the translation messages load.
  // This renders the translation _keys_, not the translation _messages_, which is only acceptable while loading the DEFAULT_LOCALE,
  // as [there are no "default" messages](https://github.com/lingui/js-lingui/issues/388#issuecomment-497779030).
  // See https://github.com/lingui/js-lingui/issues/1194#issuecomment-1068488619.
  if (i18n.locale === undefined && locale === DEFAULT_LOCALE) {
    i18n.load(DEFAULT_LOCALE, {})
    i18n.activate(DEFAULT_LOCALE)
  }

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}
