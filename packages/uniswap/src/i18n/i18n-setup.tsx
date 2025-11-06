import 'uniswap/src/i18n/locales/@types/i18next'

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enUS from 'uniswap/src/i18n/locales/source/en-US.json'
import esES from 'uniswap/src/i18n/locales/translations/es-ES.json'
import frFR from 'uniswap/src/i18n/locales/translations/fr-FR.json'
import idID from 'uniswap/src/i18n/locales/translations/id-ID.json'
import jaJP from 'uniswap/src/i18n/locales/translations/ja-JP.json'
import nlNL from 'uniswap/src/i18n/locales/translations/nl-NL.json'
import ptPT from 'uniswap/src/i18n/locales/translations/pt-PT.json'
import ruRU from 'uniswap/src/i18n/locales/translations/ru-RU.json'
import trTR from 'uniswap/src/i18n/locales/translations/tr-TR.json'
import viVN from 'uniswap/src/i18n/locales/translations/vi-VN.json'
import zhCN from 'uniswap/src/i18n/locales/translations/zh-CN.json'
import zhTW from 'uniswap/src/i18n/locales/translations/zh-TW.json'
import { MissingI18nInterpolationError } from 'uniswap/src/i18n/shared'
import { getWalletDeviceLocale } from 'uniswap/src/i18n/utils'
import { logger } from 'utilities/src/logger/logger'

const resources = {
  'zh-Hans': { translation: zhCN, statsigKey: 'zh-CN' },
  'zh-Hant': { translation: zhTW, statsigKey: 'zh-TW' },
  'nl-NL': { translation: nlNL, statsigKey: 'nl-NL' },
  'en-US': { translation: enUS, statsigKey: 'en-US' },
  'fr-FR': { translation: frFR, statsigKey: 'fr-FR' },
  'id-ID': { translation: idID, statsigKey: 'id-ID' },
  'ja-JP': { translation: jaJP, statsigKey: 'ja-JP' },
  'pt-PT': { translation: ptPT, statsigKey: 'pt-PT' },
  'ru-RU': { translation: ruRU, statsigKey: 'ru-RU' },
  // Spanish locales that use `,` as the decimal separator
  'es-419': { translation: esES, statsigKey: 'es-ES' },
  'es-BZ': { translation: esES, statsigKey: 'es-ES' },
  'es-CU': { translation: esES, statsigKey: 'es-ES' },
  'es-DO': { translation: esES, statsigKey: 'es-ES' },
  'es-GT': { translation: esES, statsigKey: 'es-ES' },
  'es-HN': { translation: esES, statsigKey: 'es-ES' },
  'es-MX': { translation: esES, statsigKey: 'es-ES' },
  'es-NI': { translation: esES, statsigKey: 'es-ES' },
  'es-PA': { translation: esES, statsigKey: 'es-ES' },
  'es-PE': { translation: esES, statsigKey: 'es-ES' },
  'es-PR': { translation: esES, statsigKey: 'es-ES' },
  'es-SV': { translation: esES, statsigKey: 'es-ES' },
  'es-US': { translation: esES, statsigKey: 'es-ES' },
  // Spanish locales that use `.` as the decimal separator
  'es-AR': { translation: esES, statsigKey: 'es-ES' },
  'es-BO': { translation: esES, statsigKey: 'es-ES' },
  'es-CL': { translation: esES, statsigKey: 'es-ES' },
  'es-CO': { translation: esES, statsigKey: 'es-ES' },
  'es-CR': { translation: esES, statsigKey: 'es-ES' },
  'es-EC': { translation: esES, statsigKey: 'es-ES' },
  'es-ES': { translation: esES, statsigKey: 'es-ES' },
  'es-PY': { translation: esES, statsigKey: 'es-ES' },
  'es-UY': { translation: esES, statsigKey: 'es-ES' },
  'es-VE': { translation: esES, statsigKey: 'es-ES' },
  'tr-TR': { translation: trTR, statsigKey: 'tr-TR' },
  'vi-VN': { translation: viVN, statsigKey: 'vi-VN' },
}

const defaultNS = 'translation'

i18n
  .use(initReactI18next)
  .init({
    defaultNS,
    lng: getWalletDeviceLocale(),
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
          file: 'i18n-setup.tsx',
          function: 'init',
        },
      })
      return '' // Using empty string for missing interpolation
    },
  })
  .catch(() => undefined)

// eslint-disable-next-line max-params
i18n.on('missingKey', (_lngs, _ns, key, _res) => {
  logger.error(new Error(`Missing i18n string key ${key} for language ${i18n.language}`), {
    tags: {
      file: 'i18n-setup.tsx',
      function: 'onMissingKey',
    },
  })
})
