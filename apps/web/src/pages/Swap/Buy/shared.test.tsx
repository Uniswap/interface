import { FORCountry } from 'uniswap/src/features/fiatOnRamp/types'

// Mock the navigatorLocale function
vi.mock('uniswap/src/features/language/hooks', () => ({
  navigatorLocale: vi.fn(),
}))

// Mock the logger
vi.mock('utilities/src/logger/logger', () => ({
  logger: {
    debug: vi.fn(),
  },
}))

// Mock UI components to avoid React Native imports
vi.mock('ui/src', () => ({
  Flex: 'div',
  ModalCloseIcon: 'div',
  styled: () => 'div',
  useSporeColors: () => ({}),
}))

// Mock styled-components
vi.mock('lib/styled-components', () => ({
  useTheme: () => ({}),
}))

// Mock SVG
vi.mock('ui/src/assets/backgrounds/for-connecting-v2.svg', () => ({
  ReactComponent: 'svg',
}))

// Import after mocks
import { getCountryFromLocale } from 'pages/Swap/Buy/shared'
import { Locale } from 'uniswap/src/features/language/constants'
import { navigatorLocale } from 'uniswap/src/features/language/hooks'

describe('getCountryFromLocale', () => {
  const mockNavigatorLocale = vi.mocked(navigatorLocale)
  let originalNavigatorLanguage: string | undefined

  beforeEach(() => {
    // Save the original navigator.language
    originalNavigatorLanguage = navigator.language
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore navigator.language
    if (originalNavigatorLanguage !== undefined) {
      Object.defineProperty(navigator, 'language', {
        value: originalNavigatorLanguage,
        configurable: true,
        writable: true,
      })
    }
  })

  it('should extract country from navigatorLocale when available', () => {
    // Arrange
    mockNavigatorLocale.mockReturnValue(Locale.FrenchFrance)

    // Act
    const result = getCountryFromLocale()

    // Assert
    expect(result.countryCode).toBe('FR')
    expect(result.displayName).toBeTruthy() // Display name depends on Intl.DisplayNames
    expect(result.state).toBeUndefined()
  })

  it('should extract country from navigator.language as fallback', () => {
    // Arrange
    mockNavigatorLocale.mockReturnValue(undefined)
    Object.defineProperty(navigator, 'language', {
      value: 'fr-FR',
      configurable: true,
      writable: true,
    })

    // Act
    const result = getCountryFromLocale()

    // Assert
    expect(result.countryCode).toBe('FR')
    expect(result.displayName).toBeTruthy()
    expect(result.state).toBeUndefined()
  })

  it('should return default US country when locale has no country code', () => {
    // Arrange
    mockNavigatorLocale.mockReturnValue(Locale.EnglishUnitedStates)
    Object.defineProperty(navigator, 'language', {
      value: 'en',
      configurable: true,
      writable: true,
    })

    // Act
    const result = getCountryFromLocale()

    // Assert
    expect(result).toEqual({
      countryCode: 'US',
      displayName: 'United States',
      state: undefined,
    })
  })

  it('should return default US country when locale is unavailable', () => {
    // Arrange
    mockNavigatorLocale.mockReturnValue(undefined)
    Object.defineProperty(navigator, 'language', {
      value: undefined,
      configurable: true,
      writable: true,
    })

    // Act
    const result = getCountryFromLocale()

    // Assert
    expect(result).toEqual({
      countryCode: 'US',
      displayName: 'United States',
      state: undefined,
    })
  })

  it('should return custom default country when provided', () => {
    // Arrange
    const customDefault: FORCountry = {
      countryCode: 'CA',
      displayName: 'Canada',
      state: undefined,
    }
    mockNavigatorLocale.mockReturnValue(undefined)
    Object.defineProperty(navigator, 'language', {
      value: undefined,
      configurable: true,
      writable: true,
    })

    // Act
    const result = getCountryFromLocale(customDefault)

    // Assert
    expect(result).toEqual(customDefault)
  })

  it('should handle locale with multiple parts correctly', () => {
    // Arrange
    mockNavigatorLocale.mockReturnValue(Locale.SpanishSpain)

    // Act
    const result = getCountryFromLocale()

    // Assert
    expect(result.countryCode).toBe('ES')
    expect(result.displayName).toBeTruthy()
    expect(result.state).toBeUndefined()
  })

  it('should uppercase country code from locale', () => {
    // Arrange
    mockNavigatorLocale.mockReturnValue(Locale.EnglishUnitedStates)

    // Act
    const result = getCountryFromLocale()

    // Assert
    expect(result.countryCode).toBe('US')
    expect(result.state).toBeUndefined()
  })

  it('should handle error in locale parsing gracefully', () => {
    // Arrange
    mockNavigatorLocale.mockImplementation(() => {
      throw new Error('Mock error')
    })
    Object.defineProperty(navigator, 'language', {
      value: undefined,
      configurable: true,
      writable: true,
    })

    // Act
    const result = getCountryFromLocale()

    // Assert
    expect(result).toEqual({
      countryCode: 'US',
      displayName: 'United States',
      state: undefined,
    })
  })

  it('should correctly extract country from locale with script component', () => {
    // Arrange - Test locales like 'zh-Hans-CN' where script is included
    mockNavigatorLocale.mockReturnValue('zh-Hans-CN' as Locale)

    // Act
    const result = getCountryFromLocale()

    // Assert
    expect(result.countryCode).toBe('CN')
    expect(result.displayName).toBeTruthy()
    expect(result.state).toBeUndefined()
  })

  it('should correctly extract country from locale with script component via navigator.language', () => {
    // Arrange
    mockNavigatorLocale.mockReturnValue(undefined)
    Object.defineProperty(navigator, 'language', {
      value: 'zh-Hant-TW',
      configurable: true,
      writable: true,
    })

    // Act
    const result = getCountryFromLocale()

    // Assert
    expect(result.countryCode).toBe('TW')
    expect(result.displayName).toBeTruthy()
    expect(result.state).toBeUndefined()
  })

  it.each([
    [Locale.EnglishUnitedStates, 'US'],
    [Locale.JapaneseJapan, 'JP'],
    [Locale.PortugueseBrazil, 'BR'],
    [Locale.PortuguesePortugal, 'PT'],
  ])('should extract country code %s correctly as %s', (locale, expectedCountryCode) => {
    // Arrange
    mockNavigatorLocale.mockReturnValue(locale)

    // Act
    const result = getCountryFromLocale()

    // Assert
    expect(result.countryCode).toBe(expectedCountryCode)
    expect(result.state).toBeUndefined()
  })
})
