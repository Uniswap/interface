/**
 * Common mocks for this package. This file is intended to be imported in the jest-setup.js file of the package.
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
