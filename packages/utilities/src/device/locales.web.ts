import { DEFAULT_LANGUAGE_TAG, DeviceLocale } from 'utilities/src/device/constants'
import { logger } from 'utilities/src/logger/logger'

export function getDeviceLocales(): DeviceLocale[] {
  try {
    const language = chrome.i18n.getUILanguage()
    return [{ languageCode: null, languageTag: language }]
  } catch (e) {
    logger.error(e, {
      level: 'warning',
      tags: { file: 'utils.ts', function: 'getDeviceLocales' },
    })
  }
  return [
    {
      languageCode: null,
      languageTag: DEFAULT_LANGUAGE_TAG,
    },
  ]
}
