import { config } from 'uniswap/src/config'
import { isAndroid } from 'uniswap/src/utils/platform'

export const UNISWAP_APP_HOSTNAME = 'app.uniswap.org'

const TRADING_API_BASE_PATH = '/v1'

const helpUrl = 'https://support.uniswap.org'

export const uniswapUrls = {
  helpUrl,
  helpRequestUrl: `${helpUrl}/hc/en-us/requests/new`,
  helpArticleUrls: {
    feeOnTransferHelp: `${helpUrl}/hc/en-us/articles/18673568523789-What-is-a-token-fee-`,
    moonpayHelp: `${helpUrl}/hc/en-us/articles/11306574799117-How-to-use-Moon-Pay-on-the-Uniswap-web-app-`,
    networkFeeInfo: `${helpUrl}/hc/en-us/articles/8370337377805-What-is-a-network-fee-`,
    swapFeeInfo: `${helpUrl}/hc/en-us/articles/20131678274957`,
    recoveryPhraseHelp: `${helpUrl}/hc/en-us/articles/11380692567949-How-to-import-my-recovery-phrase-`,
    swapSlippage: `${helpUrl}/hc/en-us/articles/8643879653261-What-is-Price-Slippage-`,
    swapProtection: `${helpUrl}/hc/en-us/articles/18814993155853`,
    supportedNetworks: `${helpUrl}/hc/en-us/articles/14569415293325`,
    tokenWarning: `${helpUrl}/hc/en-us/articles/8723118437133-What-are-token-warnings-`,
    unitagClaimPeriod: `${helpUrl}/hc/en-us/articles/24009960408589`,
    walletHelp: `${helpUrl}/hc/en-us/categories/11301970439565-Uniswap-Wallet`,
  },
  apiBaseUrl: getUniswapApiBaseUrl(),
  apiBaseExtensionUrl: getExtensionApiBaseUrl(),
  apiBaseUrlCloudflare: getCloudflareApiBaseUrl(),
  appBaseUrl: 'https://uniswap.org/app',
  gasServicePath: getUniswapGasServicePath(),
  routingApiUrl: getUniswapRoutingApiUrl(),
  graphQLUrl: getUniswapGraphQLUrl(),
  trmPath: getUniswapTrmPath(),
  amplitudeProxyUrl: getUniswapAmplitudeProxyUrl(),
  statsigProxyUrl: getUniswapStatsigProxyUrl(),
  termsOfServiceUrl: 'https://uniswap.org/terms-of-service',
  privacyPolicyUrl: 'https://uniswap.org/privacy-policy',
  appUrl: `https://${UNISWAP_APP_HOSTNAME}`,
  interfaceUrl: `https://${UNISWAP_APP_HOSTNAME}/#/swap`,
  extensionFeedbackFormUrl: 'https://forms.gle/RGFhKnABUjdPiYQH6', // TODO(EXT-668): Remove this after F&F launch
  interfaceTokensUrl: `https://${UNISWAP_APP_HOSTNAME}/explore/tokens`,
  interfaceNftItemUrl: `https://${UNISWAP_APP_HOSTNAME}/nfts/asset`,
  unitagsApiUrl: getUnitagsApiUrl(),
  tradingApiPaths: {
    quote: getTradingApiQuotePath(),
    approval: getTradingApiApprovalPath(),
    swap: getTradingApiSwapPath(),
  },
}

function getCloudflareApiBaseUrl(): string {
  return `https://${isAndroid ? 'android' : 'ios'}.wallet.gateway.uniswap.org`
}

function getUniswapApiBaseUrl(): string {
  return config.uniswapApiBaseUrl
}

function getExtensionApiBaseUrl(): string {
  return 'https://gateway.uniswap.org/v2'
}

function getUniswapRoutingApiUrl(): string {
  return `${config.uniswapApiBaseUrl}/v1`
}

function getUniswapGasServicePath(): string {
  return '/v1/gas-fee'
}

function getUniswapGraphQLUrl(): string {
  return `${config.uniswapApiBaseUrl}/v1/graphql`
}

function getUniswapTrmPath(): string {
  return '/v1/screen'
}

function getUniswapAmplitudeProxyUrl(): string {
  return `${config.uniswapApiBaseUrl}/v1/amplitude-proxy`
}

function getUniswapStatsigProxyUrl(): string {
  return `${config.uniswapApiBaseUrl}/v1/statsig-proxy`
}

function getUnitagsApiUrl(): string {
  return config.unitagsApiUrl
}

function getTradingApiQuotePath(): string {
  return `${TRADING_API_BASE_PATH}/quote`
}

function getTradingApiApprovalPath(): string {
  return `${TRADING_API_BASE_PATH}/check_approval`
}

function getTradingApiSwapPath(): string {
  return `${TRADING_API_BASE_PATH}/swap`
}
