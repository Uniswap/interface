import { DeepLinkAction, parseDeepLinkUrl } from 'src/features/deepLinking/deepLinkUtils'
import { logger } from 'utilities/src/logger/logger'

// Mock the config utils
jest.mock('src/features/deepLinking/configUtils', () => ({
  getInAppBrowserAllowlist: jest.fn(() => ({ allowedUrls: [] })),
}))

// Mock the logger
jest.mock('utilities/src/logger/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

const mockGetInAppBrowserAllowlist = jest.mocked(
  require('src/features/deepLinking/configUtils').getInAppBrowserAllowlist,
)
const mockLogger = jest.mocked(logger)

describe('getDeepLinkAction', () => {
  it.each`
    url                                                                                                  | expected
    ${'https://app.uniswap.org/app?screen=transaction&fiatOnRamp=true&userAddress=0x123'}                | ${DeepLinkAction.UniswapWebLink}
    ${'uniswap://wc?uri=wc:123@2?relay-protocol=irn&symKey=51e'}                                         | ${DeepLinkAction.WalletConnectAsParam}
    ${'uniswap://wc:123@2?relay-protocol=irn&symKey=51e'}                                                | ${DeepLinkAction.UniswapWalletConnect}
    ${'uniswap://widget/#/tokens/ethereum/0x...'}                                                        | ${DeepLinkAction.UniswapWidget}
    ${'uniswap://scantastic?param=value'}                                                                | ${DeepLinkAction.Scantastic}
    ${'uniswap://uwulink?param=value'}                                                                   | ${DeepLinkAction.UwuLink}
    ${'https://uniswap.org/app?screen=transaction&fiatOnRamp=true&userAddress=0x123'}                    | ${DeepLinkAction.ShowTransactionAfterFiatOnRamp}
    ${'https://uniswap.org/app?screen=transaction&fiatOffRamp=true&userAddress=0x123'}                   | ${DeepLinkAction.ShowTransactionAfterFiatOffRampScreen}
    ${'https://uniswap.org/app?screen=transaction&userAddress=0x123'}                                    | ${DeepLinkAction.TransactionScreen}
    ${'https://uniswap.org/app?screen=swap&userAddress=0x123'}                                           | ${DeepLinkAction.SwapScreen}
    ${'uniswap://unsupported'}                                                                           | ${DeepLinkAction.SkipNonWalletConnect}
    ${'https://uniswap.org/app/wc?uri=wc:123'}                                                           | ${DeepLinkAction.UniversalWalletConnectLink}
    ${'wc:123@2?relay-protocol=irn&symKey=51e'}                                                          | ${DeepLinkAction.WalletConnect}
    ${'https://uniswap.org/app?screen=unknown'}                                                          | ${DeepLinkAction.Unknown}
    ${'uniswap://app/fiatonramp?userAddress=0x123&source=push'}                                          | ${DeepLinkAction.FiatOnRampScreen}
    ${'uniswap://app/fiatonramp?source=push&moonpayOnly=true&moonpayCurrencyCode=usdc&amount=100'}       | ${DeepLinkAction.FiatOnRampScreen}
    ${'uniswap://app/tokendetails?currencyId=10-0x6fd9d7ad17242c41f7131d257212c54a0e816691&source=push'} | ${DeepLinkAction.TokenDetails}
  `('url=$url should return expected=$expected', ({ url, expected }) => {
    expect(parseDeepLinkUrl(url).action).toEqual(expected)
  })
})

describe('parseDeepLinkUrl allowlist behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when allowlist is empty', () => {
    beforeEach(() => {
      mockGetInAppBrowserAllowlist.mockReturnValue({ allowedUrls: [] })
    })

    it('should return Unknown action and log appropriate error message', () => {
      const url = 'https://example.com/test'
      const result = parseDeepLinkUrl(url)

      expect(result.action).toBe(DeepLinkAction.Unknown)
      expect(mockLogger.error).toHaveBeenCalledWith(
        `No allowlist configured for browser opening, rejecting URL: ${url}`,
        {
          tags: { file: 'deepLinkUtils', function: 'parseDeepLinkUrl' },
        },
      )
      expect(mockLogger.error).toHaveBeenCalledWith(`Unknown deep link action for url=${url}`, {
        tags: { file: 'deepLinkUtils', function: 'parseDeepLinkUrl' },
      })
    })
  })

  describe('when allowlist is non-empty but URL is not allowlisted', () => {
    beforeEach(() => {
      mockGetInAppBrowserAllowlist.mockReturnValue({ allowedUrls: ['https://trusted.com'] })
    })

    it('should return Unknown action and log URL not allowlisted error', () => {
      const url = 'https://untrusted.com/test'
      const result = parseDeepLinkUrl(url)

      expect(result.action).toBe(DeepLinkAction.Unknown)
      expect(mockLogger.error).toHaveBeenCalledWith(`URL not allowlisted for browser opening: ${url}`, {
        tags: { file: 'deepLinkUtils', function: 'parseDeepLinkUrl' },
      })
      expect(mockLogger.error).toHaveBeenCalledWith(`Unknown deep link action for url=${url}`, {
        tags: { file: 'deepLinkUtils', function: 'parseDeepLinkUrl' },
      })
    })
  })

  describe('when URL is allowlisted', () => {
    beforeEach(() => {
      mockGetInAppBrowserAllowlist.mockReturnValue({ allowedUrls: [{ url: 'https://example.com', openInApp: true }] })
    })

    it('should return InAppBrowser action without logging errors', () => {
      const url = 'https://example.com/test'
      const result = parseDeepLinkUrl(url)

      expect(result.action).toBe(DeepLinkAction.InAppBrowser)
      if (result.action === DeepLinkAction.InAppBrowser) {
        expect(result.data.targetUrl).toBe(url)
        expect(result.data.openInApp).toBe(true)
      }
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    it('should respect openInApp configuration', () => {
      mockGetInAppBrowserAllowlist.mockReturnValue({ allowedUrls: [{ url: 'https://example.com', openInApp: false }] })

      const url = 'https://example.com/test'
      const result = parseDeepLinkUrl(url)

      expect(result.action).toBe(DeepLinkAction.InAppBrowser)
      if (result.action === DeepLinkAction.InAppBrowser) {
        expect(result.data.openInApp).toBe(false)
      }
    })
  })
})
