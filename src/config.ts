import { API_URL, DEBUG, VERSION } from 'react-native-dotenv'

interface Config {
  debug: boolean
  version: string
  apiUrl: string
}

const _config: Config = {
  debug: parseBoolean(DEBUG),
  version: VERSION,
  apiUrl: API_URL,
}

function parseBoolean(value: string): boolean {
  return value?.toLowerCase() === 'true'
}

export const config = Object.freeze(_config)
