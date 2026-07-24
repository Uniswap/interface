import { createFetchClient, type FetchClient, getEntryGatewayUrl, provideSessionService } from '@universe/api'
import { REQUEST_SOURCE } from '@universe/environment'
import { getIsSessionServiceEnabled } from '@universe/gating'

/**
 * FetchClient for the EventSubscriptionService RPCs (Subscribe / Unsubscribe /
 * RefreshSession). These are session-authenticated: on web the session lives in
 * an HttpOnly cookie on the entry gateway host, so requests must run with
 * `credentials: 'include'` for the browser to attach it when the entry gateway
 * is reached cross-origin (same pattern as the trading API clients).
 */
export function createLivePricesFetchClient({ subscriptionApiUrl }: { subscriptionApiUrl: string }): FetchClient {
  return createFetchClient({
    baseUrl: subscriptionApiUrl,
    getHeaders: () => ({
      'Content-Type': 'application/json',
      'x-request-source': REQUEST_SOURCE,
    }),
    getSessionService: () =>
      provideSessionService({ getBaseUrl: () => getEntryGatewayUrl(), getIsSessionServiceEnabled }),
    defaultOptions: { credentials: 'include' },
  })
}
