import 'wallet/src/i18n/i18n' // Uses real translations for tests

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
  SafeAreaProvider: jest.fn(({ children }) => children),
}))

// Mock feature flag tests to use native implementation as we already mock the native implementation of the statsig library
jest.mock('./src/features/experiments/hooks.ts', () => {
  return jest.requireActual('./src/features/experiments/hooks.native.ts')
})
