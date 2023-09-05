import { config } from 'wallet/src/config'

export const UNISWAP_APP_HOSTNAME = 'app.uniswap.org'

export const uniswapUrls = {
  helpUrl: 'https://support.uniswap.org',
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
  moonpayHelpUrl:
    'https://support.uniswap.org/hc/en-us/articles/11306574799117-How-to-use-Moon-Pay-on-the-Uniswap-web-app-',
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

export const TOKEN_WARNING_HELP_PAGE_URL = `${uniswapUrls.helpUrl}/hc/en-us/articles/8723118437133-What-are-token-warnings-`

export const SWAP_SLIPPAGE_HELP_PAGE_URL = `${uniswapUrls.helpUrl}/hc/en-us/articles/8643879653261-What-is-Price-Slippage-`

export const SWAP_PROTECTION_HELP_URL = `${uniswapUrls.helpUrl}/hc/en-us/articles/18814993155853`

export const SUPPORTED_NETWORKS_PAGE_URL = `${uniswapUrls.helpUrl}/hc/en-us/articles/14569415293325`
