import { SUPPORTED_LOCALES, SupportedLocale } from 'constants/locales'

import formatLocaleNumber from './formatLocaleNumber'

const INPUT = 4000000.123 // 4 million

function expectedOutput(l: SupportedLocale): string {
  switch (l) {
    case 'en-US':
    case 'he-IL':
    case 'ja-JP':
    case 'ko-KR':
    case 'zh-CN':
    case 'sw-TZ':
    case 'zh-TW':
      return `4,000,000.123`
    case 'fr-FR':
      // eslint-disable-next-line no-irregular-whitespace
      return `4 000 000,123`
    case 'ar-SA':
      return `٤٬٠٠٠٬٠٠٠٫١٢٣`
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
      throw new Error('unreachable')
  }
}

const TEST_MATRIX = SUPPORTED_LOCALES.map((locale) => ({
  locale,
  input: INPUT,
  expected: expectedOutput(locale),
}))

describe('formatLocaleNumber', () => {
  test.concurrent.each(TEST_MATRIX)('should format correctly for %p', async ({ locale, input, expected }) => {
    const result = formatLocaleNumber({ number: input, locale })
    expect(result).toEqual(expected)
  })
})
