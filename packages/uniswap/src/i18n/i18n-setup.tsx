import 'uniswap/src/i18n/locales/@types/i18next'

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enUS from 'uniswap/src/i18n/locales/source/en-US.json'
import esES from 'uniswap/src/i18n/locales/translations/es-ES.json'
import frFR from 'uniswap/src/i18n/locales/translations/fr-FR.json'
import hiIN from 'uniswap/src/i18n/locales/translations/hi-IN.json'
import idID from 'uniswap/src/i18n/locales/translations/id-ID.json'
import jaJP from 'uniswap/src/i18n/locales/translations/ja-JP.json'
import msMY from 'uniswap/src/i18n/locales/translations/ms-MY.json'
import nlNL from 'uniswap/src/i18n/locales/translations/nl-NL.json'
import ptPT from 'uniswap/src/i18n/locales/translations/pt-PT.json'
import ruRU from 'uniswap/src/i18n/locales/translations/ru-RU.json'
import trTR from 'uniswap/src/i18n/locales/translations/tr-TR.json'
import ukUA from 'uniswap/src/i18n/locales/translations/uk-UA.json'
import urPK from 'uniswap/src/i18n/locales/translations/ur-PK.json'
import viVN from 'uniswap/src/i18n/locales/translations/vi-VN.json'
import zhCN from 'uniswap/src/i18n/locales/translations/zh-CN.json'
import zhTW from 'uniswap/src/i18n/locales/translations/zh-TW.json'
import { MissingI18nInterpolationError } from 'uniswap/src/i18n/shared'
import { logger } from 'utilities/src/logger/logger'

const resources = {
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
  'tr-TR': { translation: trTR },
  'uk-UA': { translation: ukUA },
  'ur-PK': { translation: urPK },
  'vi-VN': { translation: viVN },
}

const defaultNS = 'translation'

i18n
  .use(initReactI18next)
  .init({
    defaultNS,
    lng: 'en-US',
    fallbackLng: 'en-US',
    resources,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    react: {
      transSupportBasicHtmlNodes: false, // disabling since this breaks for mobile
    },
    missingInterpolationHandler: (text) => {
      logger.error(new MissingI18nInterpolationError(`Missing i18n interpolation value: ${text}`), {
        tags: {
          file: 'i18n.ts',
          function: 'init',
        },
      })
      return '' // Using empty string for missing interpolation
    },
  })
  .catch(() => undefined)

i18n.on('missingKey', (_lngs, _ns, key, _res) => {
  logger.error(new Error(`Missing i18n string key ${key} for language ${i18n.language}`), {
    tags: {
      file: 'i18n.ts',
      function: 'onMissingKey',
    },
  })
})
