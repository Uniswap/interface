import {
  createFetchClient,
  createForApiClient,
  createWithSessionRetry,
  type ForApiClient as ForApiClientType,
  provideSessionService,
  reinitializeSession,
} from '@universe/api'
import { tryProvideSession } from '@universe/api'
import { SessionGateSource } from '@universe/sessions'
import { config } from 'uniswap/src/config'
import { getUniswapServiceUrls } from 'uniswap/src/constants/urls'
import { getForApiHeaders } from 'uniswap/src/features/fiatOnRamp/constants'
import { logger } from 'utilities/src/logger/logger'

/**
 * Singleton FetchClient for FOR API.
 *
 * FOR is served through the Entry Gateway with session auth (same host as Plan /
 * Chained Actions):
 * | Environment | URL                                                                       |
 * |-------------|---------------------------------------------------------------------------|
 * | Dev/Beta    | https://entry-gateway.backend-staging.api.uniswap.org/FOR.v1.FORService   |
 * | Prod        | https://entry-gateway.backend-prod.api.uniswap.org/FOR.v1.FORService      |
 *
 * Set `FOR_API_URL_OVERRIDE` to point at a custom URL.
 */
const ForApiFetchClient = createFetchClient({
  getBaseUrl: () => getUniswapServiceUrls(config).forApiUrl,
  getHeaders: getForApiHeaders,
  getSessionService: () =>
    provideSessionService({
      getBaseUrl: () => getUniswapServiceUrls(config).forApiUrl,
      getIsSessionServiceEnabled: () => true,
    }),
  getSession: tryProvideSession,
  source: SessionGateSource.FetchFor,
  // On web the session lives in an HttpOnly cookie set on the entry-gateway domain.
  // FOR requests go to entry-gateway.backend-prod.api.uniswap.org (same host as Plan
  // / Chained Actions), but from a different origin than app.uniswap.org. Without
  // credentials:include, the browser drops the cookie on these cross-origin requests
  // and the backend treats every web request as score=0. Plan already uses this
  // pattern against the same host, so CORS is known to allow credentials.
  defaultOptions: {
    credentials: 'include',
  },
})

const BaseForApiClient = createForApiClient({
  fetchClient: ForApiFetchClient,
})

const withSessionRetry = createWithSessionRetry({
  reinitializeSession: () => {
    logger.warn('ForApiClient', 'reinitializeSession', 'Reinitializing session after FOR 401')
    return reinitializeSession()
  },
})

// Wraps a single FOR endpoint so a 401 invalidates SESSION_INIT_QUERY_KEY (re-runs init
// + challenge) and the call is retried once. Inferred types preserve the original signature.
function withRetry<TReq, TRes>(fn: (req: TReq) => Promise<TRes>): (req: TReq) => Promise<TRes> {
  return (req) => withSessionRetry(() => fn(req))
}

// Non-gated endpoints (country/tokens/currencies/providers) don't need wrapping — they
// don't run validateSessionScore. Only the seven gated endpoints get retry behavior.
export const ForApiClient: ForApiClientType = {
  ...BaseForApiClient,
  getCryptoQuote: withRetry(BaseForApiClient.getCryptoQuote),
  getWidgetUrl: withRetry(BaseForApiClient.getWidgetUrl),
  getTransferWidgetUrl: withRetry(BaseForApiClient.getTransferWidgetUrl),
  getTransaction: withRetry(BaseForApiClient.getTransaction),
  getOffRampWidgetUrl: withRetry(BaseForApiClient.getOffRampWidgetUrl),
  getOffRampTransferDetails: withRetry(BaseForApiClient.getOffRampTransferDetails),
}
