import ms from 'ms'
import { PlatformIdType } from 'uniswap/src/data/rest/conversionTracking/types'

export const CONVERSION_LEADS_EXPIRATION_MS = ms('30d')
export const CONVERSION_LEADS_STORAGE_KEY = 'conversion.leads'
export const CONVERSION_LEADS_EXTERNAL_COOKIE_NAME = 'conversion.leads.external'
export const CONVERSION_LEADS_EXTERNAL_COOKIE_DOMAIN = __DEV__ ? 'localhost' : '.uniswap.org'

export const DEV_CONVERSION_PROXY_API_BASE_URL_DEPRECATED = 'https://erasld2vrf.execute-api.us-east-2.amazonaws.com'
export const STAGING_CONVERSION_PROXY_API_BASE_URL_DEPRECATED = 'https://x6ahx1oagk.execute-api.us-east-2.amazonaws.com'
export const PROD_CONVERSION_PROXY_API_BASE_URL_DEPRECATED = 'https://8mr3mthjba.execute-api.us-east-2.amazonaws.com'

export const DEV_CONVERSION_PROXY_API_BASE_URL = 'https://entry-gateway.backend-dev.api.uniswap.org'
export const STAGING_CONVERSION_PROXY_API_BASE_URL = 'https://entry-gateway.backend-staging.api.uniswap.org'
export const PROD_CONVERSION_PROXY_API_BASE_URL = 'https://entry-gateway.backend-prod.api.uniswap.org'

export const DEFAULT_HEADERS = [{ key: 'content-type', value: 'application/json' }]

const TWITTER_CONVERSION_EVENT_ID = 'ojxcz'
const TWITTER_API_VERION = 12
export const TWITTER_CONVERSION_URL = `https://ads-api.x.com/${TWITTER_API_VERION}/measurement/conversions/${TWITTER_CONVERSION_EVENT_ID}`

const TWITTER_CONVERSION_EVENTS = {
  Web: {
    WalletConnected: {
      platformIdType: PlatformIdType.Twitter,
      eventId: 'tw-ojxcz-oo1x1',
      eventName: 'Wallet Connected - Web - CAPI',
    },
    WalletFunded: {
      platformIdType: PlatformIdType.Twitter,
      eventId: 'tw-ojxcz-oo1x5',
      eventName: 'Wallet Funded - Web - CAPI',
    },
  },
  Extension: {
    Download: {
      platformIdType: PlatformIdType.Twitter,
      eventId: 'tw-ojxcz-oo1x6',
      eventName: 'Download - Extension - CAPI',
    },
    WalletFunded: {
      platformIdType: PlatformIdType.Twitter,
      eventId: 'tw-ojxcz-oo1x7',
      eventName: 'Wallet Funded - Extension - CAPI',
    },
  },
}

const REDDIT_PIXEL_ID = 't2_tic7kuip'
export const REDDIT_CONVERSION_URL = `https://ads-api.reddit.com/api/v2.0/conversions/events/${REDDIT_PIXEL_ID}`

const GOOGLE_CUSTOMER_ID = '3416874723'
export const GOOGLE_CONVERSION_URL = `https://googleads.googleapis.com/v21/customers/${GOOGLE_CUSTOMER_ID}:uploadClickConversions`
export const GOOGLE_CONVERSION_DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ssXXX'

export const GOOGLE_CONVERSION_EVENTS = {
  Web: {
    WalletConnected: {
      platformIdType: PlatformIdType.Google,
      eventId: `customers/${GOOGLE_CUSTOMER_ID}/conversionActions/7029146589`,
      eventName: 'Wallet Connected - Web - CAPI',
    },
    WalletFunded: {
      platformIdType: PlatformIdType.Google,
      eventId: `customers/${GOOGLE_CUSTOMER_ID}/conversionActions/7029146586`,
      eventName: 'Wallet Funded - Web - CAPI',
    },
  },
  Extension: {
    Download: {
      platformIdType: PlatformIdType.Google,
      eventId: `customers/${GOOGLE_CUSTOMER_ID}/conversionActions/7029146592`,
      eventName: 'Download - Extension - CAPI',
    },
    WalletFunded: {
      platformIdType: PlatformIdType.Google,
      eventId: `customers/${GOOGLE_CUSTOMER_ID}/conversionActions/7029146595`,
      eventName: 'Wallet Funded - Extension - CAPI',
    },
  },
}

const REDDIT_CONVERSION_EVENTS = {
  Web: {
    WalletConnected: {
      platformIdType: PlatformIdType.Reddit,
      eventId: 'SignUp',
      eventName: 'Wallet Connected - Web - CAPI',
    },
    WalletFunded: {
      platformIdType: PlatformIdType.Reddit,
      eventId: 'AddToCart',
      eventName: 'Wallet Funded - Web - CAPI',
    },
  },
  Extension: {
    Download: {
      platformIdType: PlatformIdType.Reddit,
      eventId: 'Lead',
      eventName: 'Download - Extension - CAPI',
    },
    WalletFunded: {
      platformIdType: PlatformIdType.Reddit,
      eventId: 'AddToWishlist',
      eventName: 'Wallet Funded - Extension - CAPI',
    },
  },
}

export const CONVERSION_EVENTS = {
  Web: {
    WalletConnected: [
      GOOGLE_CONVERSION_EVENTS.Web.WalletConnected,
      TWITTER_CONVERSION_EVENTS.Web.WalletConnected,
      REDDIT_CONVERSION_EVENTS.Web.WalletConnected,
    ],
    WalletFunded: [
      GOOGLE_CONVERSION_EVENTS.Web.WalletFunded,
      TWITTER_CONVERSION_EVENTS.Web.WalletFunded,
      REDDIT_CONVERSION_EVENTS.Web.WalletFunded,
    ],
  },
  Extension: {
    Downloaded: [
      GOOGLE_CONVERSION_EVENTS.Extension.Download,
      TWITTER_CONVERSION_EVENTS.Extension.Download,
      REDDIT_CONVERSION_EVENTS.Extension.Download,
    ],
    WalletFunded: [
      GOOGLE_CONVERSION_EVENTS.Extension.WalletFunded,
      TWITTER_CONVERSION_EVENTS.Extension.WalletFunded,
      REDDIT_CONVERSION_EVENTS.Extension.WalletFunded,
    ],
  },
}
