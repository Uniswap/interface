import { config } from 'src/config'

export const uniswapUrls = {
  helpUrl: 'https://support.uniswap.org',
  apiBaseUrl: getUniswapApiBaseUrl(),
  gasServiceUrl: getUniswapGasServiceUrl(),
  routingApiUrl: getUniswapRoutingApiUrl(),
  graphQLUrl: getUniswapGraphQLUrl(),
  trmUrl: getUniswapTrmUrl(),
  termsOfServiceUrl: 'https://uniswap.org/terms-of-service',
  // TODO(MOB-3579): update privacy policy URL
  privacyPolicyUrl: 'https://uniswap.org/terms-of-service',
}

function getUniswapApiBaseUrl() {
  return config.uniswapApiBaseUrl
}

function getUniswapRoutingApiUrl() {
  return `${config.uniswapApiBaseUrl}/v1`
}

function getUniswapGasServiceUrl() {
  return `${config.uniswapApiBaseUrl}/v1/gas-fee`
}

function getUniswapGraphQLUrl() {
  return `${config.uniswapApiBaseUrl}/v1/graphql`
}

function getUniswapTrmUrl() {
  return `${config.uniswapApiBaseUrl}/v1/screen`
}

export const TOKEN_WARNING_HELP_PAGE_URL =
  'https://support.uniswap.org/hc/en-us/articles/8723118437133-What-are-token-warnings-'

export const getTokenLogoURL = (address: string) =>
  `https://raw.githubusercontent.com/uniswap/assets/master/blockchains/ethereum/assets/${address}/logo.png`
