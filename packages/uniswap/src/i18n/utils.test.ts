import { Language, Locale } from 'uniswap/src/features/language/constants'
import { getWalletDeviceLanguage, getWalletDeviceLocale } from 'uniswap/src/i18n/utils'

// Manual mocks
const originalModules = {
  deviceLocales: require('utilities/src/device/locales'),
  hooks: require('uniswap/src/features/language/hooks'),
  logger: require('utilities/src/logger/logger'),
}

// Store original implementations to restore later
const originalGetDeviceLocales = originalModules.deviceLocales.getDeviceLocales
const originalGetLocale = originalModules.hooks.getLocale
const originalLoggerError = originalModules.logger.logger.error

describe('i18n utils', () => {
  // Setup mocks before each test
  beforeEach(() => {
    // Mock getDeviceLocales
    originalModules.deviceLocales.getDeviceLocales = jest.fn()

    // Mock getLocale
    originalModules.hooks.getLocale = jest.fn()

    // Mock logger.error
    originalModules.logger.logger.error = jest.fn()
  })

  // Restore original implementations after each test
  afterEach(() => {
    originalModules.deviceLocales.getDeviceLocales = originalGetDeviceLocales
    originalModules.hooks.getLocale = originalGetLocale
    originalModules.logger.logger.error = originalLoggerError
  })

  describe('getWalletDeviceLanguage', () => {
    it('should return first supported language from device locales', () => {
      originalModules.deviceLocales.getDeviceLocales.mockReturnValue([
        { languageCode: 'fr', languageTag: 'fr-FR' },
        { languageCode: 'en', languageTag: 'en-US' },
      ])

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.French)
    })

    it('should handle normalized language tags', () => {
      originalModules.deviceLocales.getDeviceLocales.mockReturnValue([
        { languageCode: 'zh', languageTag: 'zh-Hans-cn' },
      ])

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.ChineseSimplified)
    })

    it('should fall back to languageCode if no match for languageTag', () => {
      originalModules.deviceLocales.getDeviceLocales.mockReturnValue([
        { languageCode: 'ja', languageTag: 'custom-tag' },
      ])

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.Japanese)
    })

    it('should skip unsupported languages and use the first supported one', () => {
      originalModules.deviceLocales.getDeviceLocales.mockReturnValue([
        { languageCode: 'xx', languageTag: 'xx-XX' }, // Unsupported
        { languageCode: 'es', languageTag: 'es-ES' }, // Supported
      ])

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.SpanishSpain)
    })

    it('should default to English if no supported language is found', () => {
      originalModules.deviceLocales.getDeviceLocales.mockReturnValue([
        { languageCode: 'xx', languageTag: 'xx-XX' }, // Unsupported
      ])

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.English)
    })

    it('should default to English if getDeviceLocales throws an error', () => {
      originalModules.deviceLocales.getDeviceLocales.mockImplementation(() => {
        throw new Error('Test error')
      })

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.English)
      expect(originalModules.logger.logger.error).toHaveBeenCalled()
    })

    it('should handle empty device locales array', () => {
      originalModules.deviceLocales.getDeviceLocales.mockReturnValue([])

      const result = getWalletDeviceLanguage()
      expect(result).toBe(Language.English)
    })
  })

  describe('getWalletDeviceLocale', () => {
    it('should get the language and return the corresponding locale', () => {
      originalModules.deviceLocales.getDeviceLocales.mockReturnValue([{ languageCode: 'fr', languageTag: 'fr-FR' }])
      originalModules.hooks.getLocale.mockReturnValue(Locale.FrenchFrance)

      const result = getWalletDeviceLocale()
      expect(result).toBe(Locale.FrenchFrance)
      expect(originalModules.hooks.getLocale).toHaveBeenCalledWith(Language.French)
    })

    it('should default to English locale if getDeviceLocales fails', () => {
      originalModules.deviceLocales.getDeviceLocales.mockImplementation(() => {
        throw new Error('Test error')
      })
      originalModules.hooks.getLocale.mockReturnValue(Locale.EnglishUnitedStates)

      const result = getWalletDeviceLocale()
      expect(result).toBe(Locale.EnglishUnitedStates)
      expect(originalModules.hooks.getLocale).toHaveBeenCalledWith(Language.English)
    })
  })
})
