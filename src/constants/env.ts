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

const validate = <T extends string>(envKey: string, validateValues: T[]): T => {
  const key = 'REACT_APP_' + envKey
  const envValue = required(envKey)
  invariant(validateValues.includes(envValue as any), `env ${key} is incorrect`)
  return envValue as T
}

const ENV = {
  GOOGLE_RECAPTCHA_KEY: required('GOOGLE_RECAPTCHA_KEY'),
  PRICE_API: required('PRICE_API'),
  AGGREGATOR_API: required('AGGREGATOR_API'),
  SENTRY_DNS: required('SENTRY_DNS'),
  REWARD_SERVICE_API: required('REWARD_SERVICE_API'),
  KS_SETTING_API: required('KS_SETTING_API'),
  PRICE_CHART_API: required('PRICE_CHART_API'),
  AGGREGATOR_STATS_API: required('AGGREGATOR_STATS_API'),
  FIREBASE_API_KEY: required('FIREBASE_API_KEY'),
  FIREBASE_AUTH_DOMAIN: required('FIREBASE_AUTH_DOMAIN'),
  FIREBASE_PROJECT_ID: required('FIREBASE_PROJECT_ID'),
  FIREBASE_STORAGE_BUCKET: required('FIREBASE_STORAGE_BUCKET'),
  FIREBASE_MESSAGING_SENDER_ID: required('FIREBASE_MESSAGING_SENDER_ID'),
  FIREBASE_APP_ID: required('FIREBASE_APP_ID'),
  FIREBASE_VAPID_KEY: required('FIREBASE_VAPID_KEY'),
  NOTIFICATION_API: required('NOTIFICATION_API'),
  TRUESIGHT_API: required('TRUESIGHT_API'),
  TRANSAK_URL: required('TRANSAK_URL'),
  TRANSAK_API_KEY: required('TRANSAK_API_KEY'),
  TYPE_AND_SWAP_URL: required('TYPE_AND_SWAP_URL'),
  MIXPANEL_PROJECT_TOKEN: required('MIXPANEL_PROJECT_TOKEN'),
  CAMPAIGN_BASE_URL: required('CAMPAIGN_BASE_URL'),
  GTM_ID: process.env.REACT_APP_GTM_ID,
  TAG: process.env.REACT_APP_TAG || 'localhost',
  ENV_LEVEL: !process.env.REACT_APP_TAG
    ? ENV_TYPE.LOCAL
    : process.env.REACT_APP_TAG.startsWith('adpr')
    ? ENV_TYPE.ADPR
    : process.env.REACT_APP_TAG.startsWith('main')
    ? ENV_TYPE.DEV
    : process.env.REACT_APP_TAG.startsWith('release')
    ? ENV_TYPE.STG
    : ENV_TYPE.PROD,
} as const

export const {
  GOOGLE_RECAPTCHA_KEY,
  PRICE_API,
  AGGREGATOR_API,
  SENTRY_DNS,
  REWARD_SERVICE_API,
  KS_SETTING_API,
  PRICE_CHART_API,
  AGGREGATOR_STATS_API,
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_VAPID_KEY,
  NOTIFICATION_API,
  TRUESIGHT_API,
  TRANSAK_URL,
  TRANSAK_API_KEY,
  TYPE_AND_SWAP_URL,
  MIXPANEL_PROJECT_TOKEN,
  CAMPAIGN_BASE_URL,
  GTM_ID,
  TAG,
  ENV_LEVEL,
} = ENV

ENV_LEVEL < ENV_TYPE.PROD && console.info({ ENV })
