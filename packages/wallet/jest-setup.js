import 'utilities/jest-package-mocks'
import 'config/jest-presets/ui/ui-package-mocks'
import 'uniswap/jest-package-mocks'
import 'wallet/jest-package-mocks'

import 'uniswap/src/i18n' // Uses real translations for tests


jest.mock('uniswap/src/features/gas/hooks', () => ({
  useActiveGasStrategy: jest.fn().mockReturnValue({
    limitInflationFactor: 1.15,
    displayLimitInflationFactor: 1,
    priceInflationFactor: 1.5,
    percentileThresholdFor1559Fee: 75,
  }),
}))

// Mock getConfig to return test-safe native values
jest.mock('uniswap/src/config', () => ({
  config: {
    alchemyApiKey: 'test-alchemy-key',
    amplitudeProxyUrlOverride: '',
    apiBaseUrlOverride: '',
    apiBaseUrlV2Override: '',
    appsflyerApiKey: 'test-appsflyer-key',
    appsflyerAppId: 'test-appsflyer-id',
    datadogClientToken: 'test-datadog-token',
    datadogProjectId: 'test-datadog-project',
    isE2ETest: false,
    forApiUrlOverride: '',
    graphqlUrlOverride: '',
    includePrototypeFeatures: '',
    infuraKey: 'test-infura-key',
    onesignalAppId: 'test-onesignal-id',
    quicknodeEndpointName: '',
    quicknodeEndpointToken: '',
    scantasticApiUrlOverride: '',
    statsigApiKey: 'test-statsig-key',
    statsigProxyUrlOverride: '',
    tradingApiKey: 'test-trading-key',
    tradingApiUrlOverride: '',
    tradingApiWebTestEnv: '',
    uniswapApiKey: 'test-uniswap-key',
    unitagsApiUrlOverride: '',
    walletConnectProjectId: 'test-wallet-connect-id',
    walletConnectProjectIdBeta: 'test-wallet-connect-beta',
    walletConnectProjectIdDev: 'test-wallet-connect-dev',
  },
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

// Use native locales
jest.mock('utilities/src/device/locales', () => {
  return jest.requireActual('utilities/src/device/locales.native.ts')
})

// Mock getConfig to use native implementation
jest.mock('@universe/config', () => {
  const { getConfig } = jest.requireActual('@universe/config/src/getConfig.native')
  return {
    getConfig
  }
})
