import { API_URL, DEBUG, INFURA_PROJECT_ID, SENTRY_DSN, VERSION } from 'react-native-dotenv'
import { logger } from 'src/utils/logger'

interface Config {
  debug: boolean
  version: string
  apiUrl: string
  infuraProjectId: string
  sentryDsn: string
}

const _config: Config = {
  debug: parseBoolean(DEBUG),
  version: VERSION,
  apiUrl: API_URL,
  infuraProjectId: INFURA_PROJECT_ID,
  sentryDsn: SENTRY_DSN,
}

function parseBoolean(value: string): boolean {
  return value?.toLowerCase() === 'true'
}

export const config = Object.freeze(_config)

if (config.debug) {
  logger.debug('Using config:', config)
}
