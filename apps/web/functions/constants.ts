export const WATERMARK_URL = 'https://app.uniswap.org/images/324x74_App_Watermark.png'

// Cap how long upstream data fetches in the meta-tag injector and image
// handlers can hang before we fall through to a 404 / un-injected SPA HTML,
// so a stalled upstream request can't hold the SSR response open.
//
// 5000ms leaves ~2x headroom over observed slow upstream lookups (~2.6s).
// The tradeoff is between "OG tags occasionally missing for crawlers" (too
// short) and "SSR briefly slow in the rare hang case" (too long); crawler
// timeouts are typically 5-10s.
export const IMAGE_DATA_FETCH_TIMEOUT_MS = 5000
export const META_TAG_FETCH_TIMEOUT_MS = 5000
