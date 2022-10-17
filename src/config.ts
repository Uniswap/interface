import {
  ACTIVE_CHAINS,
  AMPLITUDE_API_KEY,
  AMPLITUDE_API_URL,
  AMPLITUDE_EXPERIMENTS_DEPLOYMENT_KEY,
  COINGECKO_API_URL,
  COVALENT_API_KEY,
  DEBUG,
  INFURA_PROJECT_ID,
  LOG_BUFFER_SIZE,
  ONESIGNAL_APP_ID,
  OPENSEA_API_KEY,
  SENTRY_DSN,
  SHAKE_CLIENT_ID,
  SHAKE_CLIENT_SECRET,
  UNISWAP_API_KEY,
  UNISWAP_API_URL,
  UNISWAP_APP_URL,
  UNISWAP_GAS_SERVICE_URL,
  VERSION,
} from 'react-native-dotenv'
import { ChainIdTo } from 'src/constants/chains'
import { ChainState } from 'src/features/chains/types'
import { chainListToStateMap } from 'src/features/chains/utils'
import { parseActiveChains } from 'src/utils/chainId'

export interface Config {
  activeChains: ChainIdTo<ChainState>
  amplitudeApiKey: string
  amplitudeExperimentsDeploymentKey: string
  amplitudeApiUrl: string
  coingeckoApiUrl: string
  covalentApiKey: string
  debug: boolean
  uniswapApiUrl: string
  uniswapApiKey: string
  uniswapGasServiceUrl: string
  uniswapAppUrl: string
  infuraProjectId: string
  logBufferSize: number
  onesignalAppId: string
  openseaApiKey: string
  sentryDsn: string
  shakeClientId: string
  shakeClientSecret: string
  version: string
}

const _config: Config = {
  activeChains: chainListToStateMap(parseActiveChains(ACTIVE_CHAINS)),
  amplitudeApiKey: process.env.AMPLITUDE_API_KEY || AMPLITUDE_API_KEY,
  amplitudeExperimentsDeploymentKey:
    process.env.AMPLITUDE_EXPERIMENTS_DEPLOYMENT_KEY || AMPLITUDE_EXPERIMENTS_DEPLOYMENT_KEY,
  amplitudeApiUrl: AMPLITUDE_API_URL,
  coingeckoApiUrl: COINGECKO_API_URL,
  covalentApiKey: process.env.COVALENT_API_KEY || COVALENT_API_KEY,
  debug: parseBoolean(DEBUG),
  uniswapApiUrl: process.env.UNISWAP_API_URL || UNISWAP_API_URL,
  uniswapApiKey: process.env.UNISWAP_API_KEY || UNISWAP_API_KEY,
  uniswapGasServiceUrl: UNISWAP_GAS_SERVICE_URL,
  uniswapAppUrl: UNISWAP_APP_URL,
  infuraProjectId: process.env.INFURA_PROJECT_ID || INFURA_PROJECT_ID,
  logBufferSize: parseInt(LOG_BUFFER_SIZE, 10),
  onesignalAppId: process.env.ONESIGNAL_APP_ID || ONESIGNAL_APP_ID,
  openseaApiKey: process.env.OPENSEA_API_KEY || OPENSEA_API_KEY,
  sentryDsn: process.env.SENTRY_DSN || SENTRY_DSN,
  shakeClientId: process.env.SHAKE_CLIENT_ID || SHAKE_CLIENT_ID,
  shakeClientSecret: process.env.SHAKE_CLIENT_SECRET || SHAKE_CLIENT_SECRET,
  version: VERSION,
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
