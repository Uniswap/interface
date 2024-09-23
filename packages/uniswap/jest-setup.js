import 'uniswap/src/i18n/i18n' // Uses real translations for tests
import 'utilities/src/logger/mocks'

import { TextEncoder, TextDecoder } from 'util';
import { mockSharedPersistQueryClientProvider } from 'uniswap/src/test/mocks/mockSharedPersistQueryClientProvider'

jest.mock('utilities/src/environment', () => ({
  isTestEnv: jest.fn(() => true),
  isDevEnv: jest.fn(() => false),
  isBetaEnv: jest.fn(() => false),
  isProdEnv: jest.fn(() => false),
}))

jest.mock('uniswap/src/data/apiClients/SharedPersistQueryClientProvider', () => mockSharedPersistQueryClientProvider)

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
