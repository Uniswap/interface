import {
  ACTIVE_CHAINS,
  INFURA_PROJECT_ID,
  MOONPAY_API_KEY,
  MOONPAY_API_URL,
  MOONPAY_WIDGET_API_URL,
  ONESIGNAL_APP_ID,
  SENTRY_DSN,
  STATSIG_PROXY_URL,
  UNISWAP_API_BASE_URL,
  UNISWAP_API_KEY,
  UNISWAP_APP_URL,
  WALLETCONNECT_PROJECT_ID,
} from 'react-native-dotenv'
import { ChainIdTo, ChainState } from 'wallet/src/constants/chains'
import { chainListToStateMap } from 'wallet/src/features/chains/chainIdUtils'
import { parseActiveChains } from 'wallet/src/utils/chainId'

export interface Config {
  activeChains: ChainIdTo<ChainState>
  moonpayApiKey: string
  moonpayApiUrl: string
  moonpayWidgetApiUrl: string
  uniswapApiBaseUrl: string
  uniswapApiKey: string
  uniswapAppUrl: string
  infuraProjectId: string
  onesignalAppId: string
  sentryDsn: string
  statSigProxyUrl: string
  walletConnectProjectId: string
}

const _config: Config = {
  activeChains: chainListToStateMap(parseActiveChains(ACTIVE_CHAINS)),
  moonpayApiKey: process.env.MOONPAY_API_KEY || MOONPAY_API_KEY,
  moonpayApiUrl: process.env.MOONPAY_API_URL || MOONPAY_API_URL,
  moonpayWidgetApiUrl:
    process.env.MOONPAY_WIDGET_API_URL || MOONPAY_WIDGET_API_URL,
  uniswapApiBaseUrl: process.env.UNISWAP_API_BASE_URL || UNISWAP_API_BASE_URL,
  uniswapApiKey: process.env.UNISWAP_API_KEY || UNISWAP_API_KEY,
  uniswapAppUrl: UNISWAP_APP_URL,
  infuraProjectId: process.env.INFURA_PROJECT_ID || INFURA_PROJECT_ID,
  onesignalAppId: process.env.ONESIGNAL_APP_ID || ONESIGNAL_APP_ID,
  sentryDsn: process.env.SENTRY_DSN || SENTRY_DSN,
  statSigProxyUrl: process.env.STATSIG_PROXY_URL || STATSIG_PROXY_URL,
  walletConnectProjectId:
    process.env.WALLETCONNECT_PROJECT_ID || WALLETCONNECT_PROJECT_ID,
}

export const config = Object.freeze(_config)

if (__DEV__) {
  // Cannot use logger here, causes error from circular dep
  // eslint-disable-next-line no-console
  console.debug('Using app config:', config)
}
