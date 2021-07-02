import { useEffect, useState } from 'react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ReactNode } from 'react'
import { useActiveLocale, useSetLocaleFromUrl } from 'hooks/useActiveLocale'
import { SupportedLocale } from 'constants/locales'
import {
  af,
  ar,
  ca,
  cs,
  da,
  de,
  el,
  en,
  es,
  fi,
  fr,
  he,
  hu,
  id,
  it,
  ja,
  ko,
  nl,
  no,
  pl,
  pt,
  ro,
  ru,
  sr,
  sv,
  tr,
  uk,
  vi,
  zh,
  PluralCategory,
} from 'make-plural/plurals'

type LocalePlural = {
  [key in SupportedLocale]: (n: number | string, ord?: boolean) => PluralCategory
}

const plurals: LocalePlural = {
  'af-ZA': af,
  'ar-SA': ar,
  'ca-ES': ca,
  'cs-CZ': cs,
  'da-DK': da,
  'de-DE': de,
  'el-GR': el,
  'en-US': en,
  'es-ES': es,
  'fi-FI': fi,
  'fr-FR': fr,
  'he-IL': he,
  'hu-HU': hu,
  'id-ID': id,
  'it-IT': it,
  'ja-JP': ja,
  'ko-KR': ko,
  'nl-NL': nl,
  'no-NO': no,
  'pl-PL': pl,
  'pt-BR': pt,
  'pt-PT': pt,
  'ro-RO': ro,
  'ru-RU': ru,
  'sr-SP': sr,
  'sv-SE': sv,
  'tr-TR': tr,
  'uk-UA': uk,
  'vi-VN': vi,
  'zh-CN': zh,
  'zh-TW': zh,
}

export async function dynamicActivate(locale: SupportedLocale) {
  const { messages } = await import(`@lingui/loader!./locales/${locale}.po`)
  i18n.loadLocaleData(locale, { plurals: () => plurals[locale] })
  i18n.load(locale, messages)
  i18n.activate(locale)
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  useSetLocaleFromUrl()
  const locale = useActiveLocale()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    dynamicActivate(locale)
      .then(() => {
        setLoaded(true)
      })
      .catch((error) => {
        console.error('Failed to activate locale', locale, error)
      })
  }, [locale])

  // prevent the app from rendering with placeholder text before the locale is loaded
  if (!loaded) return null

  return (
    <I18nProvider forceRenderOnLocaleChange={false} i18n={i18n}>
      {children}
    </I18nProvider>
  )
}
