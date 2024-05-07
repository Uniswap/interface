import { isDevEnv } from 'uniswap/src/utils/env'
import { isAndroid, isExtension, isInterface, isMobileApp } from 'uniswap/src/utils/platform'
import { isJestRun } from 'utilities/src/environment'

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

const helpUrl = 'https://support.uniswap.org'

export const uniswapUrls = {
  // Help and web articles/items
  helpUrl,
  helpRequestUrl: `${helpUrl}/hc/en-us/requests/new`,
  helpArticleUrls: {
    extensionWaitlist: `${helpUrl}/hc/en-us/articles/24458735271181-Get-started-with-the-Uniswap-Extension`,
    feeOnTransferHelp: `${helpUrl}/hc/en-us/articles/18673568523789-What-is-a-token-fee-`,
    moonpayHelp: `${helpUrl}/hc/en-us/articles/11306574799117-How-to-use-Moon-Pay-on-the-Uniswap-web-app-`,
    networkFeeInfo: `${helpUrl}/hc/en-us/articles/8370337377805-What-is-a-network-fee-`,
    recoveryPhraseHelp: `${helpUrl}/hc/en-us/articles/11380692567949-How-to-import-my-recovery-phrase-`,
    supportedNetworks: `${helpUrl}/hc/en-us/articles/14569415293325`,
    swapFeeInfo: `${helpUrl}/hc/en-us/articles/20131678274957`,
    swapProtection: `${helpUrl}/hc/en-us/articles/18814993155853`,
    swapSlippage: `${helpUrl}/hc/en-us/articles/8643879653261-What-is-Price-Slippage-`,
    tokenWarning: `${helpUrl}/hc/en-us/articles/8723118437133-What-are-token-warnings-`,
    unitagClaimPeriod: `${helpUrl}/hc/en-us/articles/24009960408589`,
    walletHelp: `${helpUrl}/hc/en-us/categories/11301970439565-Uniswap-Wallet`,
  },
  termsOfServiceUrl: 'https://uniswap.org/terms-of-service',
  privacyPolicyUrl: 'https://uniswap.org/privacy-policy',
  // TODO(EXT-668): Remove this after beta launch
  extensionFeedbackFormUrl:
    'https://docs.google.com/forms/d/e/1FAIpQLSeL1l34nsuTfymPn5LVpovY7W57oc0oj53GNnpt0QG1qRAzqw/viewform',

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

  if (isJestRun) {
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
