// Mock expo-secure-store before any imports that might use it
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}))

import 'utilities/jest-package-mocks'
import 'uniswap/jest-package-mocks'
import 'config/jest-presets/ui/ui-package-mocks'

import 'uniswap/src/i18n' // Uses real translations for tests

jest.mock(
  'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore',
  () => {
    return {
      useTransactionSettingsStore: (selector) =>
        selector({
          customDeadline: 20,
          customSlippageTolerance: 0.5,
        }),
    }
  },
)

// Use native modal
jest.mock('uniswap/src/components/modals/Modal', () => {
  return jest.requireActual('uniswap/src/components/modals/Modal.native.tsx')
})

// Mock the browser's performance API
global.performance = require('perf_hooks').performance

jest.mock('utilities/src/telemetry/trace/utils/calculateElapsedTimeWithPerformanceMarkMs', () => {
  return jest.requireActual('utilities/src/telemetry/trace/utils/calculateElapsedTimeWithPerformanceMarkMs.web.ts')
})

// Use web OverKeyboardContent
jest.mock('ui/src/components/OverKeyboardContent/OverKeyboardContent', () => {
  return jest.requireActual('ui/src/components/OverKeyboardContent/OverKeyboardContent.web.tsx')
})
