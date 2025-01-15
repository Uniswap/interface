// eslint-disable-next-line no-restricted-imports
import {
  AMPLITUDE_PROXY_URL_OVERRIDE,
  API_BASE_URL_OVERRIDE,
  API_BASE_URL_V2_OVERRIDE,
  APPSFLYER_API_KEY,
  APPSFLYER_APP_ID,
  DATADOG_CLIENT_TOKEN,
  DATADOG_PROJECT_ID,
  FIAT_ON_RAMP_API_URL_OVERRIDE,
  FIREBASE_APP_CHECK_DEBUG_TOKEN,
  FOR_API_URL_OVERRIDE,
  GRAPHQL_URL_OVERRIDE,
  INFURA_KEY,
  ONESIGNAL_APP_ID,
  OPENAI_API_KEY,
  QUICKNODE_ARBITRUM_RPC_URL,
  QUICKNODE_ASTROCHAIN_SEPOLIA_RPC_URL,
  QUICKNODE_AVAX_RPC_URL,
  QUICKNODE_BASE_RPC_URL,
  QUICKNODE_BLAST_RPC_URL,
  QUICKNODE_BNB_RPC_URL,
  QUICKNODE_CELO_RPC_URL,
  QUICKNODE_MAINNET_RPC_URL,
  QUICKNODE_MONAD_TESTNET_RPC_URL,
  QUICKNODE_OP_RPC_URL,
  QUICKNODE_POLYGON_RPC_URL,
  QUICKNODE_SEPOLIA_RPC_URL,
  QUICKNODE_WORLDCHAIN_RPC_URL,
  QUICKNODE_ZKSYNC_RPC_URL,
  QUICKNODE_ZORA_RPC_URL,
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
  fiatOnRampApiUrlOverride: string
  firebaseAppCheckDebugToken: string
  forApiUrlOverride: string
  graphqlUrlOverride: string
  infuraKey: string
  onesignalAppId: string
  openaiApiKey: string
  quicknodeArbitrumRpcUrl: string
  quicknodeAvaxRpcUrl: string
  quicknodeBaseRpcUrl: string
  quicknodeBlastRpcUrl: string
  quicknodeBnbRpcUrl: string
  quicknodeCeloRpcUrl: string
  quicknodeMainnetRpcUrl: string
  quicknodeMonadTestnetRpcUrl: string
  quicknodeOpRpcUrl: string
  quicknodePolygonRpcUrl: string
  quicknodeSepoliaRpcUrl: string
  quicknodeUnichainSepoliaRpcUrl: string
  quicknodeWorldChainRpcUrl: string
  quicknodeZkSyncRpcUrl: string
  quicknodeZoraRpcUrl: string
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
  fiatOnRampApiUrlOverride: process.env.FIAT_ON_RAMP_API_URL_OVERRIDE || FIAT_ON_RAMP_API_URL_OVERRIDE,
  firebaseAppCheckDebugToken: process.env.FIREBASE_APP_CHECK_DEBUG_TOKEN || FIREBASE_APP_CHECK_DEBUG_TOKEN,
  forApiUrlOverride: process.env.FOR_API_URL_OVERRIDE || FOR_API_URL_OVERRIDE,
  graphqlUrlOverride: process.env.GRAPHQL_URL_OVERRIDE || GRAPHQL_URL_OVERRIDE,
  infuraKey: process.env.REACT_APP_INFURA_KEY || INFURA_KEY,
  onesignalAppId: process.env.ONESIGNAL_APP_ID || ONESIGNAL_APP_ID,
  openaiApiKey: process.env.OPENAI_API_KEY || OPENAI_API_KEY,
  quicknodeArbitrumRpcUrl:
    process.env.REACT_APP_QUICKNODE_ARBITRUM_RPC_URL ||
    process.env.QUICKNODE_ARBITRUM_RPC_URL ||
    QUICKNODE_ARBITRUM_RPC_URL,
  quicknodeAvaxRpcUrl:
    process.env.REACT_APP_QUICKNODE_AVAX_RPC_URL || process.env.QUICKNODE_AVAX_RPC_URL || QUICKNODE_AVAX_RPC_URL,
  quicknodeBaseRpcUrl:
    process.env.REACT_APP_QUICKNODE_BASE_RPC_URL || process.env.QUICKNODE_BASE_RPC_URL || QUICKNODE_BASE_RPC_URL,
  quicknodeBlastRpcUrl:
    process.env.REACT_APP_QUICKNODE_BLAST_RPC_URL || process.env.QUICKNODE_BLAST_RPC_URL || QUICKNODE_BLAST_RPC_URL,
  quicknodeBnbRpcUrl:
    process.env.REACT_APP_QUICKNODE_BNB_RPC_URL || process.env.QUICKNODE_BNB_RPC_URL || QUICKNODE_BNB_RPC_URL,
  quicknodeCeloRpcUrl:
    process.env.REACT_APP_QUICKNODE_CELO_RPC_URL || process.env.QUICKNODE_CELO_RPC_URL || QUICKNODE_CELO_RPC_URL,
  quicknodeMainnetRpcUrl:
    process.env.REACT_APP_QUICKNODE_MAINNET_RPC_URL ||
    process.env.QUICKNODE_MAINNET_RPC_URL ||
    QUICKNODE_MAINNET_RPC_URL,
  quicknodeMonadTestnetRpcUrl:
    process.env.REACT_APP_QUICKNODE_MONAD_TESTNET_RPC_URL ||
    process.env.QUICKNODE_MONAD_TESTNET_RPC_URL ||
    QUICKNODE_MONAD_TESTNET_RPC_URL,
  quicknodeOpRpcUrl:
    process.env.REACT_APP_QUICKNODE_OP_RPC_URL || process.env.QUICKNODE_OP_RPC_URL || QUICKNODE_OP_RPC_URL,
  quicknodePolygonRpcUrl:
    process.env.REACT_APP_QUICKNODE_POLYGON_RPC_URL ||
    process.env.QUICKNODE_POLYGON_RPC_URL ||
    QUICKNODE_POLYGON_RPC_URL,
  quicknodeSepoliaRpcUrl:
    process.env.REACT_APP_QUICKNODE_SEPOLIA_RPC_URL ||
    process.env.QUICKNODE_SEPOLIA_RPC_URL ||
    QUICKNODE_SEPOLIA_RPC_URL,
  quicknodeUnichainSepoliaRpcUrl:
    process.env.REACT_APP_QUICKNODE_ASTROCHAIN_SEPOLIA_RPC_URL ||
    process.env.QUICKNODE_ASTROCHAIN_SEPOLIA_RPC_URL ||
    QUICKNODE_ASTROCHAIN_SEPOLIA_RPC_URL,
  quicknodeWorldChainRpcUrl:
    process.env.REACT_APP_QUICKNODE_WORLDCHAIN_RPC_URL ||
    process.env.QUICKNODE_WORLDCHAIN_RPC_URL ||
    QUICKNODE_WORLDCHAIN_RPC_URL,
  quicknodeZkSyncRpcUrl:
    process.env.REACT_APP_QUICKNODE_ZKSYNC_RPC_URL || process.env.QUICKNODE_ZKSYNC_RPC_URL || QUICKNODE_ZKSYNC_RPC_URL,
  quicknodeZoraRpcUrl:
    process.env.REACT_APP_QUICKNODE_ZORA_RPC_URL || process.env.QUICKNODE_ZORA_RPC_URL || QUICKNODE_ZORA_RPC_URL,
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
