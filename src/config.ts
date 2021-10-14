import { API_URL, DEBUG, SENTRY_DSN, VERSION } from 'react-native-dotenv'

interface Config {
  debug: boolean
  version: string
  apiUrl: string
  sentryDsn: string
}

const _config: Config = {
  debug: parseBoolean(DEBUG),
  version: VERSION,
  apiUrl: API_URL,
  sentryDsn: SENTRY_DSN,
}

function parseBoolean(value: string): boolean {
  return value?.toLowerCase() === 'true'
}

export const config = Object.freeze(_config)
