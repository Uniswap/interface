import { createFetchClient, createTradingApiClient, getEntryGatewayUrl, provideSessionService } from '@universe/api'
import type { PlanEndpoints } from '@universe/api/src/clients/trading/createTradingApiClient'
import { reinitializeSession } from '@universe/api/src/components/ApiInit'
import { createWithSessionRetry } from '@universe/api/src/session/createWithSessionRetry'
import { getConfig } from '@universe/config'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
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

const entryGatewayTradingFetchClientWithSession = createFetchClient({
  getBaseUrl: getEntryGatewayUrl,
  getHeaders,
  getSessionService: () =>
    provideSessionService({
      getBaseUrl: getEntryGatewayUrl,
      // Sessions are currently required for plans, so this is enabled by default. The flag exists as a safety net to disable sessions for plan if needed.
      getIsSessionServiceEnabled: () => !getFeatureFlag(FeatureFlags.DisableSessionsForPlan),
    }),
  defaultOptions: {
    credentials: 'include',
  },
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
