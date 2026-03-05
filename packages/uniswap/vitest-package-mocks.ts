/**
 * Common mocks for this package. This file is intended to be imported in the vitest-setup.ts file of the package.
 *
 * Notes:
 * * Try not to add test specific mocks here.
 * * Be wary of the import order.
 * * mocks can be overridden
 */

import { vi } from 'vitest'
import { mockLocalizationContext } from './src/test/mocks/locale'
import { mockSharedPersistQueryClientProvider } from './src/test/mocks/mockSharedPersistQueryClientProvider'

// Custom react-native-localize mock (the package's mock uses jest.fn() which isn't available)
const mockRNLocalize = {
  findBestLanguageTag: () => ({ languageTag: 'en-US', isRTL: false }),
  getLocales: () => [{ countryCode: 'US', languageTag: 'en-US', languageCode: 'en', isRTL: false }],
  getNumberFormatSettings: () => ({ decimalSeparator: '.', groupingSeparator: ',' }),
  getCalendar: () => 'gregorian',
  getCountry: () => 'US',
  getCurrencies: () => ['USD'],
  getTemperatureUnit: () => 'celsius',
  getTimeZone: () => 'America/New_York',
  uses24HourClock: () => true,
  usesMetricSystem: () => true,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}

// Mock @shopify/react-native-skia (vitest-compatible version of jestSetup.js)
vi.mock('@shopify/react-native-skia/lib/commonjs/Platform', () => {
  const Noop = () => undefined
  return {
    OS: 'web',
    PixelRatio: 1,
    requireNativeComponent: Noop,
    resolveAsset: Noop,
    findNodeHandle: Noop,
    NativeModules: Noop,
    View: Noop,
  }
})

vi.mock('@shopify/react-native-skia/lib/commonjs/skia/core/Font', () => {
  return {
    useFont: () => null,
    matchFont: () => null,
    listFontFamilies: () => [],
    useFonts: () => null,
  }
})

vi.mock('@shopify/react-native-skia', async () => {
  try {
    const mock = await vi.importActual<{ Mock: (canvasKit: unknown) => unknown }>(
      '@shopify/react-native-skia/lib/commonjs/mock',
    )
    // CanvasKit may not be available, provide a fallback
    return mock.Mock(global.CanvasKit ?? {})
  } catch {
    // Fallback if mock import fails
    return {}
  }
})

vi.mock('react-native-localize', () => mockRNLocalize)
vi.mock('uniswap/src/features/language/LocalizationContext', () => mockLocalizationContext({}))
vi.mock('uniswap/src/data/apiClients/SharedPersistQueryClientProvider', () => mockSharedPersistQueryClientProvider)

vi.mock('utilities/src/device/uniqueId', async () => {
  return await vi.importActual('./src/test/mocks/uniqueId')
})

// Note: @universe/gating partial mocks should be done in individual test files that need them
// The global mock was causing issues because vi.importActual returns a promise that wasn't
// being properly resolved before the mock was accessed
