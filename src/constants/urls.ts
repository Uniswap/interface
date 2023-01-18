import { config } from 'src/config'

export const uniswapUrls = {
  helpUrl: 'https://support.uniswap.org',
  apiBaseUrl: getUniswapApiBaseUrl(),
  appBaseUrl: 'https://uniswap.org/app',
  gasServiceUrl: getUniswapGasServiceUrl(),
  routingApiUrl: getUniswapRoutingApiUrl(),
  graphQLUrl: getUniswapGraphQLUrl(),
  trmUrl: getUniswapTrmUrl(),
  amplitudeProxyUrl: getUniswapAmplitudeProxyUrl(),
  termsOfServiceUrl: 'https://uniswap.org/terms-of-service',
  privacyPolicyUrl: 'https://uniswap.org/privacy-policy',
  nftUrl: 'https://app.uniswap.org/#/nfts',
}

function getUniswapApiBaseUrl(): string {
  return config.uniswapApiBaseUrl
}

function getUniswapRoutingApiUrl(): string {
  return `${config.uniswapApiBaseUrl}/v1`
}

function getUniswapGasServiceUrl(): string {
  return `${config.uniswapApiBaseUrl}/v1/gas-fee`
}

function getUniswapGraphQLUrl(): string {
  return `${config.uniswapApiBaseUrl}/v1/graphql`
}

function getUniswapTrmUrl(): string {
  return `${config.uniswapApiBaseUrl}/v1/screen`
}

function getUniswapAmplitudeProxyUrl(): string {
  return `${config.uniswapApiBaseUrl}/v1/amplitude-proxy`
}

export const TOKEN_WARNING_HELP_PAGE_URL =
  'https://support.uniswap.org/hc/en-us/articles/8723118437133-What-are-token-warnings-'

export const APP_STORE_LINK = 'https://apps.apple.com/us/app/uniswap-wallet-defi-nfts/id6443944476'
