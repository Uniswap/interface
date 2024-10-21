import 'uniswap/src/i18n/i18n' // Uses real translations for tests
import 'utilities/src/logger/mocks'

import { localizeMock as mockRNLocalize } from 'react-native-localize/mock'
import { mockLocalizationContext } from 'uniswap/src/test/mocks/locale'
import { TextEncoder, TextDecoder } from 'util';
import { mockSharedPersistQueryClientProvider } from 'uniswap/src/test/mocks/mockSharedPersistQueryClientProvider'

jest.mock('react-native-localize', () => mockRNLocalize)

jest.mock('uniswap/src/features/language/LocalizationContext', () => mockLocalizationContext({}))

// Use native modal
jest.mock('uniswap/src/components/modals/Modal', () => {
  return jest.requireActual('uniswap/src/components/modals/Modal.native.tsx')
})

// Mock the browser's performance API
global.performance = require('perf_hooks').performance

jest.mock('utilities/src/telemetry/trace/utils/calculateElapsedTimeWithPerformanceMarkMs', () => {
  return jest.requireActual('utilities/src/telemetry/trace/utils/calculateElapsedTimeWithPerformanceMarkMs.web.ts')
})

jest.mock('utilities/src/environment/env', () => ({
  isTestEnv: jest.fn(() => true),
  isDevEnv: jest.fn(() => false),
  isBetaEnv: jest.fn(() => false),
  isProdEnv: jest.fn(() => false),
}))

jest.mock('uniswap/src/data/apiClients/SharedPersistQueryClientProvider', () => mockSharedPersistQueryClientProvider)

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
