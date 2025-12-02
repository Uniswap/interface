import type { Config } from '@universe/config/src/config-types'
import { isNonTestDev } from 'utilities/src/environment/constants'

// eslint-disable-next-line complexity
export const getConfig = (): Config => {
  /**
   * Web-specific config implementation that uses process.env directly
   * instead of react-native-dotenv to avoid Node.js filesystem dependencies
   * in browser extension builds.
   */
  const config: Config = {
    alchemyApiKey: process.env.REACT_APP_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY || '',
    amplitudeProxyUrlOverride: process.env.AMPLITUDE_PROXY_URL_OVERRIDE || '',
    apiBaseUrlOverride: process.env.API_BASE_URL_OVERRIDE || '',
    apiBaseUrlV2Override: process.env.API_BASE_URL_V2_OVERRIDE || '',
    appsflyerApiKey: process.env.APPSFLYER_API_KEY || '',
    appsflyerAppId: process.env.APPSFLYER_APP_ID || '',
    datadogClientToken: process.env.REACT_APP_DATADOG_CLIENT_TOKEN || process.env.DATADOG_CLIENT_TOKEN || '',
    datadogProjectId: process.env.REACT_APP_DATADOG_PROJECT_ID || process.env.DATADOG_PROJECT_ID || '',
    isE2ETest: process.env.IS_E2E_TEST?.toLowerCase() === 'true',
    forApiUrlOverride: process.env.FOR_API_URL_OVERRIDE || '',
    graphqlUrlOverride: process.env.GRAPHQL_URL_OVERRIDE || '',
    infuraKey: process.env.REACT_APP_INFURA_KEY || '',
    includePrototypeFeatures: process.env.INCLUDE_PROTOTYPE_FEATURES || '',
    jupiterProxyUrl: process.env.REACT_APP_JUPITER_PROXY_URL || process.env.JUPITER_PROXY_URL || '',
    onesignalAppId: process.env.ONESIGNAL_APP_ID || '',
    quicknodeEndpointName: process.env.REACT_APP_QUICKNODE_ENDPOINT_NAME || process.env.QUICKNODE_ENDPOINT_NAME || '',
    quicknodeEndpointToken:
      process.env.REACT_APP_QUICKNODE_ENDPOINT_TOKEN || process.env.QUICKNODE_ENDPOINT_TOKEN || '',
    scantasticApiUrlOverride: process.env.SCANTASTIC_API_URL_OVERRIDE || '',
    statsigApiKey: process.env.REACT_APP_STATSIG_API_KEY || process.env.STATSIG_API_KEY || '',
    statsigProxyUrlOverride: process.env.STATSIG_PROXY_URL_OVERRIDE || '',
    tradingApiKey: process.env.REACT_APP_TRADING_API_KEY || process.env.TRADING_API_KEY || '',
    tradingApiUrlOverride: process.env.REACT_APP_TRADING_API_URL_OVERRIDE || process.env.TRADING_API_URL_OVERRIDE || '',
    tradingApiWebTestEnv: process.env.REACT_APP_TRADING_API_TEST_ENV || '',
    uniswapApiKey: process.env.UNISWAP_API_KEY || '',
    unitagsApiUrlOverride: process.env.UNITAGS_API_URL_OVERRIDE || '',
    walletConnectProjectId:
      process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID || process.env.WALLETCONNECT_PROJECT_ID || '',
    walletConnectProjectIdBeta: process.env.WALLETCONNECT_PROJECT_ID_BETA || '',
    walletConnectProjectIdDev: process.env.WALLETCONNECT_PROJECT_ID_DEV || '',
  }
  if (isNonTestDev) {
    // biome-ignore lint/suspicious/noConsole: Cannot use logger here, causes error from circular dep
    console.debug('Using app config:', config)
  }
  return Object.freeze(config)
}
