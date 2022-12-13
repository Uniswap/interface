import invariant from 'tiny-invariant'

export enum ENV_TYPE {
  LOCAL,
  ADPR,
  DEV,
  STG,
  PROD,
}

const required = (envKey: string): string => {
  const key = 'REACT_APP_' + envKey
  const envValue = process.env[key]
  invariant(envValue, `env ${key} is missing`)
  return envValue
}

// uncomment when needed
// example of use: https://github.com/KyberNetwork/kyberswap-interface/blob/f7a8c56fc06fa75514b8ac59ff53e838e27cf4c5/src/constants/env.ts#L18
// const validate = <T extends string>(envKey: string, validateValues: T[]): T => {
//   const key = 'REACT_APP_' + envKey
//   const envValue = required(envKey)
//   invariant(validateValues.includes(envValue as any), `env ${key} is incorrect`)
//   return envValue as T
// }

export const GOOGLE_RECAPTCHA_KEY = required('GOOGLE_RECAPTCHA_KEY')
export const PRICE_API = required('PRICE_API')
export const AGGREGATOR_API = required('AGGREGATOR_API')
export const SENTRY_DNS = required('SENTRY_DNS')
export const REWARD_SERVICE_API = required('REWARD_SERVICE_API')
export const KS_SETTING_API = required('KS_SETTING_API')
export const PRICE_CHART_API = required('PRICE_CHART_API')
export const AGGREGATOR_STATS_API = required('AGGREGATOR_STATS_API')
export const FIREBASE_API_KEY = required('FIREBASE_API_KEY')
export const FIREBASE_AUTH_DOMAIN = required('FIREBASE_AUTH_DOMAIN')
export const FIREBASE_PROJECT_ID = required('FIREBASE_PROJECT_ID')
export const FIREBASE_STORAGE_BUCKET = required('FIREBASE_STORAGE_BUCKET')
export const FIREBASE_MESSAGING_SENDER_ID = required('FIREBASE_MESSAGING_SENDER_ID')
export const FIREBASE_APP_ID = required('FIREBASE_APP_ID')
export const NOTIFICATION_API = required('NOTIFICATION_API')
export const TRUESIGHT_API = required('TRUESIGHT_API')
export const TRANSAK_URL = required('TRANSAK_URL')
export const TRANSAK_API_KEY = required('TRANSAK_API_KEY')
export const TYPE_AND_SWAP_URL = required('TYPE_AND_SWAP_URL')
export const MIXPANEL_PROJECT_TOKEN = required('MIXPANEL_PROJECT_TOKEN')
export const CAMPAIGN_BASE_URL = required('CAMPAIGN_BASE_URL')
export const GTM_ID = process.env.REACT_APP_GTM_ID
export const TAG = process.env.REACT_APP_TAG || 'localhost'
export const ENV_LEVEL = !process.env.REACT_APP_TAG
  ? ENV_TYPE.LOCAL
  : process.env.REACT_APP_TAG.startsWith('adpr')
  ? ENV_TYPE.ADPR
  : process.env.REACT_APP_TAG.startsWith('main')
  ? ENV_TYPE.DEV
  : process.env.REACT_APP_TAG.startsWith('release')
  ? ENV_TYPE.STG
  : ENV_TYPE.PROD
export const LIMIT_ORDER_API_READ = required('LIMIT_ORDER_API_READ')
export const LIMIT_ORDER_API_WRITE = required('LIMIT_ORDER_API_WRITE')
