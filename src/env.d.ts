// Adds typings for env vars
// Keep in sync with .env files
declare module 'react-native-dotenv' {
  export const ACTIVE_CHAINS: string
  export const COINGECKO_API_URL: string
  export const COVALENT_API_KEY: string
  export const DEBUG: string
  export const INFURA_PROJECT_ID: string
  export const LOG_BUFFER_SIZE: string
  export const OPENSEA_API_KEY: string
  export const SENTRY_DSN: string
  export const VERSION: string
  export const ONESIGNAL_APP_ID: string
  export const ZERION_API_KEY: string
}
