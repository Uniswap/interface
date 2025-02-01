// eslint-disable-next-line no-restricted-imports
import {
  AMPLITUDE_PROXY_URL_OVERRIDE,
  API_BASE_URL_OVERRIDE,
  API_BASE_URL_V2_OVERRIDE,
  APPSFLYER_API_KEY,
  APPSFLYER_APP_ID,
  DATADOG_CLIENT_TOKEN,
  DATADOG_PROJECT_ID,
  FIREBASE_APP_CHECK_DEBUG_TOKEN,
  FOR_API_URL_OVERRIDE,
  GRAPHQL_URL_OVERRIDE,
  INFURA_KEY,
  ONESIGNAL_APP_ID,
  OPENAI_API_KEY,
  QUICKNODE_ENDPOINT_NAME,
  QUICKNODE_ENDPOINT_TOKEN,
  QUICKNODE_MONAD_TESTNET_RPC_URL,
  SCANTASTIC_API_URL_OVERRIDE,
  SENTRY_DSN,
  SIMPLEHASH_API_KEY,
  SIMPLEHASH_API_URL,
  STATSIG_PROXY_URL_OVERRIDE,
  TRADING_API_KEY,
  TRADING_API_URL_OVERRIDE,
  UNISWAP_API_KEY,
  UNITAGS_API_URL_OVERRIDE,
  WALLETCONNECT_PROJECT_ID,
} from 'react-native-dotenv'
import { isNonJestDev } from 'utilities/src/environment/constants'

/**
 * Naming requirements for different environments:
 * - Web ENV vars: must have process.env.REACT_APP_<var_name>
 * - Extension ENV vars: must have process.env.<var_name>
 * - Mobile ENV vars: must have BOTH process.env.<var_name> and <var_name>
 *
 *  The CI requires web vars to have the required 'REACT_APP_' prefix. The react-dot-env library doesnt integrate with CI correctly,
 *  so we pull from github secrets directly with process.env.<var_name> for both extension and mobile. <var_name> is used for local mobile builds.
 */

export interface Config {
  amplitudeProxyUrlOverride: string
  apiBaseUrlOverride: string
  apiBaseUrlV2Override: string
  appsflyerApiKey: string
  appsflyerAppId: string
  datadogClientToken: string
  datadogProjectId: string
  firebaseAppCheckDebugToken: string
  forApiUrlOverride: string
  graphqlUrlOverride: string
  infuraKey: string
  onesignalAppId: string
  openaiApiKey: string
  quicknodeEndpointName: string
  quicknodeEndpointToken: string
  quicknodeMonadTestnetRpcUrl: string
  scantasticApiUrlOverride: string
  sentryDsn: string
  simpleHashApiKey: string
  simpleHashApiUrl: string
  statsigProxyUrlOverride: string
  tradingApiKey: string
  tradingApiUrlOverride: string
  uniswapApiKey: string
  unitagsApiUrlOverride: string
  walletConnectProjectId: string
}

/**
 * Naming requirements for different environments:
 * - Web ENV vars: must have process.env.REACT_APP_<var_name>
 * - Extension ENV vars: must have process.env.<var_name>
 * - Mobile ENV vars: must have BOTH process.env.<var_name> and <var_name>
 *
 *  The CI requires web vars to have the required 'REACT_APP_' prefix. The react-dot-env library doesnt integrate with CI correctly,
 *  so we pull from github secrets directly with process.env.<var_name> for both extension and mobile. <var_name> is used for local mobile builds.
 */

const _config: Config = {
  amplitudeProxyUrlOverride: process.env.AMPLITUDE_PROXY_URL_OVERRIDE || AMPLITUDE_PROXY_URL_OVERRIDE,
  apiBaseUrlOverride: process.env.API_BASE_URL_OVERRIDE || API_BASE_URL_OVERRIDE,
  apiBaseUrlV2Override: process.env.API_BASE_URL_V2_OVERRIDE || API_BASE_URL_V2_OVERRIDE,
  appsflyerApiKey: process.env.APPSFLYER_API_KEY || APPSFLYER_API_KEY,
  appsflyerAppId: process.env.APPSFLYER_APP_ID || APPSFLYER_APP_ID,
  datadogClientToken: process.env.DATADOG_CLIENT_TOKEN || DATADOG_CLIENT_TOKEN,
  datadogProjectId: process.env.DATADOG_PROJECT_ID || DATADOG_PROJECT_ID,
  firebaseAppCheckDebugToken: process.env.FIREBASE_APP_CHECK_DEBUG_TOKEN || FIREBASE_APP_CHECK_DEBUG_TOKEN,
  forApiUrlOverride: process.env.FOR_API_URL_OVERRIDE || FOR_API_URL_OVERRIDE,
  graphqlUrlOverride: process.env.GRAPHQL_URL_OVERRIDE || GRAPHQL_URL_OVERRIDE,
  infuraKey: process.env.REACT_APP_INFURA_KEY || INFURA_KEY,
  onesignalAppId: process.env.ONESIGNAL_APP_ID || ONESIGNAL_APP_ID,
  openaiApiKey: process.env.OPENAI_API_KEY || OPENAI_API_KEY,
  quicknodeEndpointName:
    process.env.REACT_APP_QUICKNODE_ENDPOINT_NAME || process.env.QUICKNODE_ENDPOINT_NAME || QUICKNODE_ENDPOINT_NAME,
  quicknodeEndpointToken:
    process.env.REACT_APP_QUICKNODE_ENDPOINT_TOKEN || process.env.QUICKNODE_ENDPOINT_TOKEN || QUICKNODE_ENDPOINT_TOKEN,
  quicknodeMonadTestnetRpcUrl:
    process.env.REACT_APP_QUICKNODE_MONAD_TESTNET_RPC_URL ||
    process.env.QUICKNODE_MONAD_TESTNET_RPC_URL ||
    QUICKNODE_MONAD_TESTNET_RPC_URL,
  scantasticApiUrlOverride: process.env.SCANTASTIC_API_URL_OVERRIDE || SCANTASTIC_API_URL_OVERRIDE,
  sentryDsn: process.env.REACT_APP_SENTRY_DSN || process.env.SENTRY_DSN || SENTRY_DSN,
  simpleHashApiKey: process.env.SIMPLEHASH_API_KEY || SIMPLEHASH_API_KEY,
  simpleHashApiUrl: process.env.SIMPLEHASH_API_URL || SIMPLEHASH_API_URL,
  statsigProxyUrlOverride: process.env.STATSIG_PROXY_URL_OVERRIDE || STATSIG_PROXY_URL_OVERRIDE,
  tradingApiKey: process.env.REACT_APP_TRADING_API_KEY || process.env.TRADING_API_KEY || TRADING_API_KEY,
  tradingApiUrlOverride: process.env.TRADING_API_URL_OVERRIDE || TRADING_API_URL_OVERRIDE,
  uniswapApiKey: process.env.UNISWAP_API_KEY || UNISWAP_API_KEY,
  unitagsApiUrlOverride: process.env.UNITAGS_API_URL_OVERRIDE || UNITAGS_API_URL_OVERRIDE,
  walletConnectProjectId:
    process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID || process.env.WALLETCONNECT_PROJECT_ID || WALLETCONNECT_PROJECT_ID,
}

export const config = Object.freeze(_config)

if (isNonJestDev) {
  // Cannot use logger here, causes error from circular dep
  // eslint-disable-next-line no-console
  console.debug('Using app config:', config)
}
