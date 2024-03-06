import { localizeMock as mockRNLocalize } from 'react-native-localize/mock'
import { AppearanceSettingType } from 'wallet/src/features/appearance/slice'
import { initializeTranslation } from 'wallet/src/i18n/i18n'
import { mockLocalizationContext } from 'wallet/src/test/mocks/utils'

// Uses real translations for tests
initializeTranslation()

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
