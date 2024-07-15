import { isDevEnv, isTestEnv } from 'utilities/src/environment'
import { isAndroid, isExtension, isInterface, isMobileApp } from 'utilities/src/platform'

enum TrafficFlows {
  GraphQL = 'graphql',
  Metrics = 'metrics',
  Gating = 'gating',
  TradingApi = 'trading-api-labs',
  Unitags = 'unitags',
  FOR = 'for',
  Scantastic = 'scantastic',
}

const FLOWS_USING_BETA = [TrafficFlows.FOR]

export const UNISWAP_WEB_HOSTNAME = 'app.uniswap.org'

export const UNISWAP_WEB_URL = `https://${UNISWAP_WEB_HOSTNAME}`
export const UNISWAP_APP_URL = 'https://uniswap.org/app'

const helpUrl = 'https://support.uniswap.org/hc/en-us'

export const uniswapUrls = {
  // Help and web articles/items
  helpUrl,
  helpRequestUrl: `${helpUrl}/requests/new`,
  helpArticleUrls: {
    approvalsExplainer: `${helpUrl}/articles/8120520483085-What-is-an-approval-transaction`,
    extensionHelp: `${helpUrl}/categories/25219141467405`,
    extensionWaitlist: `${helpUrl}/articles/24458735271181-Get-started-with-the-Uniswap-Extension`,
    extensionDappTroubleshooting: `${helpUrl}/articles/25811698471565-Connecting-Uniswap-Extension-Beta-to-other-dapps`,
    feeOnTransferHelp: `${helpUrl}/articles/18673568523789-What-is-a-token-fee-`,
    howToSwapTokens: `${helpUrl}/articles/8370549680909-How-to-swap-tokens-`,
    impermanentLoss: `${helpUrl}/articles/20904453751693-What-is-Impermanent-Loss`,
    limitsFailure: `${helpUrl}/articles/24300813697933-Why-did-my-limit-order-fail-or-not-execute`,
    limitsInfo: `${helpUrl}/sections/24372644881293`,
    limitsNetworkSupport: `${helpUrl}/articles/24470251716237-What-networks-do-limits-support`,
    fiatOnRampHelp: `${helpUrl}/articles/11306574799117`,
    transferCryptoHelp: `${helpUrl}/articles/27103878635661-How-to-transfer-crypto-from-a-Robinhood-or-Coinbase-account-to-the-Uniswap-Wallet`,
    moonpayRegionalAvailability: `${helpUrl}/articles/11306664890381-Why-isn-t-MoonPay-available-in-my-region-`,
    networkFeeInfo: `${helpUrl}/articles/8370337377805-What-is-a-network-fee-`,
    recoveryPhraseHowToImport: `${helpUrl}/articles/11380692567949-How-to-import-a-recovery-phrase-into-the-Uniswap-Wallet`,
    recoveryPhraseHowToFind: `${helpUrl}/articles/11306360177677-How-to-find-my-recovery-phrase-in-the-Uniswap-Wallet`,
    recoveryPhraseForgotten: `${helpUrl}/articles/11306367118349`,
    supportedNetworks: `${helpUrl}/articles/14569415293325`,
    swapFeeInfo: `${helpUrl}/articles/20131678274957`,
    swapProtection: `${helpUrl}/articles/18814993155853`,
    swapSlippage: `${helpUrl}/articles/8643879653261-What-is-Price-Slippage-`,
    tokenWarning: `${helpUrl}/articles/8723118437133-What-are-token-warnings-`,
    transactionFailure: `${helpUrl}/articles/8643975058829-Why-did-my-transaction-fail-`,
    uniswapXInfo: `${helpUrl}/articles/17515415311501`,
    uniswapXFailure: `${helpUrl}/articles/17515489874189-Why-can-my-swap-not-be-filled-`,
    unitagClaimPeriod: `${helpUrl}/articles/24009960408589`,
    unsupportedTokenPolicy: `${helpUrl}/articles/18783694078989-Unsupported-Token-Policy`,
    walletHelp: `${helpUrl}/categories/11301970439565-Uniswap-Wallet`,
    wethExplainer: `${helpUrl}/articles/16015852009997-Why-do-ETH-swaps-involve-converting-to-WETH`,
  },
  termsOfServiceUrl: 'https://uniswap.org/terms-of-service',
  privacyPolicyUrl: 'https://uniswap.org/privacy-policy',
  // TODO(EXT-668): Remove this after beta launch
  extensionFeedbackFormUrl: 'https://forms.gle/Znf6nDRa9PMp4BAJ7',
  chromeExtension: 'http://uniswap.org/ext',

  // Core API Urls
  apiOrigin: 'https://api.uniswap.org',
  apiBaseUrl: getCloudflareApiBaseUrl(),
  graphQLUrl: `${getCloudflareApiBaseUrl(TrafficFlows.GraphQL)}/v1/graphql`,

  // Proxies
  amplitudeProxyUrl: `${getCloudflareApiBaseUrl(TrafficFlows.Metrics)}/v1/amplitude-proxy`,
  statsigProxyUrl: `${getCloudflareApiBaseUrl(TrafficFlows.Gating)}/v1/statsig-proxy`,

  // Feature service URL's
  unitagsApiUrl: `${getCloudflareApiBaseUrl(TrafficFlows.Unitags)}/v2/unitags`,
  scantasticApiUrl: `${getCloudflareApiBaseUrl(TrafficFlows.Scantastic)}/v2/scantastic`,
  fiatOnRampApiUrl: `${getCloudflareApiBaseUrl(TrafficFlows.FOR)}/v2/fiat-on-ramp`,
  tradingApiUrl: getCloudflareApiBaseUrl(TrafficFlows.TradingApi),

  // API Paths
  trmPath: '/v1/screen',
  gasServicePath: '/v1/gas-fee',
  tradingApiPaths: {
    quote: '/v1/quote',
    approval: '/v1/check_approval',
    swap: '/v1/swap',
    order: '/v1/order',
    orders: '/v1/orders',
  },

  // App and Redirect URL's
  appBaseUrl: UNISWAP_APP_URL,
  redirectUrlBase: isAndroid ? UNISWAP_WEB_URL : UNISWAP_APP_URL,
  requestOriginUrl: UNISWAP_WEB_URL,

  // Web Interface Urls
  webInterfaceSwapUrl: `${UNISWAP_WEB_URL}/#/swap`,
  webInterfaceTokensUrl: `${UNISWAP_WEB_URL}/explore/tokens`,
  webInterfaceAddressUrl: `${UNISWAP_WEB_URL}/address`,
  webInterfaceNftItemUrl: `${UNISWAP_WEB_URL}/nfts/asset`,
  webInterfaceNftCollectionUrl: `${UNISWAP_WEB_URL}/nfts/collection`,
  webInterfaceBuyUrl: `${UNISWAP_WEB_URL}/buy`,
}

function getCloudflarePrefix(flow?: TrafficFlows): string {
  if (flow && isDevEnv() && FLOWS_USING_BETA.includes(flow)) {
    return `beta`
  }

  if (isMobileApp) {
    return `${isAndroid ? 'android' : 'ios'}.wallet`
  }

  if (isExtension) {
    return 'extension'
  }

  if (isInterface) {
    return 'interface'
  }

  if (isTestEnv()) {
    return 'wallet'
  }

  throw new Error('Could not determine app to generate Cloudflare prefix')
}

function getServicePrefix(flow?: TrafficFlows): string {
  if (flow && !(isDevEnv() && FLOWS_USING_BETA.includes(flow))) {
    return flow + '.'
  } else {
    return ''
  }
}

function getCloudflareApiBaseUrl(flow?: TrafficFlows): string {
  return `https://${getServicePrefix(flow)}${getCloudflarePrefix(flow)}.gateway.uniswap.org`
}
