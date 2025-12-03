import { Locale } from 'expo-localization'
import { getDeviceLocales } from 'utilities/src/device/locales.native'

const MOCK_LANGUAGE_CODE = 'es'
const MOCK_LANGUAGE_TAG = 'es-ES'

vi.mock('expo-localization', () => ({
  getLocales: (): Locale[] => [
    {
      languageCode: MOCK_LANGUAGE_CODE,
      languageTag: MOCK_LANGUAGE_TAG,
      languageRegionCode: null,
      languageCurrencyCode: null,
      languageCurrencySymbol: null,
      languageScriptCode: null,
      regionCode: null,
      currencyCode: null,
      currencySymbol: null,
      decimalSeparator: null,
      digitGroupingSeparator: null,
      textDirection: null,
      measurementSystem: null,
      temperatureUnit: null,
    },
  ],
}))

describe(getDeviceLocales, () => {
  it('should return the device locale', () => {
    expect(getDeviceLocales).not.toThrow()
    expect(getDeviceLocales()).toEqual([{ languageCode: MOCK_LANGUAGE_CODE, languageTag: MOCK_LANGUAGE_TAG }])
  })
})
