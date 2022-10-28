import { config } from 'src/config'

export const uniswapUrls = {
  helpUrl: 'https://support.uniswap.org',
  apiBaseUrl: getUniswapApiBaseUrl(),
  gasServiceUrl: getUniswapGasServiceUrl(),
  routingApiUrl: getUniswapRoutingApiUrl(),
  graphQLUrl: getUniswapGraphQLUrl(),
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

export const TOKEN_WARNING_HELP_PAGE_URL =
  'https://support.uniswap.org/hc/en-us/articles/8723118437133-What-are-token-warnings-'
