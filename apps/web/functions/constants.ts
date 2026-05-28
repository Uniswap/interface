export const WATERMARK_URL = 'https://app.uniswap.org/images/324x74_App_Watermark.png'

// Cap how long upstream data fetches in the meta-tag injector and image
// handlers can hang before we fall through to a 404 / un-injected SPA HTML.
// Without these caps, a stalled Apollo observable deadlocks the worker (CF
// Error 1101 → 500). See PR #32317 for the full investigation of the
// underlying module-scoped Apollo Client hang on stateless edge runtimes.
//
// 5000ms (vs #32317's original 1500ms) gives observed real-world upstream
// variance ~2x headroom — the polygon-NATIVE GraphQL query consistently
// takes ~2.6s, which reliably tripped the prior 1.5s ceiling. Worst-case
// SSR latency on hung Apollo is now 5s instead of 1.5s; acceptable since
// the page still renders un-injected and the tradeoff is between "OG tags
// occasionally missing for crawlers" (1.5s) and "SSR briefly slow in the
// rare hang case" (5s). Crawler timeouts are typically 5-10s.
export const IMAGE_DATA_FETCH_TIMEOUT_MS = 5000
export const META_TAG_FETCH_TIMEOUT_MS = 5000
