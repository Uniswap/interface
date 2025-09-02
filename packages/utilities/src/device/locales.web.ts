import { DEFAULT_LANGUAGE_CODE, DEFAULT_LANGUAGE_TAG, DeviceLocale } from 'utilities/src/device/constants'
import { logger } from 'utilities/src/logger/logger'

export function getDeviceLocales(): DeviceLocale[] {
  try {
    // Check if we're in a Chrome extension context
    // eslint-disable-next-line no-restricted-globals, @typescript-eslint/no-unnecessary-condition
    if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getUILanguage) {
      // eslint-disable-next-line no-restricted-globals
      const language = chrome.i18n.getUILanguage()
      return [{ languageCode: language, languageTag: language }]
    }

    // Fallback to browser navigator for regular web context
    if (typeof navigator !== 'undefined' && navigator.language) {
      return [{ languageCode: navigator.language, languageTag: navigator.language }]
    }
  } catch (e) {
    logger.error(e, {
      level: 'warn',
      tags: { file: 'utils.ts', function: 'getDeviceLocales' },
    })
  }
  return [
    {
      languageCode: DEFAULT_LANGUAGE_CODE,
      languageTag: DEFAULT_LANGUAGE_TAG,
    },
  ]
}
