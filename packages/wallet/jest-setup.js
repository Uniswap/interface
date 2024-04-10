import 'uniswap/src/i18n/i18n' // Uses real translations for tests

import { localizeMock as mockRNLocalize } from 'react-native-localize/mock'
import { AppearanceSettingType } from 'wallet/src/features/appearance/slice'
import { mockLocalizationContext } from 'wallet/src/test/mocks/utils'

jest.mock('react-native-localize', () => mockRNLocalize)
jest.mock('wallet/src/features/language/LocalizationContext', () => mockLocalizationContext)

// Mock the appearance hook for all tests
const mockAppearanceSetting = AppearanceSettingType.System
jest.mock('wallet/src/features/appearance/hooks', () => {
  return {
    useCurrentAppearanceSetting: () => mockAppearanceSetting,
  }
})
jest.mock('wallet/src/features/appearance/hooks', () => {
  return {
    useSelectedColorScheme: () => 'light',
  }
})

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn().mockImplementation(() => ({})),
  useSafeAreaFrame: jest.fn().mockImplementation(() => ({})),
  SafeAreaProvider: jest.fn(({ children }) => children),
}))

// Always use the web version, which is a no-op.
jest.mock('ui/src/utils/haptics/HapticFeedback', () => {
  return jest.requireActual('ui/src/utils/haptics/HapticFeedback.web.ts')
})

import crypto from "crypto"
Object.defineProperty(global, "crypto", {
  value: {
    getRandomValues: (arr) => crypto.randomBytes(arr.length),
    subtle: crypto.webcrypto.subtle,
  },
});

import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
