import { useEffect } from 'react'

import { initialLocale, useActiveLocale } from 'hooks/useActiveLocale'
import { ReactNode } from 'react'
import { useUserLocaleManager } from 'state/user/hooks'

import i18n, { t } from 'i18next'
import { Trans as OGTrans, Translation, initReactI18next, useTranslation as useTranslationOG } from 'react-i18next'

import { SupportedLocale } from 'constants/locales'
import resourcesToBackend from 'i18next-resources-to-backend'

export { t } from 'i18next'

export const Trans = ((props) => {
  // forces re-render on language change because it doesn't by default
  useTranslation()
  return <OGTrans {...props}>{props.children}</OGTrans>
}) satisfies typeof OGTrans

export function useTranslation() {
  if (process.env.NODE_ENV === 'test') {
    return { i18n, t }
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useTranslationOG()
}

export function Plural({ value, one, other }: { value: number; one: string; other: string }) {
  const children = value === 1 ? one : other
  if (process.env.NODE_ENV === 'test') {
    return <>{children}</>
  }
  // ensures it re-renders when language changes
  return <Translation>{() => children}</Translation>
}

i18n
  .use(initReactI18next)
  .use(
    resourcesToBackend((language: string, namespace: string) => {
      // not sure why but it tries to load es THEN es-ES, for any language, but we just want the second
      if (!language.includes('-')) {
        return
      }
      if (language === 'en-US') {
        if (process.env.NODE_ENV === 'test') {
          return import('./i18n/locales/source/en-US.json')
        }
      }
      return import(`./i18n/locales/${namespace}/${language}.json`)
    })
  )
  .on('failedLoading', (language, namespace, msg) => {
    console.error(`Error loading language ${language} ${namespace}: ${msg}`)
  })

i18n
  .init({
    returnEmptyString: false,
    defaultNS: 'translations',
    keySeparator: '~~',
    lng: 'en-US',
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    react: {
      transSupportBasicHtmlNodes: true,
    },
  })
  .catch(() => undefined)

let changingTo = ''

async function dynamicActivate(locale: SupportedLocale) {
  if (i18n.language === locale || locale === changingTo) return
  // since its async we need to "lock" while its changing
  changingTo = locale
  await i18n.changeLanguage(locale)
  i18n.emit('')
  changingTo = ''
}

dynamicActivate(initialLocale)

export function LanguageProvider({ children }: { children: ReactNode }): JSX.Element {
  const activeLocale = useActiveLocale()
  const [userLocale, setUserLocale] = useUserLocaleManager()
  const locale = userLocale || activeLocale

  useEffect(() => {
    dynamicActivate(locale)
    document.documentElement.setAttribute('lang', locale)
    setUserLocale(locale) // stores the selected locale to persist across sessions
  }, [setUserLocale, locale])

  return <>{children}</>
}
