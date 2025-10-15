import { config } from 'uniswap/src/config'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'
import { SwappableTokensParams } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiSwappableTokensQuery'
import {
  Address,
  ApprovalRequest,
  ApprovalResponse,
  BridgeQuote,
  ChainDelegationMap,
  ChainId,
  CheckApprovalLPRequest,
  CheckApprovalLPResponse,
  ClaimLPFeesRequest,
  ClaimLPFeesResponse,
  ClaimLPRewardsRequest,
  ClaimLPRewardsResponse,
  ClassicQuote,
  CreateLPPositionRequest,
  CreateLPPositionResponse,
  CreateSwap5792Request,
  CreateSwap5792Response,
  CreateSwap7702Request,
  CreateSwap7702Response,
  CreateSwapRequest,
  CreateSwapResponse,
  DecreaseLPPositionRequest,
  DecreaseLPPositionResponse,
  DutchQuoteV2,
  DutchQuoteV3,
  Encode7702ResponseBody,
  GetOrdersResponse,
  GetSwappableTokensResponse,
  GetSwapsResponse,
  IncreaseLPPositionRequest,
  IncreaseLPPositionResponse,
  MigrateLPPositionRequest,
  MigrateLPPositionResponse,
  OrderRequest,
  OrderResponse,
  OrderStatus,
  PriorityQuote,
  QuoteRequest,
  QuoteResponse,
  Routing,
  RoutingPreference,
  TradeType,
  TransactionHash,
  UniversalRouterVersion,
  WalletCheckDelegationRequestBody,
  WalletCheckDelegationResponseBody,
  WalletEncode7702RequestBody,
  WrapUnwrapQuote,
} from 'uniswap/src/data/tradingApi/__generated__'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { getFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { logger } from 'utilities/src/logger/logger'

// TradingAPI team is looking into updating type generation to produce the following types for it's current QuoteResponse type:
// See: https://linear.app/uniswap/issue/API-236/explore-changing-the-quote-schema-to-pull-out-a-basequoteresponse
export type DiscriminatedQuoteResponse =
  | ClassicQuoteResponse
  | DutchQuoteResponse
  | DutchV3QuoteResponse
  | PriorityQuoteResponse
  | BridgeQuoteResponse
  | WrapQuoteResponse<Routing.WRAP>
  | WrapQuoteResponse<Routing.UNWRAP>

export type DutchV3QuoteResponse = QuoteResponse & {
  quote: DutchQuoteV3
  routing: Routing.DUTCH_V3
}

export type DutchQuoteResponse = QuoteResponse & {
  quote: DutchQuoteV2
  routing: Routing.DUTCH_V2
}

export type PriorityQuoteResponse = QuoteResponse & {
  quote: PriorityQuote
  routing: Routing.PRIORITY
}

export type ClassicQuoteResponse = QuoteResponse & {
  quote: ClassicQuote
  routing: Routing.CLASSIC
}

export type BridgeQuoteResponse = QuoteResponse & {
  quote: BridgeQuote
  routing: Routing.BRIDGE
}

export type WrapQuoteResponse<T extends Routing.WRAP | Routing.UNWRAP> = QuoteResponse & {
  quote: WrapUnwrapQuote
  routing: T
}

const TradingApiClient = createApiClient({
  baseUrl: uniswapUrls.tradingApiUrl,
  additionalHeaders: {
    'x-api-key': config.tradingApiKey,
  },
})

const V4_HEADERS = {
  'x-universal-router-version': UniversalRouterVersion._2_0,
}

export const getFeatureFlaggedHeaders = (): Record<string, string> => {
  const uniquoteEnabled = getFeatureFlag(FeatureFlags.UniquoteEnabled)
  const viemProviderEnabled = getFeatureFlag(FeatureFlags.ViemProviderEnabled)

  return {
    'x-uniquote-enabled': uniquoteEnabled ? 'true' : 'false',
    'x-viem-provider-enabled': viemProviderEnabled ? 'true' : 'false',
  }
}

export type FetchQuote = (params: QuoteRequest & { isUSDQuote?: boolean }) => Promise<DiscriminatedQuoteResponse>

export async function fetchQuote({
  isUSDQuote: _isUSDQuote,
  ...params
}: QuoteRequest & { isUSDQuote?: boolean }): Promise<DiscriminatedQuoteResponse> {
  return await TradingApiClient.post<DiscriminatedQuoteResponse>(uniswapUrls.tradingApiPaths.quote, {
    body: JSON.stringify(params),
    headers: {
      ...V4_HEADERS,
      ...getFeatureFlaggedHeaders(),
    },
    on404: () => {
      logger.warn('TradingApiClient', 'fetchQuote', 'Quote 404', {
        chainIdIn: params.tokenInChainId,
        chainIdOut: params.tokenOutChainId,
        tradeType: params.type,
        isBridging: params.tokenInChainId !== params.tokenOutChainId,
      })
    },
  })
}

// min parameters needed for indicative quotes
export interface IndicativeQuoteRequest {
  type: TradeType
  amount: string
  tokenInChainId: number
  tokenOutChainId: number
  tokenIn: string
  tokenOut: string
  swapper: string
}

export type FetchIndicativeQuote = (params: IndicativeQuoteRequest) => Promise<DiscriminatedQuoteResponse>

/**
 * Fetches an indicative quote - a faster quote with FASTEST routing preference
 * Used to show approximate pricing while the full quote is being fetched
 */
export async function fetchIndicativeQuote(params: IndicativeQuoteRequest): Promise<DiscriminatedQuoteResponse> {
  // convert minimal params to full QuoteRequest with FASTEST routing
  const quoteRequest: QuoteRequest = {
    ...params,
    routingPreference: RoutingPreference.FASTEST,
  }

  return fetchQuote(quoteRequest)
}

export async function fetchSwap({ ...params }: CreateSwapRequest): Promise<CreateSwapResponse> {
  return await TradingApiClient.post<CreateSwapResponse>(uniswapUrls.tradingApiPaths.swap, {
    body: JSON.stringify(params),
    headers: {
      ...V4_HEADERS,
      ...getFeatureFlaggedHeaders(),
    },
  })
}

export async function fetchSwap5792({ ...params }: CreateSwap5792Request): Promise<CreateSwap5792Response> {
  return await TradingApiClient.post<CreateSwap5792Response>(uniswapUrls.tradingApiPaths.swap5792, {
    body: JSON.stringify(params),
    headers: {
      ...V4_HEADERS,
      ...getFeatureFlaggedHeaders(),
    },
  })
}

export async function fetchSwap7702({ ...params }: CreateSwap7702Request): Promise<CreateSwap7702Response> {
  return await TradingApiClient.post<CreateSwap7702Response>(uniswapUrls.tradingApiPaths.swap7702, {
    body: JSON.stringify(params),
    headers: {
      ...V4_HEADERS,
      ...getFeatureFlaggedHeaders(),
    },
  })
}

export async function fetchCheckApproval(params: ApprovalRequest): Promise<ApprovalResponse> {
  return await TradingApiClient.post<ApprovalResponse>(uniswapUrls.tradingApiPaths.approval, {
    body: JSON.stringify(params),
    headers: {
      ...getFeatureFlaggedHeaders(),
    },
  })
}

export async function submitOrder(params: OrderRequest): Promise<OrderResponse> {
  return await TradingApiClient.post<OrderResponse>(uniswapUrls.tradingApiPaths.order, {
    body: JSON.stringify(params),
    headers: {
      ...getFeatureFlaggedHeaders(),
    },
  })
}

export async function fetchOrders({ orderIds }: { orderIds: string[] }): Promise<GetOrdersResponse> {
  return await TradingApiClient.get<GetOrdersResponse>(uniswapUrls.tradingApiPaths.orders, {
    params: {
      orderIds: orderIds.join(','),
    },
    headers: {
      ...getFeatureFlaggedHeaders(),
    },
  })
}

export async function fetchOrdersWithoutIds({
  swapper,
  limit = 1,
  orderStatus,
}: {
  swapper: string
  limit: number
  orderStatus: OrderStatus
}): Promise<GetOrdersResponse> {
  return await TradingApiClient.get<GetOrdersResponse>(uniswapUrls.tradingApiPaths.orders, {
    params: {
      swapper,
      limit,
      orderStatus,
    },
  })
}

export async function fetchSwappableTokens(params: SwappableTokensParams): Promise<GetSwappableTokensResponse> {
  return await TradingApiClient.get<GetSwappableTokensResponse>(uniswapUrls.tradingApiPaths.swappableTokens, {
    params: {
      tokenIn: params.tokenIn,
      tokenInChainId: params.tokenInChainId,
    },
    headers: {
      ...getFeatureFlaggedHeaders(),
    },
  })
}

export async function createLpPosition(params: CreateLPPositionRequest): Promise<CreateLPPositionResponse> {
  return await TradingApiClient.post<CreateLPPositionResponse>(uniswapUrls.tradingApiPaths.createLp, {
    body: JSON.stringify({
      ...params,
    }),
    headers: {
      ...getFeatureFlaggedHeaders(),
    },
  })
}
export async function decreaseLpPosition(params: DecreaseLPPositionRequest): Promise<DecreaseLPPositionResponse> {
  return await TradingApiClient.post<DecreaseLPPositionResponse>(uniswapUrls.tradingApiPaths.decreaseLp, {
    body: JSON.stringify({
      ...params,
    }),
    headers: {
      ...getFeatureFlaggedHeaders(),
    },
  })
}
export async function increaseLpPosition(params: IncreaseLPPositionRequest): Promise<IncreaseLPPositionResponse> {
  return await TradingApiClient.post<IncreaseLPPositionResponse>(uniswapUrls.tradingApiPaths.increaseLp, {
    body: JSON.stringify({
      ...params,
    }),
    headers: {
      ...getFeatureFlaggedHeaders(),
    },
  })
}
export async function checkLpApproval(
  params: CheckApprovalLPRequest,
  headers?: Record<string, string>,
): Promise<CheckApprovalLPResponse> {
  return await TradingApiClient.post<CheckApprovalLPResponse>(uniswapUrls.tradingApiPaths.lpApproval, {
    body: JSON.stringify({
      ...params,
    }),
    headers: {
      ...getFeatureFlaggedHeaders(),
      ...headers,
    },
  })
}

export async function claimLpFees(params: ClaimLPFeesRequest): Promise<ClaimLPFeesResponse> {
  return await TradingApiClient.post<ClaimLPFeesResponse>(uniswapUrls.tradingApiPaths.claimLpFees, {
    body: JSON.stringify({
      ...params,
    }),
    headers: {
      ...getFeatureFlaggedHeaders(),
    },
  })
}

export async function fetchSwaps(params: { txHashes: TransactionHash[]; chainId: ChainId }): Promise<GetSwapsResponse> {
  return await TradingApiClient.get<GetSwapsResponse>(uniswapUrls.tradingApiPaths.swaps, {
    params: {
      txHashes: params.txHashes.join(','),
      chainId: params.chainId,
    },
    headers: {
      ...getFeatureFlaggedHeaders(),
    },
  })
}

export async function migrateLpPosition(params: MigrateLPPositionRequest): Promise<MigrateLPPositionResponse> {
  return await TradingApiClient.post<MigrateLPPositionResponse>(uniswapUrls.tradingApiPaths.migrate, {
    body: JSON.stringify({
      ...params,
    }),
    headers: {
      ...getFeatureFlaggedHeaders(),
    },
  })
}

export async function fetchClaimLpIncentiveRewards(params: ClaimLPRewardsRequest): Promise<ClaimLPRewardsResponse> {
  return await TradingApiClient.post<ClaimLPRewardsResponse>(uniswapUrls.tradingApiPaths.claimRewards, {
    body: JSON.stringify({
      ...params,
    }),
    headers: {
      ...getFeatureFlaggedHeaders(),
    },
  })
}

export async function fetchWalletEncoding7702(params: WalletEncode7702RequestBody): Promise<Encode7702ResponseBody> {
  return await TradingApiClient.post<Encode7702ResponseBody>(uniswapUrls.tradingApiPaths.wallet.encode7702, {
    body: JSON.stringify({
      ...params,
    }),
    headers: {
      ...getFeatureFlaggedHeaders(),
    },
  })
}

// Default maximum amount of combinations wallet<>chainId per check delegation request
const DEFAULT_CHECK_VALIDATIONS_BATCH_THRESHOLD = 140

// Utility function to chunk wallet addresses for batching
function chunkWalletAddresses(params: {
  walletAddresses: Address[]
  chainIds: ChainId[]
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

export async function checkWalletDelegationWithoutBatching(
  params: WalletCheckDelegationRequestBody,
): Promise<WalletCheckDelegationResponseBody> {
  return await TradingApiClient.post<WalletCheckDelegationResponseBody>(
    uniswapUrls.tradingApiPaths.wallet.checkDelegation,
    {
      body: JSON.stringify({
        ...params,
      }),
      headers: {
        ...getFeatureFlaggedHeaders(),
      },
    },
  )
}

function mergeDelegationResponses(responses: WalletCheckDelegationResponseBody[]): WalletCheckDelegationResponseBody {
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

  const mergedDelegationDetails: Record<string, ChainDelegationMap> = {}

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
  params: WalletCheckDelegationRequestBody,
) => Promise<WalletCheckDelegationResponseBody>

export async function checkWalletDelegation(
  params: WalletCheckDelegationRequestBody,
  batchThreshold: number = DEFAULT_CHECK_VALIDATIONS_BATCH_THRESHOLD,
): Promise<WalletCheckDelegationResponseBody> {
  const { walletAddresses, chainIds } = params

  // If no wallet addresses provided, no need to make a call to backend
  if (!walletAddresses || walletAddresses.length === 0) {
    return {
      requestId: '',
      delegationDetails: {},
    }
  }

  // Ensure batchThreshold is at least the number of chain IDs
  const effectiveBatchThreshold = Math.max(batchThreshold, chainIds.length)

  const totalCombinations = walletAddresses.length * chainIds.length

  // If under threshold, make a single request
  if (totalCombinations <= effectiveBatchThreshold) {
    return await checkWalletDelegationWithoutBatching(params)
  }

  // Split into batches
  const walletChunks = chunkWalletAddresses({ walletAddresses, chainIds, batchThreshold: effectiveBatchThreshold })

  // Make batched requests
  const batchPromises = walletChunks.map((chunk) =>
    checkWalletDelegationWithoutBatching({
      walletAddresses: chunk,
      chainIds,
    }),
  )

  const responses = await Promise.all(batchPromises)

  // Merge all responses
  return mergeDelegationResponses(responses)
}
