/**
 * Common Jest mocks for packages that depend on uniswap.
 * Note: The uniswap package itself has migrated to Vitest (see vitest-package-mocks.ts).
 * This file is kept for other packages (e.g., mobile, extension, wallet) that still use Jest.
 *
 * Notes:
 * * Try not to add test specific mocks here.
 * * Be wary of the import order.
 * * mocks can be overridden
 */

import '@shopify/react-native-skia/jestSetup'
import mockRNLocalize from 'react-native-localize/mock'
import { mockLocalizationContext } from 'uniswap/src/test/mocks/locale'
import { mockSharedPersistQueryClientProvider } from 'uniswap/src/test/mocks/mockSharedPersistQueryClientProvider'

jest.mock('react-native-localize', () => mockRNLocalize)
jest.mock('uniswap/src/features/language/LocalizationContext', () => mockLocalizationContext({}))
jest.mock('uniswap/src/data/apiClients/SharedPersistQueryClientProvider', () => mockSharedPersistQueryClientProvider)

jest.mock('utilities/src/device/uniqueId', () => {
  return jest.requireActual('uniswap/src/test/mocks/uniqueId')
})

jest.mock('uniswap/src/data/getVersionHeader', () => {
  return jest.requireActual('uniswap/src/data/getVersionHeader.web')
})

jest.mock('@universe/gating', () => {
  const actual = jest.requireActual('@universe/gating')
  return {
    ...actual,
    useClientAsyncInit: jest.fn(() => ({
      client: null,
      isLoading: true,
    })),
  }
})
