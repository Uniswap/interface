/**
 * Common mocks for this package. This file is intended to be imported in the jest-setup.js file of the package.
 *
 * Notes:
 * * Try not to add test specific mocks here.
 * * Be wary of the import order.
 * * mocks can be overridden
 */
import mockRNLocalize from 'react-native-localize/mock'
import { AppearanceSettingType } from 'wallet/src/features/appearance/slice'

jest.mock('react-native-localize', () => mockRNLocalize)

// Mock the appearance hook for all tests
const mockAppearanceSetting = AppearanceSettingType.System
jest.mock('wallet/src/features/appearance/hooks', () => {
  return {
    useSelectedColorScheme: () => 'light',
    useCurrentAppearanceSetting: () => mockAppearanceSetting,
  }
})
