import formatLocaleNumber from 'lib/utils/formatLocaleNumber'
import { Locale, WEB_SUPPORTED_LANGUAGES } from 'uniswap/src/features/language/constants'
import { getLocale } from 'uniswap/src/features/language/hooks'

const INPUT = 4000000.123 // 4 million

function expectedOutput(l: Locale): string {
  switch (l) {
    case 'en-US':
    case 'he-IL':
    case 'ja-JP':
    case 'zh-Hant':
    case 'sw-TZ':
    case 'zh-Hans':
    case 'ur-PK':
    case 'es-US':
    case 'es-419':
    case 'ms-MY':
    case 'ko-KR':
      return `4,000,000.123`
    case 'fr-FR':
      // eslint-disable-next-line no-irregular-whitespace
      return `4 000 000,123`
    case 'ar-SA':
      return `٤٬٠٠٠٬٠٠٠٫١٢٣`
    case 'hi-IN':
      return `40,00,000.123`
    case 'cs-CZ':
    case 'fi-FI':
    case 'af-ZA':
    case 'hu-HU':
    case 'no-NO':
    case 'pl-PL':
    case 'pt-PT':
    case 'ru-RU':
    case 'sv-SE':
    case 'uk-UA':
      // eslint-disable-next-line no-irregular-whitespace
      return `4 000 000,123`
    case 'ca-ES':
    case 'da-DK':
    case 'el-GR':
    case 'es-ES':
    case 'id-ID':
    case 'it-IT':
    case 'nl-NL':
    case 'pt-BR':
    case 'ro-RO':
    case 'sr-SP':
    case 'tr-TR':
    case 'vi-VN':
      return `4.000.000,123`
    default:
      throw new Error(`Missing test locale: ${l}`)
  }
}

const TEST_MATRIX = WEB_SUPPORTED_LANGUAGES.map((language) => ({
  locale: getLocale(language),
  input: INPUT,
  expected: expectedOutput(getLocale(language)),
}))

describe('formatLocaleNumber', () => {
  test.concurrent.each(TEST_MATRIX)('should format correctly for %p', async ({ locale, input, expected }) => {
    const result = formatLocaleNumber({ number: input, locale })
    expect(result).toEqual(expected)
  })
})
