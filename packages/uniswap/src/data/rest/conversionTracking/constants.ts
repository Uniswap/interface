import ms from 'ms'
import { PlatformIdType } from 'uniswap/src/data/rest/conversionTracking/types'

export const CONVERSION_LEADS_EXPIRATION_MS = ms('30d')
export const CONVERSION_LEADS_STORAGE_KEY = 'conversion.leads'
export const CONVERSION_LEADS_EXTERNAL_COOKIE_NAME = 'conversion.leads.external'
export const CONVERSION_LEADS_EXTERNAL_COOKIE_DOMAIN = __DEV__ ? 'localhost' : '.uniswap.org'

export const DEV_CONVERSION_PROXY_API_BASE_URL = 'https://erasld2vrf.execute-api.us-east-2.amazonaws.com'
export const STAGING_CONVERSION_PROXY_API_BASE_URL = 'https://x6ahx1oagk.execute-api.us-east-2.amazonaws.com'
export const PROD_CONVERSION_PROXY_API_BASE_URL = 'https://8mr3mthjba.execute-api.us-east-2.amazonaws.com'

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

export const PERSONAL3_CONVERSION_URL = 'https://www.persona3.tech/events/attribution/v1/s2s'

const REDDIT_PIXEL_ID = 't2_tic7kuip'
export const REDDIT_CONVERSION_URL = `https://ads-api.reddit.com/api/v2.0/conversions/events/${REDDIT_PIXEL_ID}`

const GOOGLE_CUSTOMER_ID = '3416874723'
export const GOOGLE_CONVERSION_URL = `https://googleads.googleapis.com/v18/customers/${GOOGLE_CUSTOMER_ID}:uploadClickConversions`
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

const PERSONA3_CONVERSION_EVENTS = {
  Web: {
    WalletConnected: {
      platformIdType: PlatformIdType.Persona3,
      eventId: '8d404263-48a4-409e-a313-f22887ea90bd',
      eventName: 'Wallet Connected - Web - CAPI',
    },
    WalletFunded: {
      platformIdType: PlatformIdType.Persona3,
      eventId: 'c38363f8-434d-43ee-8e6a-0438208d26fb',
      eventName: 'Wallet Funded - Web - CAPI',
    },
  },
  Extension: {
    Download: {
      platformIdType: PlatformIdType.Persona3,
      eventId: '53203093-5463-420d-8997-a67d9a301e18',
      eventName: 'Download - Extension - CAPI',
    },
    WalletFunded: {
      platformIdType: PlatformIdType.Persona3,
      eventId: '4c3f3752-6410-41bc-8a75-2d362eb976cd',
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
      PERSONA3_CONVERSION_EVENTS.Web.WalletConnected,
      REDDIT_CONVERSION_EVENTS.Web.WalletConnected,
    ],
    WalletFunded: [
      GOOGLE_CONVERSION_EVENTS.Web.WalletFunded,
      TWITTER_CONVERSION_EVENTS.Web.WalletFunded,
      PERSONA3_CONVERSION_EVENTS.Web.WalletFunded,
      REDDIT_CONVERSION_EVENTS.Web.WalletFunded,
    ],
  },
  Extension: {
    Downloaded: [
      GOOGLE_CONVERSION_EVENTS.Extension.Download,
      TWITTER_CONVERSION_EVENTS.Extension.Download,
      PERSONA3_CONVERSION_EVENTS.Extension.Download,
      REDDIT_CONVERSION_EVENTS.Extension.Download,
    ],
    WalletFunded: [
      GOOGLE_CONVERSION_EVENTS.Extension.WalletFunded,
      TWITTER_CONVERSION_EVENTS.Extension.WalletFunded,
      PERSONA3_CONVERSION_EVENTS.Extension.WalletFunded,
      REDDIT_CONVERSION_EVENTS.Extension.WalletFunded,
    ],
  },
}
