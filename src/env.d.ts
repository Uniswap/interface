// Adds typings for env vars
// Keep in sync with .env files
declare module 'react-native-dotenv' {
  export const ACTIVE_CHAINS: string
  export const ALCHEMY_API_KEY: string
  export const AMPLITUDE_API_URL: string
  export const AMPLITUDE_EXPERIMENTS_DEPLOYMENT_KEY: string
  export const DEBUG: string
  export const MOONPAY_API_KEY: string
  export const MOONPAY_API_URL: string
  export const MOONPAY_WIDGET_API_URL: string
  export const UNISWAP_API_BASE_URL: string
  export const UNISWAP_API_KEY: string
  export const UNISWAP_APP_URL: string
  export const INFURA_PROJECT_ID: string
  export const SENTRY_DSN: string
  export const VERSION: string
  export const ONESIGNAL_APP_ID: string
}
