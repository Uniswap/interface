import {
  APPSFLYER_API_KEY,
  APPSFLYER_APP_ID,
  FIAT_ON_RAMP_API_URL,
  FIREBASE_APP_CHECK_DEBUG_TOKEN,
  INFURA_PROJECT_ID,
  MOONPAY_API_KEY,
  MOONPAY_API_URL,
  MOONPAY_WIDGET_API_URL,
  ONESIGNAL_APP_ID,
  QUICKNODE_BNB_RPC_URL,
  SENTRY_DSN,
  SIMPLEHASH_API_KEY,
  SIMPLEHASH_API_URL,
  STATSIG_PROXY_URL,
  TRADING_API_KEY,
  TRADING_API_URL,
  UNISWAP_API_BASE_URL,
  UNISWAP_API_KEY,
  UNISWAP_APP_URL,
  UNITAGS_API_URL,
  WALLETCONNECT_PROJECT_ID,
} from 'react-native-dotenv'
import { isNonJestDev } from 'utilities/src/environment'

export interface Config {
  appsflyerApiKey: string
  appsflyerAppId: string
  fiatOnRampApiUrl: string
  moonpayApiKey: string
  moonpayApiUrl: string
  moonpayWidgetApiUrl: string
  uniswapApiBaseUrl: string
  uniswapApiKey: string
  uniswapAppUrl: string
  infuraProjectId: string
  onesignalAppId: string
  sentryDsn: string
  simpleHashApiKey: string
  simpleHashApiUrl: string
  statSigProxyUrl: string
  walletConnectProjectId: string
  quicknodeBnbRpcUrl: string
  unitagsApiUrl: string
  tradingApiKey: string
  tradingApiUrl: string
  firebaseAppCheckDebugToken: string
}

const _config: Config = {
  appsflyerApiKey: process.env.APPSFLYER_API_KEY || APPSFLYER_API_KEY,
  appsflyerAppId: process.env.APPSFLYER_APP_ID || APPSFLYER_APP_ID,
  fiatOnRampApiUrl: process.env.FIAT_ON_RAMP_API_URL || FIAT_ON_RAMP_API_URL,
  moonpayApiKey:
    process.env.REACT_APP_MOONPAY_PUBLISHABLE_KEY || process.env.MOONPAY_API_KEY || MOONPAY_API_KEY,
  moonpayApiUrl:
    process.env.REACT_APP_MOONPAY_API || process.env.MOONPAY_API_URL || MOONPAY_API_URL,
  moonpayWidgetApiUrl: process.env.MOONPAY_WIDGET_API_URL || MOONPAY_WIDGET_API_URL,
  uniswapApiBaseUrl:
    process.env.REACT_APP_UNISWAP_BASE_URL ||
    process.env.UNISWAP_API_BASE_URL ||
    UNISWAP_API_BASE_URL,
  uniswapApiKey: process.env.UNISWAP_API_KEY || UNISWAP_API_KEY,
  uniswapAppUrl: process.env.UNISWAP_APP_URL || UNISWAP_APP_URL,
  infuraProjectId: process.env.INFURA_PROJECT_ID || INFURA_PROJECT_ID,
  onesignalAppId: process.env.ONESIGNAL_APP_ID || ONESIGNAL_APP_ID,
  sentryDsn: process.env.REACT_APP_SENTRY_DSN || process.env.SENTRY_DSN || SENTRY_DSN,
  simpleHashApiKey: process.env.SIMPLEHASH_API_KEY || SIMPLEHASH_API_KEY,
  simpleHashApiUrl: process.env.SIMPLEHASH_API_URL || SIMPLEHASH_API_URL,
  statSigProxyUrl:
    process.env.REACT_APP_STATSIG_PROXY_URL || process.env.STATSIG_PROXY_URL || STATSIG_PROXY_URL,
  walletConnectProjectId:
    process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID ||
    process.env.WALLETCONNECT_PROJECT_ID ||
    WALLETCONNECT_PROJECT_ID,
  quicknodeBnbRpcUrl: process.env.QUICKNODE_BNB_RPC_URL || QUICKNODE_BNB_RPC_URL,
  unitagsApiUrl:
    process.env.REACT_APP_UNITAGS_API_URL || process.env.UNITAGS_API_URL || UNITAGS_API_URL,
  tradingApiKey: process.env.TRADING_API_KEY || TRADING_API_KEY,
  tradingApiUrl: process.env.TRADING_API_URL || TRADING_API_URL,
  firebaseAppCheckDebugToken:
    process.env.FIREBASE_APP_CHECK_DEBUG_TOKEN || FIREBASE_APP_CHECK_DEBUG_TOKEN,
}

export const config = Object.freeze(_config)

if (isNonJestDev) {
  // Cannot use logger here, causes error from circular dep
  // eslint-disable-next-line no-console
  console.debug('Using app config:', config)
}
