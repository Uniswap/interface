import {
  ACTIVE_CHAINS,
  COINGECKO_API_URL,
  COVALENT_API_KEY,
  DEBUG,
  GRAPHQL_API_URL,
  INFURA_PROJECT_ID,
  LOG_BUFFER_SIZE,
  ONESIGNAL_APP_ID,
  OPENSEA_API_KEY,
  SENTRY_DSN,
  VERSION,
  ZERION_API_KEY,
} from 'react-native-dotenv'
import { ChainIdTo } from 'src/constants/chains'
import { ChainState } from 'src/features/chains/types'
import { chainListToStateMap } from 'src/features/chains/utils'
import { parseActiveChains } from 'src/utils/chainId'

export interface Config {
  activeChains: ChainIdTo<ChainState>
  coingeckoApiUrl: string
  covalentApiKey: string
  debug: boolean
  graphqlApiUrl: string
  infuraProjectId: string
  logBufferSize: number
  onesignalAppId: string
  openseaApiKey: string
  sentryDsn: string
  version: string
  zerionApiKey: string
}

const _config: Config = {
  activeChains: chainListToStateMap(parseActiveChains(ACTIVE_CHAINS)),
  coingeckoApiUrl: COINGECKO_API_URL,
  covalentApiKey: COVALENT_API_KEY,
  debug: parseBoolean(DEBUG),
  graphqlApiUrl: GRAPHQL_API_URL,
  infuraProjectId: INFURA_PROJECT_ID,
  logBufferSize: parseInt(LOG_BUFFER_SIZE, 10),
  onesignalAppId: ONESIGNAL_APP_ID,
  openseaApiKey: OPENSEA_API_KEY,
  sentryDsn: SENTRY_DSN,
  version: VERSION,
  zerionApiKey: ZERION_API_KEY,
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
