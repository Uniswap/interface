import {
  getUniswapServiceUrls,
  UNISWAP_STAGING_WEB_HOSTNAME,
  UNISWAP_WEB_HOSTNAME,
  UniswapHelpUrls,
} from 'uniswap/src/constants/urls'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Drive the environment helpers per test so we can exercise the beta routing switch.
const mockEnvState = {
  isWebApp: false,
  isBetaEnv: false,
  isDevEnv: false,
  isE2eTestEnv: false,
}

// getCurrentEnv reads the real (unmocked) env helpers internally, so mirror it here.
function mockCurrentEnv(): string {
  if (mockEnvState.isDevEnv) {
    return 'development'
  }
  return mockEnvState.isBetaEnv ? 'staging' : 'production'
}

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isWebApp(): boolean {
      return mockEnvState.isWebApp
    },
    isBetaEnv: () => mockEnvState.isBetaEnv,
    isDevEnv: () => mockEnvState.isDevEnv,
    isE2eTestEnv: () => mockEnvState.isE2eTestEnv,
    getCurrentEnv: mockCurrentEnv,
  }
})

describe('getUniswapServiceUrls — beta API target', () => {
  afterEach(() => {
    mockEnvState.isWebApp = false
    mockEnvState.isBetaEnv = false
    mockEnvState.isDevEnv = false
    mockEnvState.isE2eTestEnv = false
  })

  it('routes beta to staging by default (isBetaUsingProdApi unset)', () => {
    mockEnvState.isBetaEnv = true

    const urls = getUniswapServiceUrls({})

    expect(urls.embeddedWalletHostname).toBe(UNISWAP_STAGING_WEB_HOSTNAME)
    expect(urls.liquidityServiceUrl).toContain('backend-staging')
    expect(urls.privyEmbeddedWalletUrl).toContain('backend-staging')
    expect(urls.apiBaseUrlV2).toBe('https://staging.rpc.uniswap.org')
  })

  it('routes beta to prod when isBetaUsingProdApi is true', () => {
    mockEnvState.isBetaEnv = true

    const urls = getUniswapServiceUrls({ isBetaUsingProdApi: true })

    expect(urls.embeddedWalletHostname).toBe(UNISWAP_WEB_HOSTNAME)
    expect(urls.liquidityServiceUrl).toContain('backend-prod')
    expect(urls.privyEmbeddedWalletUrl).toContain('backend-prod')
    // apiBaseUrlV2 follows getEntryGatewayUrl, which keeps beta on staging.
    expect(urls.apiBaseUrlV2).toBe('https://staging.rpc.uniswap.org')
  })

  it('keeps beta on staging when isBetaUsingProdApi is false', () => {
    mockEnvState.isBetaEnv = true

    const urls = getUniswapServiceUrls({ isBetaUsingProdApi: false })

    expect(urls.embeddedWalletHostname).toBe(UNISWAP_STAGING_WEB_HOSTNAME)
    expect(urls.liquidityServiceUrl).toContain('backend-staging')
  })

  it('ignores isBetaUsingProdApi outside a beta build (dev stays on staging/dev hosts)', () => {
    mockEnvState.isDevEnv = true

    // isBetaUsingProdApi only gates beta; dev routing must be unaffected.
    const urls = getUniswapServiceUrls({ isBetaUsingProdApi: true })

    expect(urls.embeddedWalletHostname).toBe('dev.ew.unihq.org')
    expect(urls.liquidityServiceUrl).toContain('backend-staging')
    expect(urls.apiBaseUrlV2).toBe('https://dev.rpc.uniswap.org')
  })
})

describe('getUniswapServiceUrls — apiBaseUrlV2', () => {
  afterEach(() => {
    mockEnvState.isDevEnv = false
    mockEnvState.isE2eTestEnv = false
  })

  it('points production at the Entry Gateway front door, with no /v2 prefix', () => {
    expect(getUniswapServiceUrls({}).apiBaseUrlV2).toBe('https://rpc.uniswap.org')
  })

  it('keeps e2e on production even in a dev build', () => {
    mockEnvState.isDevEnv = true
    mockEnvState.isE2eTestEnv = true

    expect(getUniswapServiceUrls({}).apiBaseUrlV2).toBe('https://rpc.uniswap.org')
  })

  it('lets an explicit override win', () => {
    expect(getUniswapServiceUrls({ apiBaseUrlV2Override: 'https://example.test' }).apiBaseUrlV2).toBe(
      'https://example.test',
    )
  })
})

describe('UniswapHelpUrls', () => {
  it('uses the canonical Earn article slug for general help', () => {
    expect(UniswapHelpUrls.articles.earnHelp).toBe(
      'https://support.uniswap.org/hc/en-us/articles/46865818181901-Earn-on-Uniswap?product_link=web',
    )
  })

  it('links Earn transaction failures to the troubleshooting section', () => {
    expect(UniswapHelpUrls.articles.earnTroubleshooting).toBe(
      'https://support.uniswap.org/hc/en-us/articles/46865818181901-Earn-on-Uniswap?product_link=web#troubleshooting-errors',
    )
  })

  it('links the Uniswap hook provenance badge to its help article', () => {
    expect(UniswapHelpUrls.articles.uniswapBuiltHooks).toBe(
      'https://support.uniswap.org/hc/en-us/articles/48747190274317?product_link=web',
    )
  })
})

describe('getUniswapServiceUrls — analytics proxies', () => {
  afterEach(() => {
    mockEnvState.isWebApp = false
    mockEnvState.isBetaEnv = false
    mockEnvState.isDevEnv = false
  })

  it.each([
    { name: 'prod', isBetaEnv: false, isDevEnv: false },
    { name: 'beta', isBetaEnv: true, isDevEnv: false },
    { name: 'dev', isBetaEnv: false, isDevEnv: true },
  ])('sends $name builds to the prod gateway', ({ isBetaEnv, isDevEnv }) => {
    mockEnvState.isBetaEnv = isBetaEnv
    mockEnvState.isDevEnv = isDevEnv

    const urls = getUniswapServiceUrls({})

    expect(urls.amplitudeProxyUrl).toBe('https://rpc.uniswap.org/v1/amplitude-proxy')
    expect(urls.statsigProxyUrl).toBe('https://rpc.uniswap.org/v1/statsig-proxy')
  })

  it('keeps web on the same-origin /config proxy', () => {
    mockEnvState.isWebApp = true

    expect(getUniswapServiceUrls({}).statsigProxyUrl).toBe('/config')
  })

  it('lets explicit overrides win', () => {
    const urls = getUniswapServiceUrls({
      amplitudeProxyUrlOverride: 'https://amplitude.test',
      statsigProxyUrlOverride: 'https://statsig.test',
    })

    expect(urls.amplitudeProxyUrl).toBe('https://amplitude.test')
    expect(urls.statsigProxyUrl).toBe('https://statsig.test')
  })
})
