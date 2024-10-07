import 'uniswap/src/i18n/i18n' // Uses real translations for tests
import 'utilities/src/logger/mocks'

import { localizeMock as mockRNLocalize } from 'react-native-localize/mock'
import { AppearanceSettingType } from 'wallet/src/features/appearance/slice'
import { mockLocalizationContext } from 'uniswap/src/test/mocks/locale'
import { mockSharedPersistQueryClientProvider } from 'uniswap/src/test/mocks/mockSharedPersistQueryClientProvider'
import { mockUIAssets } from 'ui/src/test/mocks/mockUIAssets'

jest.mock('react-native-localize', () => mockRNLocalize)
jest.mock('uniswap/src/features/language/LocalizationContext', () => mockLocalizationContext({}))

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

jest.mock('uniswap/src/features/gas/hooks', () => ({
  useActiveGasStrategy: jest.fn().mockReturnValue({
    limitInflationFactor: 1.15,
    priceInflationFactor: 1.5,
    percentileThresholdFor1559Fee: 75,
  }),
  useShadowGasStrategies: jest.fn().mockReturnValue([]),
}))

jest.mock('utilities/src/environment/env', () => ({
  isTestEnv: jest.fn(() => true),
  isDevEnv: jest.fn(() => false),
  isBetaEnv: jest.fn(() => false),
  isProdEnv: jest.fn(() => false),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn().mockImplementation(() => ({})),
  useSafeAreaFrame: jest.fn().mockImplementation(() => ({})),
  SafeAreaProvider: jest.fn(({ children }) => children),
}))

// Use web unicon
jest.mock('ui/src/components/Unicon', () => {
  return jest.requireActual('ui/src/components/Unicon/index.web.tsx')
})

// Use native modal
jest.mock('uniswap/src/components/modals/Modal', () => {
  return jest.requireActual('uniswap/src/components/modals/Modal.native.tsx')
})

// Use native clickable
jest.mock('ui/src/components/swipeablecards/ClickableWithinGesture', () => {
  return jest.requireActual('ui/src/components/swipeablecards/ClickableWithinGesture.native.tsx')
})

import crypto from "crypto"
Object.defineProperty(global, "crypto", {
  value: {
    getRandomValues: (arr) => crypto.randomBytes(arr.length),
    subtle: crypto.webcrypto.subtle,
  },
});

import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

jest.mock('uniswap/src/data/apiClients/SharedPersistQueryClientProvider', () => mockSharedPersistQueryClientProvider)

mockUIAssets()
