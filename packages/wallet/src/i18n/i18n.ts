import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { AppTFunction } from 'ui/src/i18n/types'
import enUS from './locales/en-US.json'
import esES from './locales/translations/es-ES.json'
import frFR from './locales/translations/fr-FR.json'
import hiIN from './locales/translations/hi-IN.json'
import idID from './locales/translations/id-ID.json'
import jaJP from './locales/translations/ja-JP.json'
import msMY from './locales/translations/ms-MY.json'
import nlNL from './locales/translations/nl-NL.json'
import ptPT from './locales/translations/pt-PT.json'
import ruRU from './locales/translations/ru-RU.json'
import thTH from './locales/translations/th-TH.json'
import trTR from './locales/translations/tr-TR.json'
import ukUA from './locales/translations/uk-UA.json'
import urPK from './locales/translations/ur-PK.json'
import viVN from './locales/translations/vi-VN.json'
import zhCN from './locales/translations/zh-CN.json'
import zhTW from './locales/translations/zh-TW.json'

export const resources = {
  'zh-Hans': { translation: zhCN },
  'zh-Hant': { translation: zhTW },
  'nl-NL': { translation: nlNL },
  'en-US': { translation: enUS },
  'fr-FR': { translation: frFR },
  'hi-IN': { translation: hiIN },
  'id-ID': { translation: idID },
  'ja-JP': { translation: jaJP },
  'ms-MY': { translation: msMY },
  'pt-PT': { translation: ptPT },
  'ru-RU': { translation: ruRU },
  'es-ES': { translation: esES },
  'es-US': { translation: esES },
  'es-419': { translation: esES },
  'th-TH': { translation: thTH },
  'tr-TR': { translation: trTR },
  'uk-UA': { translation: ukUA },
  'ur-PK': { translation: urPK },
  'vi-VN': { translation: viVN },
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
      lng: 'en-US',
      resources,
      interpolation: {
        escapeValue: false, // react already safes from xss
      },
    })
    .catch(() => undefined)
}

export default i18n
