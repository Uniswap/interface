import { Language, Locale } from 'uniswap/src/features/language/constants'
import * as navigatorLocale from 'uniswap/src/features/language/navigatorLocale'
import * as deviceLocales from 'utilities/src/device/locales'
import { mockLogger } from 'utilities/src/logger/mocks'
import type { Mock } from 'vitest'

// Mock modules
vi.mock('utilities/src/device/locales', () => ({
  getDeviceLocales: vi.fn(),
}))

vi.mock('uniswap/src/features/language/navigatorLocale', () => ({
  getLocale: vi.fn(),
}))

// Import the functions under test after mocks are set up
// We need to use dynamic import to ensure mocks are applied
const { getWalletDeviceLanguage, getWalletDeviceLocale } = await import('uniswap/src/i18n/utils')

describe('i18n utils', () => {
  const mockGetDeviceLocales = deviceLocales.getDeviceLocales as Mock
  const mockGetLocale = navigatorLocale.getLocale as Mock
  const mockLoggerError = mockLogger.error

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getWalletDeviceLanguage', () => {
    it('should return first supported language from device locales', () => {
      mockGetDeviceLocales.mockReturnValue([
        { languageCode: 'fr', languageTag: 'fr-FR' },
        { languageCode: 'en', languageTag: 'en-US' },
      ])

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.French)
    })

    it('should handle normalized language tags', () => {
      mockGetDeviceLocales.mockReturnValue([{ languageCode: 'zh', languageTag: 'zh-Hans-cn' }])

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.ChineseSimplified)
    })

    it('should fall back to languageCode if no match for languageTag', () => {
      mockGetDeviceLocales.mockReturnValue([{ languageCode: 'ja', languageTag: 'custom-tag' }])

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.Japanese)
    })

    it('should skip unsupported languages and use the first supported one', () => {
      mockGetDeviceLocales.mockReturnValue([
        { languageCode: 'xx', languageTag: 'xx-XX' }, // Unsupported
        { languageCode: 'es', languageTag: 'es-ES' }, // Supported
      ])

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.SpanishSpain)
    })

    it('should default to English if no supported language is found', () => {
      mockGetDeviceLocales.mockReturnValue([
        { languageCode: 'xx', languageTag: 'xx-XX' }, // Unsupported
      ])

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.English)
    })

    it('should default to English if getDeviceLocales throws an error', () => {
      mockGetDeviceLocales.mockImplementation(() => {
        throw new Error('Test error')
      })

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.English)
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should handle empty device locales array', () => {
      mockGetDeviceLocales.mockReturnValue([])

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.English)
    })
  })

  describe('getWalletDeviceLocale', () => {
    it('should get the language and return the corresponding locale', () => {
      mockGetDeviceLocales.mockReturnValue([{ languageCode: 'fr', languageTag: 'fr-FR' }])
      mockGetLocale.mockReturnValue(Locale.FrenchFrance)

      const result = getWalletDeviceLocale()
      expect(result).toBe(Locale.FrenchFrance)
      expect(mockGetLocale).toHaveBeenCalledWith(Language.French)
    })

    it('should default to English locale if getDeviceLocales fails', () => {
      mockGetDeviceLocales.mockImplementation(() => {
        throw new Error('Test error')
      })
      mockGetLocale.mockReturnValue(Locale.EnglishUnitedStates)

      const result = getWalletDeviceLocale()
      expect(result).toBe(Locale.EnglishUnitedStates)
      expect(mockGetLocale).toHaveBeenCalledWith(Language.English)
    })
  })
})
