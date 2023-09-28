import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { AppTFunction } from 'ui/src/i18n/types'
import en from './locales/en-US.json'

export const resources = {
  en: {
    translation: en,
  },
}

export const defaultNS = 'translation'

export const changeLanguage = async (str: string): Promise<AppTFunction> => {
  return await i18n.changeLanguage(str)
}

export function initializeTranslation(): void {
  i18n
    .use(initReactI18next)
    .init({
      defaultNS,
      lng: 'en',
      resources,
      interpolation: {
        escapeValue: false, // react already safes from xss
      },
    })
    .catch(() => undefined)
}

export default i18n
