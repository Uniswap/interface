import {
  createTradingApiClient,
  createTradingApiFetchClient,
  createWithSessionRetry,
  getEntryGatewayUrl,
  provideSessionService,
  reinitializeSession,
} from '@universe/api'
import { type PlanEndpoints, tryProvideSession } from '@universe/api'
import { getConfig } from '@universe/config'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { SessionGateSource } from '@universe/sessions'
import { BASE_UNISWAP_HEADERS } from 'uniswap/src/data/apiClients/createUniswapFetchClient'
import { getFeatureFlaggedHeaders } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { logger } from 'utilities/src/logger/logger'

function getHeaders(): HeadersInit {
  // Use API key auth instead of session auth, if the flag is enabled.
  if (getFeatureFlag(FeatureFlags.DisableSessionsForPlan)) {
    return {
      ...BASE_UNISWAP_HEADERS,
      'x-api-key': getConfig().tradingApiKey,
    }
  }
  return BASE_UNISWAP_HEADERS
}

const withSessionRetry = createWithSessionRetry({
  reinitializeSession: () => {
    if (getFeatureFlag(FeatureFlags.DisableSessionsForPlan)) {
      return Promise.resolve() // API key auth — session re-init won't help
    }
    logger.warn('TradingApiSessionClient', 'reinitializeSession', 'Reinitializing session during plan')
    return reinitializeSession()
  },
  onReinitializationFailed: () => {
    logger.warn('TradingApiSessionClient', 'onReinitializationFailed', 'Reinitialization failed during plan')
  },
})

// The factory sets credentials: 'include' so web requests carry the session cookie.
const entryGatewayTradingFetchClientWithSession = createTradingApiFetchClient({
  getBaseUrl: getEntryGatewayUrl,
  getHeaders,
  getSessionService: () =>
    provideSessionService({
      getBaseUrl: getEntryGatewayUrl,
      // Sessions are currently required for plans, so this is enabled by default. The flag exists as a safety net to disable sessions for plan if needed.
      getIsSessionServiceEnabled: () => !getFeatureFlag(FeatureFlags.DisableSessionsForPlan),
    }),
  getSession: tryProvideSession,
  source: SessionGateSource.FetchTrading,
})

const BaseTradingApiSessionClient: PlanEndpoints = createTradingApiClient({
  fetchClient: entryGatewayTradingFetchClientWithSession,
  getFeatureFlagHeaders: getFeatureFlaggedHeaders,
  getApiPathPrefix: () => '',
})

const TradingApiSessionClientWithRetry: PlanEndpoints = {
  createNewPlan(params) {
    return withSessionRetry(() => BaseTradingApiSessionClient.createNewPlan(params))
  },
  fetchPlan(params) {
    return withSessionRetry(() => BaseTradingApiSessionClient.fetchPlan(params))
  },
  updateExistingPlan(params) {
    return withSessionRetry(() => BaseTradingApiSessionClient.updateExistingPlan(params))
  },
  getExistingPlan(params) {
    return withSessionRetry(() => BaseTradingApiSessionClient.getExistingPlan(params))
  },
  refreshExistingPlan(params) {
    return withSessionRetry(() => BaseTradingApiSessionClient.refreshExistingPlan(params))
  },
}

export const TradingApiSessionClient: PlanEndpoints = TradingApiSessionClientWithRetry
