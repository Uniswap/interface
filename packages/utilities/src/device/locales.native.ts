// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { getLocales } from 'expo-localization'
import { DEFAULT_LANGUAGE_CODE, DEFAULT_LANGUAGE_TAG, DeviceLocale } from 'utilities/src/device/constants'
import { logger } from 'utilities/src/logger/logger'

export function getDeviceLocales(): DeviceLocale[] {
  try {
    return getLocales().map((locale) => {
      return { languageCode: locale.languageCode, languageTag: locale.languageTag }
    })
  } catch (e) {
    const isKnownError = e instanceof Error && e.message.includes('Unsupported ISO 3166 country')
    if (!isKnownError) {
      logger.error(e, {
        level: 'warning',
        tags: { file: 'utils.ts', function: 'getDeviceLocales' },
      })
    }
  }
  return [
    {
      languageCode: DEFAULT_LANGUAGE_CODE,
      languageTag: DEFAULT_LANGUAGE_TAG,
    },
  ]
}
