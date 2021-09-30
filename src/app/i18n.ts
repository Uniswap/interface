import i18nBase from 'i18next'
import { initReactI18next } from 'react-i18next'
import translationEn from 'src/locales/en/translation.json'

// Note, adding/changing workspaces or locales sometimes requires
// restarting the Typescript server in vscode before types work
export enum Locale {
  en = 'en',
  // Add new locales here
}

// This combined with the extension in react-i18next.d.ts
// adds strong typing to the transaction function
type Resources = Record<
  Locale,
  {
    translation: typeof translationEn
  }
>

export const resources: Resources = {
  en: {
    translation: translationEn,
  },
  // Add new locales translations here
} as const

i18nBase
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    resources,
    fallbackLng: 'en',
    debug: true,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  })

export const i18n = i18nBase // Just aliasing for named export
