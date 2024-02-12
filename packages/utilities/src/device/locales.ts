// eslint-disable-next-line no-restricted-imports
import { getLocales, Locale } from 'expo-localization'
import { logger } from 'utilities/src/logger/logger'

export function getDeviceLocales(): Locale[] {
  try {
    return getLocales()
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
      languageCode: 'en',
      languageTag: 'en-US',
      regionCode: null,
      currencyCode: null,
      currencySymbol: null,
      decimalSeparator: null,
      digitGroupingSeparator: null,
      textDirection: null,
      measurementSystem: null,
    },
  ]
}
