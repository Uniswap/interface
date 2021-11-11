import {
  ACTIVE_CHAINS,
  API_URL,
  DEBUG,
  INFURA_PROJECT_ID,
  LOG_BUFFER_SIZE,
  SENTRY_DSN,
  VERSION,
} from 'react-native-dotenv'
import { ChainId, ChainIdTo } from 'src/constants/chains'
import { ChainState } from 'src/features/chains/types'

export interface Config {
  activeChains: ChainIdTo<ChainState>
  apiUrl: string
  debug: boolean
  infuraProjectId: string
  logBufferSize: number
  sentryDsn: string
  version: string
}

const _config: Config = {
  activeChains: parseActiveChains(ACTIVE_CHAINS),
  apiUrl: API_URL,
  debug: parseBoolean(DEBUG),
  infuraProjectId: INFURA_PROJECT_ID,
  logBufferSize: parseInt(LOG_BUFFER_SIZE, 10),
  sentryDsn: SENTRY_DSN,
  version: VERSION,
}

function parseBoolean(value: string): boolean {
  return value?.toLowerCase() === 'true'
}

function parseActiveChains(activeChainsString: string) {
  const activeChains: ChainIdTo<ChainState> = {}
  for (const _id of activeChainsString.split(',')) {
    const id = parseInt(_id, 10) as ChainId
    activeChains[id] = { isActive: true }
  }
  return activeChains
}

export const config = Object.freeze(_config)

if (config.debug) {
  // Cannot use logger here, causes error from circular dep
  // eslint-disable-next-line no-console
  console.debug('Using app config:', config)
}
