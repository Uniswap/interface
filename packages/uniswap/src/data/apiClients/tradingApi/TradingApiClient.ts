import { createTradingApiClient, TradingApi } from '@universe/api'
import { config } from 'uniswap/src/config'
import { tradingApiVersionPrefix, uniswapUrls } from 'uniswap/src/constants/urls'
import { createUniswapFetchClient } from 'uniswap/src/data/apiClients/createUniswapFetchClient'
import { filterChainIdsByPlatform } from 'uniswap/src/features/chains/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { getFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'

const TradingFetchClient = createUniswapFetchClient({
  baseUrl: uniswapUrls.tradingApiUrl,
  additionalHeaders: {
    'x-api-key': config.tradingApiKey,
  },
})

const V4_HEADERS = {
  'x-universal-router-version': TradingApi.UniversalRouterVersion._2_0,
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

/**
 * Returns the headers for the trading API client that are based on feature flags
 *
 * NOTE: Be sure to confirm that adding this header does not cause a CORS issue
 * with the web environments.
 */
export const getFeatureFlaggedHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {}
  const uniquoteEnabled = getFeatureFlag(FeatureFlags.UniquoteEnabled)
  const viemProviderEnabled = getFeatureFlag(FeatureFlags.ViemProviderEnabled)
  const ethAsErc20UniswapXEnabled = getFeatureFlag(FeatureFlags.EthAsErc20UniswapX)
  const chainedActionsEnabled = getFeatureFlag(FeatureFlags.ChainedActions)
  addHeaderIfEnabled({ headers, key: 'x-uniquote-enabled', enabled: uniquoteEnabled })
  addHeaderIfEnabled({ headers, key: 'x-viem-provider-enabled', enabled: viemProviderEnabled })
  addHeaderIfEnabled({ headers, key: 'x-erc20eth-enabled', enabled: ethAsErc20UniswapXEnabled })
  addHeaderIfEnabled({ headers, key: 'x-chained-actions-enabled', enabled: chainedActionsEnabled })
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

export const TradingApiClient = createTradingApiClient({
  fetchClient: TradingFetchClient,
  getFeatureFlagHeaders: getFeatureFlaggedHeaders,
  getQuoteHeaders,
  getV4Headers: () => V4_HEADERS,
  getApiPathPrefix: () => tradingApiVersionPrefix,
})

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
