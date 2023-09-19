import { config } from 'wallet/src/config'

export const UNISWAP_APP_HOSTNAME = 'app.uniswap.org'

const helpUrl = 'https://support.uniswap.org'

export const uniswapUrls = {
  helpUrl,
  helpArticleUrls: {
    feeOnTransferHelp: `${helpUrl}/hc/en-us/articles/18673568523789-What-is-a-token-fee-`,
    moonpayHelp: `${helpUrl}/hc/en-us/articles/11306574799117-How-to-use-Moon-Pay-on-the-Uniswap-web-app-`,
    tokenWarning: `${helpUrl}/hc/en-us/articles/8723118437133-What-are-token-warnings-`,
    swapSlippage: `${helpUrl}/hc/en-us/articles/8643879653261-What-is-Price-Slippage-`,
    swapProtection: `${helpUrl}/hc/en-us/articles/18814993155853`,
    supportedNetworks: `${helpUrl}/hc/en-us/articles/14569415293325`,
  },
  apiBaseUrl: getUniswapApiBaseUrl(),
  appBaseUrl: 'https://uniswap.org/app',
  gasServicePath: getUniswapGasServicePath(),
  routingApiUrl: getUniswapRoutingApiUrl(),
  graphQLUrl: getUniswapGraphQLUrl(),
  trmPath: getUniswapTrmPath(),
  amplitudeProxyUrl: getUniswapAmplitudeProxyUrl(),
  termsOfServiceUrl: 'https://uniswap.org/terms-of-service',
  privacyPolicyUrl: 'https://uniswap.org/privacy-policy',
  appUrl: `https://${UNISWAP_APP_HOSTNAME}`,
  interfaceUrl: `https://${UNISWAP_APP_HOSTNAME}/#/swap`,
}

function getUniswapApiBaseUrl(): string {
  return config.uniswapApiBaseUrl
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
