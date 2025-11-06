import { migration58 } from 'state/migrations/58'
import { Language } from 'uniswap/src/features/language/constants'

const previousState = {
  _persist: {
    version: 57,
    rehydrated: true,
  },
  userSettings: {
    currentLanguage: Language.English,
  },
}

describe('migration to v58', () => {
  it('should preserve English language settings', () => {
    const result: any = migration58(previousState)
    expect(result.userSettings.currentLanguage).toEqual(Language.English)
    expect(result._persist.version).toEqual(58)
  })

  it('should preserve supported non-English language settings (French)', () => {
    const frenchState = {
      ...previousState,
      userSettings: { currentLanguage: Language.French },
    }
    const result: any = migration58(frenchState)
    expect(result.userSettings.currentLanguage).toEqual(Language.French)
    expect(result._persist.version).toEqual(58)
  })

  it('should preserve supported Spanish variants', () => {
    const spanishState = {
      ...previousState,
      userSettings: { currentLanguage: Language.SpanishSpain },
    }
    const result: any = migration58(spanishState)
    expect(result.userSettings.currentLanguage).toEqual(Language.SpanishSpain)
    expect(result._persist.version).toEqual(58)
  })

  it('should preserve Vietnamese language settings', () => {
    const vietnameseState = {
      ...previousState,
      userSettings: { currentLanguage: Language.Vietnamese },
    }
    const result: any = migration58(vietnameseState)
    expect(result.userSettings.currentLanguage).toEqual(Language.Vietnamese)
    expect(result._persist.version).toEqual(58)
  })

  // Test removed languages with browser language detection
  describe('removed languages', () => {
    const originalNavigator = global.navigator

    beforeEach(() => {
      // Reset navigator.language to default English
      Object.defineProperty(global.navigator, 'language', {
        writable: true,
        configurable: true,
        value: 'en-US',
      })
    })

    afterAll(() => {
      // Restore original navigator
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        configurable: true,
        writable: true,
      })
    })

    it('should migrate Italian to English when browser language is en-US', () => {
      const italianState = {
        ...previousState,
        userSettings: { currentLanguage: 'it' as Language },
      }
      const result: any = migration58(italianState)
      expect(result.userSettings.currentLanguage).toEqual(Language.English)
      expect(result._persist.version).toEqual(58)
    })

    it('should migrate Hungarian to browser language when browser is fr-FR', () => {
      Object.defineProperty(global.navigator, 'language', {
        writable: true,
        configurable: true,
        value: 'fr-FR',
      })
      const hungarianState = {
        ...previousState,
        userSettings: { currentLanguage: 'hu' as Language }, // Hungarian - removed language
      }
      const result: any = migration58(hungarianState)
      expect(result.userSettings.currentLanguage).toEqual(Language.French)
      expect(result._persist.version).toEqual(58)
    })

    it('should migrate Czech to browser language when browser is ja-JP', () => {
      Object.defineProperty(global.navigator, 'language', {
        writable: true,
        configurable: true,
        value: 'ja-JP',
      })
      const czechState = {
        ...previousState,
        userSettings: { currentLanguage: 'cs' as Language }, // Czech - removed language
      }
      const result: any = migration58(czechState)
      expect(result.userSettings.currentLanguage).toEqual(Language.Japanese)
      expect(result._persist.version).toEqual(58)
    })

    it('should migrate Polish to English when browser language is unavailable', () => {
      Object.defineProperty(global.navigator, 'language', {
        writable: true,
        configurable: true,
        value: undefined,
      })
      const polishState = {
        ...previousState,
        userSettings: { currentLanguage: 'pl' as Language },
      }
      const result: any = migration58(polishState)
      expect(result.userSettings.currentLanguage).toEqual(Language.English)
      expect(result._persist.version).toEqual(58)
    })

    it('should migrate Ukrainian to English when browser language is unsupported', () => {
      Object.defineProperty(global.navigator, 'language', {
        writable: true,
        configurable: true,
        value: 'xx-XX', // Unsupported language code
      })
      const ukrainianState = {
        ...previousState,
        userSettings: { currentLanguage: 'uk' as Language },
      }
      const result: any = migration58(ukrainianState)
      expect(result.userSettings.currentLanguage).toEqual(Language.English)
      expect(result._persist.version).toEqual(58)
    })

    it('should migrate Afrikaans to English when navigator.language throws exception', () => {
      Object.defineProperty(global.navigator, 'language', {
        get() {
          throw new Error('Navigator not available')
        },
        configurable: true,
      })
      const afrikaansState = {
        ...previousState,
        userSettings: { currentLanguage: 'af' as Language }, // Afrikaans - removed language
      }
      const result: any = migration58(afrikaansState)
      expect(result.userSettings.currentLanguage).toEqual(Language.English)
      expect(result._persist.version).toEqual(58)
    })
  })

  it('should handle undefined state', () => {
    const result = migration58(undefined)
    expect(result).toBeUndefined()
  })

  it('should handle state without userSettings', () => {
    const stateWithoutUserSettings = {
      _persist: {
        version: 57,
        rehydrated: true,
      },
    }
    const result: any = migration58(stateWithoutUserSettings)
    expect(result._persist.version).toEqual(58)
    expect(result.userSettings).toBeUndefined()
  })
})
