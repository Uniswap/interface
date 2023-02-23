import {
  ACTIVE_CHAINS,
  ALCHEMY_API_KEY,
  AMPLITUDE_API_URL,
  AMPLITUDE_EXPERIMENTS_DEPLOYMENT_KEY,
  DEBUG,
  DEMO_SEED_PHRASE,
  INFURA_PROJECT_ID,
  MOONPAY_API_KEY,
  MOONPAY_API_URL,
  MOONPAY_WIDGET_API_URL,
  ONESIGNAL_APP_ID,
  SENTRY_DSN,
  STATSIG_API_KEY,
  STATSIG_PROXY_URL,
  UNISWAP_API_BASE_URL,
  UNISWAP_API_KEY,
  UNISWAP_APP_URL,
  VERSION,
  WALLETCONNECT_PROJECT_ID,
} from 'react-native-dotenv'
import { ChainIdTo } from 'src/constants/chains'
import { ChainState } from 'src/features/chains/types'
import { chainListToStateMap } from 'src/features/chains/utils'
import { parseActiveChains } from 'src/utils/chainId'

export interface Config {
  activeChains: ChainIdTo<ChainState>
  alchemyApiKey: string
  amplitudeExperimentsDeploymentKey: string
  amplitudeApiUrl: string
  debug: boolean
  demoSeedPhrase: string
  moonpayApiKey: string
  moonpayApiUrl: string
  moonpayWidgetApiUrl: string
  uniswapApiBaseUrl: string
  uniswapApiKey: string
  uniswapAppUrl: string
  infuraProjectId: string
  onesignalAppId: string
  sentryDsn: string
  statSigApiKey: string
  statSigProxyUrl: string
  version: string
  walletConnectProjectId: string
}

const _config: Config = {
  activeChains: chainListToStateMap(parseActiveChains(ACTIVE_CHAINS)),
  amplitudeApiUrl: AMPLITUDE_API_URL,
  amplitudeExperimentsDeploymentKey:
    process.env.AMPLITUDE_EXPERIMENTS_DEPLOYMENT_KEY || AMPLITUDE_EXPERIMENTS_DEPLOYMENT_KEY,
  alchemyApiKey: process.env.ALCHEMY_API_KEY || ALCHEMY_API_KEY,
  debug: parseBoolean(DEBUG),
  demoSeedPhrase: process.env.DEMO_SEED_PHRASE || DEMO_SEED_PHRASE,
  moonpayApiKey: process.env.MOONPAY_API_KEY || MOONPAY_API_KEY,
  moonpayApiUrl: process.env.MOONPAY_API_URL || MOONPAY_API_URL,
  moonpayWidgetApiUrl: process.env.MOONPAY_WIDGET_API_URL || MOONPAY_WIDGET_API_URL,
  uniswapApiBaseUrl: process.env.UNISWAP_API_BASE_URL || UNISWAP_API_BASE_URL,
  uniswapApiKey: process.env.UNISWAP_API_KEY || UNISWAP_API_KEY,
  uniswapAppUrl: UNISWAP_APP_URL,
  infuraProjectId: process.env.INFURA_PROJECT_ID || INFURA_PROJECT_ID,
  onesignalAppId: process.env.ONESIGNAL_APP_ID || ONESIGNAL_APP_ID,
  sentryDsn: process.env.SENTRY_DSN || SENTRY_DSN,
  statSigApiKey: process.env.STATSIG_API_KEY || STATSIG_API_KEY,
  statSigProxyUrl: process.env.STATSIG_PROXY_URL || STATSIG_PROXY_URL,
  version: VERSION,
  walletConnectProjectId: process.env.WALLETCONNECT_PROJECT_ID || WALLETCONNECT_PROJECT_ID,
}

function parseBoolean(value: string): boolean {
  return value?.toLowerCase() === 'true'
}

export const config = Object.freeze(_config)

if (config.debug) {
  // Cannot use logger here, causes error from circular dep
  // eslint-disable-next-line no-console
  console.debug('Using app config:', config)
}
