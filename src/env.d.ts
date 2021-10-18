// Adds typings for env vars
// Keep in sync with .env files
declare module 'react-native-dotenv' {
  export const API_URL: string
  export const DEBUG: string
  export const INFURA_PROJECT_ID: string
  export const VERSION: string
  export const SENTRY_DSN: string
}
