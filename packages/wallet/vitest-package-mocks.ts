/**
 * Common mocks for this package. This file is intended to be imported in the vitest-setup.ts file of the package.
 *
 * Notes:
 * * Try not to add test specific mocks here.
 * * Be wary of the import order.
 * * mocks can be overridden
 */
import { AppearanceSettingType } from 'uniswap/src/features/appearance/slice'
import { vi } from 'vitest'

// react-native-localize is mocked in uniswap/vitest-package-mocks (imported via uniswap/vitest-setup)

// Mock the appearance hook for all tests
const mockAppearanceSetting = AppearanceSettingType.System
vi.mock('uniswap/src/features/appearance/hooks', () => {
  return {
    useSelectedColorScheme: (): string => 'light',
    useCurrentAppearanceSetting: (): AppearanceSettingType => mockAppearanceSetting,
  }
})
