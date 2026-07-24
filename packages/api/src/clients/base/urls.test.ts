import { TrafficFlows } from '@universe/api/src/clients/base/urls'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
    isE2eTestEnv: true,
    isDevEnv: true,
  },
  playwrightProd: {
    isWebApp: true,
    isE2eTestEnv: true,
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
    describe('DataApi', () => {
      it.each([
        // Web
        { expectedUrl: 'https://entry-gateway.backend-staging.api.uniswap.org', env: envConfigs.webDev },
        { expectedUrl: 'https://interface.gateway.uniswap.org', env: envConfigs.webBeta },
        { expectedUrl: 'https://interface.gateway.uniswap.org', env: envConfigs.webProd },
        // Mobile iOS
        { expectedUrl: 'https://entry-gateway.backend-staging.api.uniswap.org', env: envConfigs.mobileIosDev },
        { expectedUrl: 'https://ios.wallet.gateway.uniswap.org', env: envConfigs.mobileIosBeta },
        { expectedUrl: 'https://ios.wallet.gateway.uniswap.org', env: envConfigs.mobileIosProd },
        // Mobile Android
        { expectedUrl: 'https://entry-gateway.backend-staging.api.uniswap.org', env: envConfigs.mobileAndroidDev },
        { expectedUrl: 'https://android.wallet.gateway.uniswap.org', env: envConfigs.mobileAndroidBeta },
        { expectedUrl: 'https://android.wallet.gateway.uniswap.org', env: envConfigs.mobileAndroidProd },
        // Extension
        { expectedUrl: 'https://entry-gateway.backend-staging.api.uniswap.org', env: envConfigs.extensionDev },
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
    vi.doMock('@universe/environment', () => ({
      isBetaEnv: () => false,
      isDevEnv: () => false,
      isRNDev: () => false,
      isE2eTestEnv: () => true,
      isTestEnv: () => false,
      isAndroid: false,
      isExtensionApp: false,
      isMobileApp: false,
      isWebApp: false,
    }))

    const { getCloudflareApiBaseUrl } = await import('./urls')
    const result = getCloudflareApiBaseUrl({ flow: TrafficFlows.GraphQL })

    expect(result).toBe('https://graphql.interface.gateway.uniswap.org')
  })

  describe('createHelpArticleUrl', () => {
    it('builds an article URL without a section', async () => {
      mockEnvironmentAndPlatform(envConfigs.webProd)
      const { createHelpArticleUrl } = await import('./urls')
      expect(createHelpArticleUrl('46569604134157-Launching-a-Continuous-Clearing-Auction')).toBe(
        'https://support.uniswap.org/hc/en-us/articles/46569604134157-Launching-a-Continuous-Clearing-Auction?product_link=web',
      )
    })

    it('appends the section fragment after the query string', async () => {
      mockEnvironmentAndPlatform(envConfigs.webProd)
      const { createHelpArticleUrl } = await import('./urls')
      expect(
        createHelpArticleUrl('46569604134157-Launching-a-Continuous-Clearing-Auction', {
          section: 'set-your-auction-details',
        }),
      ).toBe(
        'https://support.uniswap.org/hc/en-us/articles/46569604134157-Launching-a-Continuous-Clearing-Auction?product_link=web#set-your-auction-details',
      )
    })

    it('uses the app-specific product_link for the section URL', async () => {
      mockEnvironmentAndPlatform(envConfigs.mobileIosProd)
      const { createHelpArticleUrl } = await import('./urls')
      expect(
        createHelpArticleUrl('123', {
          section: 'configure-the-liquidity-pool-your-auction-will-seed-into-at-the-end',
        }),
      ).toBe(
        'https://support.uniswap.org/hc/en-us/articles/123?product_link=mobileApp#configure-the-liquidity-pool-your-auction-will-seed-into-at-the-end',
      )
    })
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
    isE2eTestEnv?: boolean
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
    isE2eTestEnv = false,
    isTestEnv = false,
    isAndroid = false,
    isExtensionApp = false,
    isMobileApp = false,
    isWebApp = false,
  } = overrides

  vi.doMock('@universe/environment', () => ({
    isBetaEnv: () => isBetaEnv,
    isDevEnv: () => isDevEnv,
    isRNDev: () => isRNDev,
    isE2eTestEnv: () => isE2eTestEnv,
    isTestEnv: () => isTestEnv,
    isAndroid,
    isExtensionApp,
    isMobileApp,
    isWebApp,
  }))
}
