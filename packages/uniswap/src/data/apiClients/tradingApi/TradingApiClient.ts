import { createTradingApiClient, TradingApi } from '@universe/api'
import { TRADING_API_PATHS } from '@universe/api/src/clients/trading/createTradingApiClient'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { config } from 'uniswap/src/config'
import { tradingApiVersionPrefix, uniswapUrls } from 'uniswap/src/constants/urls'
import { createUniswapFetchClient } from 'uniswap/src/data/apiClients/createUniswapFetchClient'
import { filterChainIdsByPlatform } from 'uniswap/src/features/chains/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'

// Use UNISWAP_GATEWAY_DNS for quote API only, keep other endpoints using default Trading API
const quoteApiBaseUrl = process.env.REACT_APP_UNISWAP_GATEWAY_DNS || uniswapUrls.tradingApiUrl

const TradingFetchClient = createUniswapFetchClient({
  baseUrl: uniswapUrls.tradingApiUrl,
  additionalHeaders: {
    'x-api-key': config.tradingApiKey,
  },
})

// Separate fetch client for quote API only
// Only add x-api-key header if tradingApiKey is provided (for local services, this may be empty)
const quoteApiHeaders: Record<string, string> = {}
if (config.tradingApiKey) {
  quoteApiHeaders['x-api-key'] = config.tradingApiKey
}

const QuoteFetchClient = createUniswapFetchClient({
  baseUrl: quoteApiBaseUrl,
  additionalHeaders: quoteApiHeaders,
})

// Debug: Log Trading API configuration (quoteUrlPath will be defined later)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const debugQuoteUrlPath = tradingApiVersionPrefix
    ? `${tradingApiVersionPrefix}/${TRADING_API_PATHS.quote}`
    : `/${TRADING_API_PATHS.quote}`
  console.log('[TradingApiClient] Base URL:', uniswapUrls.tradingApiUrl)
  console.log('[TradingApiClient] Quote API Base URL:', quoteApiBaseUrl)
  console.log('[TradingApiClient] API Path Prefix:', tradingApiVersionPrefix)
  console.log('[TradingApiClient] Quote URL Path:', debugQuoteUrlPath)
  console.log('[TradingApiClient] Full Quote URL:', `${quoteApiBaseUrl}${debugQuoteUrlPath}`)
  console.log(
    '[TradingApiClient] Trading API Key:',
    config.tradingApiKey ? '***' : '(empty - no API key header will be sent)',
  )
  console.log('[TradingApiClient] Quote API Headers:', quoteApiHeaders)
}

/**
 * Helper to add a header only if enabled.
 */
function addHeaderIfEnabled(params: { headers: Record<string, string>; key: string; enabled: boolean }): void {
  const { headers, key, enabled } = params
  if (enabled) {
    headers[key] = 'true'
  }
}

export enum TradingApiHeaders {
  UniversalRouterVersion = 'x-universal-router-version',
  UniquoteEnabled = 'x-uniquote-enabled',
  ViemProviderEnabled = 'x-viem-provider-enabled',
  Erc20EthEnabled = 'x-erc20eth-enabled',
  ChainedActionsEnabled = 'x-chained-actions-enabled',
  UnirouteEnabled = 'x-uniroute-enabled',
  DisableUniswapInterfaceFees = 'x-disable-uniswap-interface-fees',
}

/**
 * Returns the headers for the trading API client that are based on feature flags
 *
 * NOTE: Be sure to confirm that adding this header does not cause a CORS issue
 * with the web environments.
 */
export const getFeatureFlaggedHeaders = (
  tradingApiPath: (typeof TRADING_API_PATHS)[keyof typeof TRADING_API_PATHS],
): HeadersInit => {
  const headers: Record<string, string> = {
    [TradingApiHeaders.UniversalRouterVersion]: TradingApi.UniversalRouterVersion._2_0,
  }
  const uniquoteEnabled = getFeatureFlag(FeatureFlags.UniquoteEnabled)
  const viemProviderEnabled = getFeatureFlag(FeatureFlags.ViemProviderEnabled)
  // Avoid custom headers on /quote until API Gateway CORS allowlist is updated.
  // TODO: Re-enable /quote headers once CORS allowlist includes them.
  if (tradingApiPath !== TRADING_API_PATHS.quote) {
    addHeaderIfEnabled({ headers, key: TradingApiHeaders.UniquoteEnabled, enabled: uniquoteEnabled })
    addHeaderIfEnabled({ headers, key: TradingApiHeaders.ViemProviderEnabled, enabled: viemProviderEnabled })
  } else {
    // addHeaderIfEnabled({ headers, key: TradingApiHeaders.UniquoteEnabled, enabled: uniquoteEnabled })
    // addHeaderIfEnabled({ headers, key: TradingApiHeaders.ViemProviderEnabled, enabled: viemProviderEnabled })
  }

  const chainedActionsEnabled = getFeatureFlag(FeatureFlags.ChainedActions)
  const unirouteEnabled = getFeatureFlag(FeatureFlags.UnirouteEnabled)
  const ethAsErc20UniswapXEnabled = getFeatureFlag(FeatureFlags.EthAsErc20UniswapX)
  const disableUniswapInterfaceFees = getFeatureFlag(FeatureFlags.NoUniswapInterfaceFees)
  switch (tradingApiPath) {
    case TRADING_API_PATHS.quote:
      // Temporarily skip headers blocked by API Gateway CORS allowlist.
      // TODO: Re-enable /quote headers once CORS allowlist includes them.
      // Server should add: x-uniquote-enabled, x-disable-uniswap-interface-fees.
      // addHeaderIfEnabled({ headers, key: TradingApiHeaders.UnirouteEnabled, enabled: unirouteEnabled })
      // addHeaderIfEnabled({ headers, key: TradingApiHeaders.Erc20EthEnabled, enabled: ethAsErc20UniswapXEnabled })
      // addHeaderIfEnabled({ headers, key: TradingApiHeaders.ChainedActionsEnabled, enabled: chainedActionsEnabled })
      // addHeaderIfEnabled({
      //   headers,
      //   key: TradingApiHeaders.DisableUniswapInterfaceFees,
      //   enabled: disableUniswapInterfaceFees,
      // })
      break
    case TRADING_API_PATHS.plan:
      addHeaderIfEnabled({ headers, key: TradingApiHeaders.ChainedActionsEnabled, enabled: chainedActionsEnabled })
      break
    case TRADING_API_PATHS.order:
      addHeaderIfEnabled({ headers, key: TradingApiHeaders.Erc20EthEnabled, enabled: ethAsErc20UniswapXEnabled })
      break
    case TRADING_API_PATHS.swap7702:
      addHeaderIfEnabled({ headers, key: TradingApiHeaders.UnirouteEnabled, enabled: unirouteEnabled })
      break
  }
  return headers
}

/**
 * NOTE: Be sure to confirm that adding this header does not cause a CORS issue
 * with the web environments
 */
export const getQuoteHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {}
  const unirouteEnabled = getFeatureFlag(FeatureFlags.UnirouteEnabled)
  addHeaderIfEnabled({ headers, key: 'x-uniroute-enabled', enabled: unirouteEnabled })
  return headers
}

// Create default TradingApiClient with standard Trading API URL
const DefaultTradingApiClient = createTradingApiClient({
  fetchClient: TradingFetchClient,
  getFeatureFlagHeaders: getFeatureFlaggedHeaders,
  getApiPathPrefix: () => tradingApiVersionPrefix,
})

// Create a custom fetchQuote that uses the quote-specific base URL
import { createFetcher } from '@universe/api/src/clients/base/utils'
import type { QuoteRequest } from '@universe/api/src/clients/trading/__generated__'
import { RoutingPreference } from '@universe/api/src/clients/trading/__generated__'
import type { DiscriminatedQuoteResponse } from '@universe/api/src/clients/trading/tradeTypes'

// IndicativeQuoteRequest is a subset of QuoteRequest
type IndicativeQuoteRequest = Pick<
  QuoteRequest,
  'type' | 'amount' | 'tokenInChainId' | 'tokenOutChainId' | 'tokenIn' | 'tokenOut' | 'swapper'
>

// Build the quote URL path.
// If the override base already includes a version segment (e.g. /prod/v2), do not append /v1.
const shouldUseVersionPrefix = (() => {
  if (!quoteApiBaseUrl) {
    return true
  }
  try {
    const url = new URL(quoteApiBaseUrl)
    const path = url.pathname.replace(/\/+$/, '')
    return !path.endsWith('/v2')
  } catch {
    // If it's not a valid URL, fall back to previous behavior.
    return true
  }
})()

const quoteUrlPath = shouldUseVersionPrefix
  ? `${tradingApiVersionPrefix}/${TRADING_API_PATHS.quote}`
  : `/${TRADING_API_PATHS.quote}`

// Transform request for internal quote API
// Keep all fields unchanged - API expects numeric chain IDs
const transformQuoteRequest = async (request: {
  url: string
  headers?: HeadersInit
  params: QuoteRequest & { isUSDQuote?: boolean }
}) => {
  const { params } = request

  // Ensure chain IDs are numbers (not strings)
  // API expects numeric chain IDs for HashKey chains (177 and 133)
  const transformedParams = {
    ...params,
    tokenInChainId: typeof params.tokenInChainId === 'string' ? parseInt(params.tokenInChainId, 10) : params.tokenInChainId,
    tokenOutChainId: typeof params.tokenOutChainId === 'string' ? parseInt(params.tokenOutChainId, 10) : params.tokenOutChainId,
  }

  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('[TradingApiClient] Request params:', {
      tokenInChainId: transformedParams.tokenInChainId,
      tokenOutChainId: transformedParams.tokenOutChainId,
      tokenInChainIdType: typeof transformedParams.tokenInChainId,
      tokenOutChainIdType: typeof transformedParams.tokenOutChainId,
      hasGasStrategies: !!transformedParams.gasStrategies,
    })
  }

  return {
    headers: getFeatureFlaggedHeaders(TRADING_API_PATHS.quote),
    params: transformedParams,
  }
}

const customFetchQuote = createFetcher<QuoteRequest & { isUSDQuote?: boolean }, DiscriminatedQuoteResponse>({
  client: QuoteFetchClient,
  url: quoteUrlPath,
  method: 'post',
  transformRequest: transformQuoteRequest,
  on404: (params: QuoteRequest & { isUSDQuote?: boolean }) => {
    // Use the logger from the default client if available
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn('[TradingApiClient] Quote 404', {
        chainIdIn: params.tokenInChainId,
        chainIdOut: params.tokenOutChainId,
        tradeType: params.type,
        isBridging: params.tokenInChainId !== params.tokenOutChainId,
        url: `${quoteApiBaseUrl}${quoteUrlPath}`,
      })
    }
  },
})

// Add error handling wrapper to log errors
const customFetchQuoteWithErrorHandling = async (
  params: QuoteRequest & { isUSDQuote?: boolean },
): Promise<DiscriminatedQuoteResponse> => {
  try {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[TradingApiClient] Fetching quote (original request):', {
        url: `${quoteApiBaseUrl}${quoteUrlPath}`,
        chainIdIn: params.tokenInChainId,
        chainIdOut: params.tokenOutChainId,
        requestBody: JSON.stringify(params, null, 2),
      })
      console.log('[TradingApiClient] Note: Request will be transformed by transformQuoteRequest before sending')
    }
    return await customFetchQuote(params)
  } catch (error) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('[TradingApiClient] Quote fetch error:', error, {
        url: `${quoteApiBaseUrl}${quoteUrlPath}`,
        chainIdIn: params.tokenInChainId,
        chainIdOut: params.tokenOutChainId,
        originalRequestBody: JSON.stringify(params, null, 2),
      })
    }
    throw error
  }
}

// Override fetchQuote to use the custom quote client
export const TradingApiClient = {
  ...DefaultTradingApiClient,
  fetchQuote: customFetchQuoteWithErrorHandling,
  // fetchIndicativeQuote also uses fetchQuote, so it will automatically use the custom one
  fetchIndicativeQuote: (params: IndicativeQuoteRequest): Promise<DiscriminatedQuoteResponse> => {
    return customFetchQuoteWithErrorHandling({
      ...params,
      routingPreference: RoutingPreference.FASTEST,
    })
  },
}

// Default maximum amount of combinations wallet<>chainId per check delegation request
const DEFAULT_CHECK_VALIDATIONS_BATCH_THRESHOLD = 140

// Utility function to chunk wallet addresses for batching
function chunkWalletAddresses(params: {
  walletAddresses: Address[]
  chainIds: TradingApi.ChainId[]
  batchThreshold: number
}): Address[][] {
  const { walletAddresses, chainIds, batchThreshold } = params
  const totalCombinations = walletAddresses.length * chainIds.length

  if (totalCombinations <= batchThreshold) {
    return [walletAddresses]
  }

  const maxWalletsPerBatch = Math.floor(batchThreshold / chainIds.length)
  const chunks: Address[][] = []

  for (let i = 0; i < walletAddresses.length; i += maxWalletsPerBatch) {
    chunks.push(walletAddresses.slice(i, i + maxWalletsPerBatch))
  }

  return chunks
}

function mergeDelegationResponses(
  responses: TradingApi.WalletCheckDelegationResponseBody[],
): TradingApi.WalletCheckDelegationResponseBody {
  if (responses.length === 0) {
    throw new Error('No responses to merge')
  }

  const firstResponse = responses[0]
  if (!firstResponse) {
    throw new Error('First response is undefined')
  }

  if (responses.length === 1) {
    return firstResponse
  }

  const mergedDelegationDetails: Record<string, TradingApi.ChainDelegationMap> = {}

  for (const response of responses) {
    for (const [walletAddress, chainDelegationMap] of Object.entries(response.delegationDetails)) {
      mergedDelegationDetails[walletAddress] = chainDelegationMap
    }
  }

  return {
    requestId: firstResponse.requestId,
    delegationDetails: mergedDelegationDetails,
  }
}

export type CheckWalletDelegation = (
  params: TradingApi.WalletCheckDelegationRequestBody,
) => Promise<TradingApi.WalletCheckDelegationResponseBody>

export async function checkWalletDelegation(
  params: TradingApi.WalletCheckDelegationRequestBody,
  batchThreshold: number = DEFAULT_CHECK_VALIDATIONS_BATCH_THRESHOLD,
): Promise<TradingApi.WalletCheckDelegationResponseBody> {
  const { walletAddresses, chainIds } = params

  // Filter out SVM chains - check_delegation only supports EVM chains
  const evmChainIds = filterChainIdsByPlatform(chainIds, Platform.EVM)

  // If no wallet addresses provided or if no EVM chains after filtering, return empty response
  if (!walletAddresses || walletAddresses.length === 0 || evmChainIds.length === 0) {
    return {
      requestId: '',
      delegationDetails: {},
    }
  }

  // Ensure batchThreshold is at least the number of chain IDs
  const effectiveBatchThreshold = Math.max(batchThreshold, evmChainIds.length)

  const totalCombinations = walletAddresses.length * evmChainIds.length

  // If under threshold, make a single request
  if (totalCombinations <= effectiveBatchThreshold) {
    return await TradingApiClient.checkWalletDelegationWithoutBatching({
      walletAddresses,
      chainIds: evmChainIds,
    })
  }

  // Split into batches
  const walletChunks = chunkWalletAddresses({
    walletAddresses,
    chainIds: evmChainIds,
    batchThreshold: effectiveBatchThreshold,
  })

  // Make batched requests
  const batchPromises = walletChunks.map((chunk) =>
    TradingApiClient.checkWalletDelegationWithoutBatching({
      walletAddresses: chunk,
      chainIds: evmChainIds,
    }),
  )

  const responses = await Promise.all(batchPromises)

  // Merge all responses
  return mergeDelegationResponses(responses)
}
