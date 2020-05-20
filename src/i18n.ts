import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import XHR from 'i18next-xhr-backend'
import LanguageDetector from 'i18next-browser-languagedetector'

const LOAD_PATH: string = process.env.PUBLIC_URL === '.' ? `./locales/{{lng}}.json` : '/locales/{{lng}}.json'

i18next
  .use(XHR)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    backend: {
      loadPath: LOAD_PATH
    },
    react: {
      useSuspense: true
    },
    fallbackLng: 'en',
    preload: ['en'],
    keySeparator: false,
    interpolation: { escapeValue: false }
  })

export default i18next
