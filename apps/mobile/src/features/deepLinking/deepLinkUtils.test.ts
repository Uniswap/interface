import { DeepLinkAction, parseDeepLinkUrl } from 'src/features/deepLinking/deepLinkUtils'

// Mock the logger
jest.mock('utilities/src/logger/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

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
    ${'https://cryptothegame.com/'}                                                                      | ${DeepLinkAction.UniswapExternalBrowserLink}
    ${'https://support.uniswap.org/hc/en-us/articles/test-article-123'}                                  | ${DeepLinkAction.UniswapExternalBrowserLink}
    ${'https://blog.uniswap.org/article'}                                                                | ${DeepLinkAction.UniswapExternalBrowserLink}
    ${'https://uniswapx.uniswap.org/'}                                                                   | ${DeepLinkAction.UniswapExternalBrowserLink}
  `('url=$url should return expected=$expected', ({ url, expected }) => {
    expect(parseDeepLinkUrl(url).action).toEqual(expected)
  })
})
