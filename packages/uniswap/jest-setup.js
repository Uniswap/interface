import 'utilities/jest-package-mocks'
import 'uniswap/jest-package-mocks'
import 'ui/jest-package-mocks'

import 'uniswap/src/i18n' // Uses real translations for tests


jest.mock('uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext', () => {
  return {
    useTransactionSettingsContext: () => ({
      customDeadline: 20,
      customSlippage: 0.5,
    })
  }
})

// Use native modal
jest.mock('uniswap/src/components/modals/Modal', () => {
  return jest.requireActual('uniswap/src/components/modals/Modal.native.tsx')
})

// Mock the browser's performance API
global.performance = require('perf_hooks').performance

jest.mock('utilities/src/telemetry/trace/utils/calculateElapsedTimeWithPerformanceMarkMs', () => {
  return jest.requireActual('utilities/src/telemetry/trace/utils/calculateElapsedTimeWithPerformanceMarkMs.web.ts')
})


