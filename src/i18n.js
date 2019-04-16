import i18next from 'i18next'
import XHR from 'i18next-xhr-backend'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

i18next
  // load translation using xhr -> see /public/locales
  // https://github.com/i18next/i18next-xhr-backend
  .use(XHR)
  // detect user language
  // https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  .use(initReactI18next)
  // https://www.i18next.com/overview/configuration-options
  .init({
    backend: {
      loadPath: './locales/{{lng}}.json'
    },
    fallbackLng: 'en',
    keySeparator: false,
    interpolation: {
      escapeValue: false // not needed for react as it escapes by default
    }
  })

export default i18next
