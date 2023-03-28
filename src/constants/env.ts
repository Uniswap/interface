import invariant from 'tiny-invariant'

import { ENV_TYPE } from './type'

const required = (envKey: string): string => {
  const key = 'REACT_APP_' + envKey
  const envValue = process.env[key]
  invariant(envValue, `env ${key} is missing`)
  return envValue
}

export const GOOGLE_RECAPTCHA_KEY = required('GOOGLE_RECAPTCHA_KEY')
export const PRICE_API = required('PRICE_API')
export const AGGREGATOR_API = required('AGGREGATOR_API')
export const SENTRY_DNS = required('SENTRY_DNS')
export const REWARD_SERVICE_API = required('REWARD_SERVICE_API')
export const KS_SETTING_API = required('KS_SETTING_API')
export const PRICE_CHART_API = required('PRICE_CHART_API')
export const AGGREGATOR_STATS_API = required('AGGREGATOR_STATS_API')
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
  : process.env.REACT_APP_TAG.startsWith('main-stg')
  ? ENV_TYPE.STG
  : process.env.REACT_APP_TAG.startsWith('main')
  ? ENV_TYPE.DEV
  : ENV_TYPE.PROD

export const LIMIT_ORDER_API_READ = required('LIMIT_ORDER_API_READ')
export const LIMIT_ORDER_API_WRITE = required('LIMIT_ORDER_API_WRITE')
export const KYBER_DAO_STATS_API = required('KYBER_DAO_STATS_API')

export const NOTIFICATION_IGNORE_TEMPLATE_IDS = required('NOTIFICATION_IGNORE_TEMPLATE_IDS')

type FirebaseConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  databaseURL?: string
  appId: string
}

export const FIREBASE: { [key: string]: { DEFAULT: FirebaseConfig; LIMIT_ORDER?: FirebaseConfig } } = {
  development: {
    LIMIT_ORDER: {
      apiKey: 'AIzaSyBHRrinrQ3CXVrevZN442fjG0EZ-nYNNaU',
      authDomain: 'limit-order-dev.firebaseapp.com',
      projectId: 'limit-order-dev',
      storageBucket: 'limit-order-dev.appspot.com',
      messagingSenderId: '522790089501',
      appId: '1:522790089501:web:524403003ae65c09c727f4',
    },
    DEFAULT: {
      apiKey: 'AIzaSyCuEREEsq8e2eW9fs4FGhdPImekcLCG7bc',
      authDomain: 'notification-dev-4a732.firebaseapp.com',
      projectId: 'notification-dev-4a732',
      storageBucket: 'notification-dev-4a732.appspot.com',
      messagingSenderId: '38521816648',
      appId: '1:38521816648:web:0daa7524ed7b53837fba7d',
    },
  },
  staging: {
    LIMIT_ORDER: {
      apiKey: 'AIzaSyDVtU3R0ZWgO4YzKbvjP372E8sgvz1vAqc',
      authDomain: 'staging-339203.firebaseapp.com',
      projectId: 'staging-339203',
      storageBucket: 'staging-339203.appspot.com',
      messagingSenderId: '641432115631',
      appId: '1:641432115631:web:1ae29340e7e34e0c08f75a',
    },
    DEFAULT: {
      apiKey: 'AIzaSyAXTm2d_yT2r_hP-WJk68Aj_aGZOqPYIK8',
      authDomain: 'notification---staging.firebaseapp.com',
      projectId: 'notification---staging',
      storageBucket: 'notification---staging.appspot.com',
      messagingSenderId: '46809442918',
      appId: '1:46809442918:web:b9775a502e72f395541ba7',
    },
  },
  production: {
    DEFAULT: {
      apiKey: 'AIzaSyA1K_JAB8h0NIvjtFLHvZhfkFjW4Bls0bw',
      authDomain: 'notification---production.firebaseapp.com',
      projectId: 'notification---production',
      storageBucket: 'notification---production.appspot.com',
      messagingSenderId: '541963997326',
      appId: '1:541963997326:web:a6cc676067bc65f32679df',
    },
  },
}
