/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { TrafficFlows } from '@universe/api/src/clients/base/urls'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the platform and environment utilities
vi.mock('utilities/src/environment/env')
vi.mock('utilities/src/platform')

const envConfigs = {
  webProd: {
    isWebApp: true,
    isDevEnv: false,
  },
  webDev: {
    isWebApp: true,
    isDevEnv: true,
  },
  webBeta: {
    isWebApp: true,
    isBetaEnv: true,
  },
  mobileIosProd: {
    isMobileApp: true,
    isIOS: true,
    isAndroid: false,
    isDevEnv: false,
  },
  mobileIosDev: {
    isMobileApp: true,
    isIOS: true,
    isAndroid: false,
    isDevEnv: true,
  },
  mobileIosBeta: {
    isMobileApp: true,
    isIOS: true,
    isAndroid: false,
    isBetaEnv: true,
  },
  mobileAndroidProd: {
    isMobileApp: true,
    isAndroid: true,
    isDevEnv: false,
  },
  mobileAndroidDev: {
    isMobileApp: true,
    isAndroid: true,
    isDevEnv: true,
  },
  mobileAndroidBeta: {
    isMobileApp: true,
    isAndroid: true,
    isBetaEnv: true,
  },
  extensionProd: {
    isExtensionApp: true,
    isDevEnv: false,
  },
  extensionDev: {
    isExtensionApp: true,
    isDevEnv: true,
  },
  extensionBeta: {
    isExtensionApp: true,
    isBetaEnv: true,
  },
  playwrightDev: {
    isWebApp: true,
    isPlaywrightEnv: true,
    isDevEnv: true,
  },
  playwrightProd: {
    isWebApp: true,
    isPlaywrightEnv: true,
    isDevEnv: false,
  },
}
describe('urls', () => {
  beforeEach(async () => {
    // Reset modules to clear cached imports
    vi.resetModules()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getCloudflareApiBaseUrl', () => {
    describe('TradingApi', () => {
      it.each([
        // Web
        {
          expectedUrl: 'https://trading-api-labs.interface.gateway.uniswap.org',
          env: envConfigs.webProd,
        },
        {
          expectedUrl: 'https://beta.trading-api-labs.interface.gateway.uniswap.org',
          env: envConfigs.webDev,
        },
        {
          expectedUrl: 'https://trading-api-labs.interface.gateway.uniswap.org',
          env: envConfigs.webBeta,
        },
        // Mobile iOS
        {
          expectedUrl: 'https://trading-api-labs.ios.wallet.gateway.uniswap.org',
          env: envConfigs.mobileIosProd,
        },
        {
          expectedUrl: 'https://beta.trading-api-labs.ios.wallet.gateway.uniswap.org',
          env: envConfigs.mobileIosDev,
        },
        {
          expectedUrl: 'https://trading-api-labs.ios.wallet.gateway.uniswap.org',
          env: envConfigs.mobileIosBeta,
        },
        // Mobile Android
        {
          expectedUrl: 'https://trading-api-labs.android.wallet.gateway.uniswap.org',
          env: envConfigs.mobileAndroidProd,
        },
        {
          expectedUrl: 'https://beta.trading-api-labs.android.wallet.gateway.uniswap.org',
          env: envConfigs.mobileAndroidDev,
        },
        {
          expectedUrl: 'https://trading-api-labs.android.wallet.gateway.uniswap.org',
          env: envConfigs.mobileAndroidBeta,
        },
        // Extension
        {
          expectedUrl: 'https://trading-api-labs.extension.gateway.uniswap.org',
          env: envConfigs.extensionProd,
        },
        {
          expectedUrl: 'https://beta.trading-api-labs.extension.gateway.uniswap.org',
          env: envConfigs.extensionDev,
        },
        {
          expectedUrl: 'https://trading-api-labs.extension.gateway.uniswap.org',
          env: envConfigs.extensionBeta,
        },
        // Playwright
        {
          expectedUrl: 'https://trading-api-labs.interface.gateway.uniswap.org',
          env: envConfigs.playwrightDev,
        },
        {
          expectedUrl: 'https://trading-api-labs.interface.gateway.uniswap.org',
          env: envConfigs.playwrightProd,
        },
      ])('generates correct URL for $env', async ({ expectedUrl, env }) => {
        mockEnvironmentAndPlatform(env)
        const { getCloudflareApiBaseUrl } = await import('./urls')
        expect(getCloudflareApiBaseUrl({ flow: TrafficFlows.TradingApi })).toBe(expectedUrl)
      })
    })

    describe('DataApi', () => {
      it.each([
        // Web
        { expectedUrl: 'https://beta.gateway.uniswap.org', env: envConfigs.webDev },
        { expectedUrl: 'https://interface.gateway.uniswap.org', env: envConfigs.webBeta },
        { expectedUrl: 'https://interface.gateway.uniswap.org', env: envConfigs.webProd },
        // Mobile iOS
        { expectedUrl: 'https://beta.gateway.uniswap.org', env: envConfigs.mobileIosDev },
        { expectedUrl: 'https://ios.wallet.gateway.uniswap.org', env: envConfigs.mobileIosBeta },
        { expectedUrl: 'https://ios.wallet.gateway.uniswap.org', env: envConfigs.mobileIosProd },
        // Mobile Android
        { expectedUrl: 'https://beta.gateway.uniswap.org', env: envConfigs.mobileAndroidDev },
        { expectedUrl: 'https://android.wallet.gateway.uniswap.org', env: envConfigs.mobileAndroidBeta },
        { expectedUrl: 'https://android.wallet.gateway.uniswap.org', env: envConfigs.mobileAndroidProd },
        // Extension
        { expectedUrl: 'https://beta.gateway.uniswap.org', env: envConfigs.extensionDev },
        { expectedUrl: 'https://extension.gateway.uniswap.org', env: envConfigs.extensionBeta },
        { expectedUrl: 'https://extension.gateway.uniswap.org', env: envConfigs.extensionProd },
        // Playwright
        { expectedUrl: 'https://interface.gateway.uniswap.org', env: envConfigs.playwrightDev },
        { expectedUrl: 'https://interface.gateway.uniswap.org', env: envConfigs.playwrightProd },
      ])('generates correct URL for $env', async ({ expectedUrl, env }) => {
        mockEnvironmentAndPlatform(env)
        const { getCloudflareApiBaseUrl } = await import('./urls')
        expect(getCloudflareApiBaseUrl({ flow: TrafficFlows.DataApi })).toBe(expectedUrl)
      })
    })
  })

  describe('Default Flow', () => {
    it.each([
      // Web
      { expectedUrl: 'https://interface.gateway.uniswap.org', env: envConfigs.webDev },
      { expectedUrl: 'https://interface.gateway.uniswap.org', env: envConfigs.webBeta },
      { expectedUrl: 'https://interface.gateway.uniswap.org', env: envConfigs.webProd },
      // Mobile iOS
      { expectedUrl: 'https://ios.wallet.gateway.uniswap.org', env: envConfigs.mobileIosDev },
      { expectedUrl: 'https://ios.wallet.gateway.uniswap.org', env: envConfigs.mobileIosBeta },
      { expectedUrl: 'https://ios.wallet.gateway.uniswap.org', env: envConfigs.mobileIosProd },
      // Mobile Android
      { expectedUrl: 'https://android.wallet.gateway.uniswap.org', env: envConfigs.mobileAndroidDev },
      { expectedUrl: 'https://android.wallet.gateway.uniswap.org', env: envConfigs.mobileAndroidBeta },
      { expectedUrl: 'https://android.wallet.gateway.uniswap.org', env: envConfigs.mobileAndroidProd },
      // Extension
      { expectedUrl: 'https://extension.gateway.uniswap.org', env: envConfigs.extensionDev },
      { expectedUrl: 'https://extension.gateway.uniswap.org', env: envConfigs.extensionBeta },
      { expectedUrl: 'https://extension.gateway.uniswap.org', env: envConfigs.extensionProd },
      // Playwright
      { expectedUrl: 'https://interface.gateway.uniswap.org', env: envConfigs.playwrightDev },
      { expectedUrl: 'https://interface.gateway.uniswap.org', env: envConfigs.playwrightProd },
    ])('generates correct URL for $env', async ({ expectedUrl, env }) => {
      mockEnvironmentAndPlatform(env)
      const { getCloudflareApiBaseUrl } = await import('./urls')
      expect(getCloudflareApiBaseUrl()).toBe(expectedUrl)
    })
  })

  it.each(Object.values(TrafficFlows))(
    'getCloudflareApiBaseUrl appends postfix correctly for flow: %s',
    async (flow) => {
      mockEnvironmentAndPlatform(envConfigs.webProd)
      const { getCloudflareApiBaseUrl } = await import('./urls')
      const postfix = 'my-postfix'

      const baseUrl = getCloudflareApiBaseUrl({ flow })
      const urlWithPostfix = getCloudflareApiBaseUrl({ flow, postfix })

      expect(urlWithPostfix).toBe(`${baseUrl}/${postfix}`)
    },
  )

  it('generates correct URL for GraphQL flow in web/Playwright', async () => {
    vi.doMock('utilities/src/environment/env', () => ({
      isBetaEnv: () => false,
      isDevEnv: () => false,
      isRNDev: () => false,
      isPlaywrightEnv: () => true,
      isTestEnv: () => false,
    }))

    vi.doMock('utilities/src/platform', () => ({
      isAndroid: false,
      isExtensionApp: false,
      isMobileApp: false,
      isWebApp: false,
    }))

    const { getCloudflareApiBaseUrl } = await import('./urls')
    const result = getCloudflareApiBaseUrl({ flow: TrafficFlows.GraphQL })

    expect(result).toBe('https://graphql.interface.gateway.uniswap.org')
  })
})

/**
 * Helper to create mock configurations for environment and platform utilities.
 * All values default to false but can be overridden.
 */
function mockEnvironmentAndPlatform(
  overrides: {
    isBetaEnv?: boolean
    isDevEnv?: boolean
    isRNDev?: boolean
    isPlaywrightEnv?: boolean
    isTestEnv?: boolean
    isAndroid?: boolean
    isExtensionApp?: boolean
    isMobileApp?: boolean
    isWebApp?: boolean
  } = {},
) {
  const {
    isBetaEnv = false,
    isDevEnv = false,
    isRNDev = false,
    isPlaywrightEnv = false,
    isTestEnv = false,
    isAndroid = false,
    isExtensionApp = false,
    isMobileApp = false,
    isWebApp = false,
  } = overrides

  vi.doMock('utilities/src/environment/env', () => ({
    isBetaEnv: () => isBetaEnv,
    isDevEnv: () => isDevEnv,
    isRNDev: () => isRNDev,
    isPlaywrightEnv: () => isPlaywrightEnv,
    isTestEnv: () => isTestEnv,
  }))

  vi.doMock('utilities/src/platform', () => ({
    isAndroid,
    isExtensionApp,
    isMobileApp,
    isWebApp,
  }))
}
