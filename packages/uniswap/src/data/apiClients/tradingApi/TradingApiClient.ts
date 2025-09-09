/* eslint-disable max-lines */
import { parseUnits } from 'ethers/lib/utils'
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
import { FeeType } from 'uniswap/src/data/tradingApi/types'
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

// Custom quote client for selective endpoint override
const CustomQuoteApiClient = createApiClient({
  baseUrl: process.env.REACT_APP_CUSTOM_QUOTE_API_URL || uniswapUrls.tradingApiUrl,
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
  return await CustomQuoteApiClient.post<DiscriminatedQuoteResponse>(uniswapUrls.tradingApiPaths.quote, {
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
  const quote = params.quote
  const route = (quote as ClassicQuote).route?.[0]?.[0]
  const tokenIn = route?.tokenIn
  const tokenOut = route?.tokenOut
  const connectedWallet = quote.swapper

  const body = {
    tokenOutAddress: tokenOut?.address,
    tokenOutDecimals: parseInt(tokenOut?.decimals || '18', 10),
    tokenInChainId: tokenIn?.chainId,
    tokenInAddress: tokenIn?.address,
    tokenInDecimals: parseInt(tokenIn?.decimals || '18', 10),
    tokenOutChainId: tokenOut?.chainId,
    amount: (quote as { amount: string }).amount,
    type: 'exactIn',
    recipient: connectedWallet,
    from: connectedWallet,
    slippageTolerance: '5',
    deadline: params.deadline || '1800',
    chainId: tokenIn?.chainId,
  }

  const response = await CustomQuoteApiClient.post<{
    data: string
    to: string
    value: string
  }>(uniswapUrls.tradingApiPaths.swap, {
    body: JSON.stringify(body),
    headers: {
      ...V4_HEADERS,
      ...getFeatureFlaggedHeaders(),
    },
  })

  if (!tokenIn?.chainId || !connectedWallet) {
    throw new Error('Missing required chainId or connectedWallet')
  }

  return {
    requestId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    swap: {
      chainId: tokenIn.chainId,
      data: response.data,
      from: connectedWallet,
      to: response.to,
      value: response.value,
    },
  }
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

/**
 * Computes approval transaction locally using our calldata construction utilities
 * and proper gas estimation
 */
async function computeApprovalTransaction(params: ApprovalRequest): Promise<ApprovalResponse> {
  const { constructUnlimitedERC20ApproveCalldata } = require('uniswap/src/utils/approvalCalldata')
  const { createFetchGasFee } = require('uniswap/src/data/apiClients/uniswapApi/UniswapApiClient')
  const { Contract } = require('ethers')
  const ERC20_ABI = require('uniswap/src/abis/erc20.json')
  const { createEthersProvider } = require('uniswap/src/features/providers/createEthersProvider')
  const { tradingApiToUniverseChainId } = require('uniswap/src/features/transactions/swap/utils/tradingApi')

  // Get the spender address (V3 SwapRouter for classic swaps)
  const spenderAddress = '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E'

  // Check if enough approval is already granted
  try {
    const universeChainId = tradingApiToUniverseChainId(params.chainId)
    if (!universeChainId) {
      throw new Error('Unsupported chain ID')
    }
    const provider = createEthersProvider({ chainId: universeChainId })
    if (!provider) {
      throw new Error('Failed to create provider')
    }
    const tokenContract = new Contract(params.token, ERC20_ABI, provider)
    const currentAllowance = await tokenContract.callStatic.allowance(params.walletAddress, spenderAddress)

    // Convert params.amount to BigNumber with proper decimals
    // params.amount is likely already in wei format, so we use parseUnits with 0 decimals
    const requiredAmount = parseUnits(params.amount, 0)

    // If current allowance is greater than or equal to the required amount, no approval needed
    if (currentAllowance.gte(requiredAmount)) {
      return {
        requestId: '',
        approval: null,
        cancel: null,
      } as unknown as ApprovalResponse
    }
  } catch (error) {}

  // Construct the approval calldata
  const calldata = constructUnlimitedERC20ApproveCalldata(spenderAddress)

  // Generate a request ID
  const requestId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

  const baseTransaction = {
    to: params.token, // Token contract address
    value: '0x00', // No ETH value for ERC20 approvals
    from: params.walletAddress, // User's wallet address
    data: calldata, // Constructed approve calldata
    chainId: params.chainId,
  }

  const gasStrategy = params.gasStrategies?.[0] || {
    limitInflationFactor: 1.15,
    displayLimitInflationFactor: 1.15,
    priceInflationFactor: 1.5,
    percentileThresholdFor1559Fee: 75,
    thresholdToInflateLastBlockBaseFee: 0.75,
    baseFeeMultiplier: 1,
    baseFeeHistoryWindow: 20,
    minPriorityFeeRatioOfBaseFee: 0.2,
    minPriorityFeeGwei: 2,
    maxPriorityFeeGwei: 9,
  }

  const fetchGasFee = createFetchGasFee({ gasStrategy })

  try {
    const gasResult = await fetchGasFee({
      tx: baseTransaction,
      fallbackGasLimit: 65008,
    })

    // Handle case where gasResult.params might be undefined (client-side fallback)
    const gasParams = gasResult.params || {
      maxFeePerGas: '387366539',
      maxPriorityFeePerGas: '387335562',
      gasLimit: '65008',
    }

    const approvalTransaction = {
      ...baseTransaction,
      maxFeePerGas: gasParams.maxFeePerGas,
      maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas,
      gasLimit: gasParams.gasLimit,
    }

    const gasEstimate = {
      type: FeeType.EIP1559 as const,
      strategy: gasStrategy,
      gasLimit: gasParams.gasLimit,
      gasFee: gasResult.value,
      maxFeePerGas: gasParams.maxFeePerGas,
      maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas,
    }

    const response: ApprovalResponse = {
      requestId,
      approval: approvalTransaction,
      cancel: approvalTransaction,
      gasFee: gasResult.value,
      cancelGasFee: gasResult.value, // Same gas fee for cancel transaction
      gasEstimates: [gasEstimate],
    }

    return response
  } catch (error) {
    const approvalTransaction = {
      ...baseTransaction,
      maxFeePerGas: '387366539',
      maxPriorityFeePerGas: '387335562',
      gasLimit: '65008',
    }

    const gasEstimate = {
      type: FeeType.EIP1559 as const,
      strategy: gasStrategy,
      gasLimit: '65008',
      gasFee: '25181923967312',
      maxFeePerGas: '387366539',
      maxPriorityFeePerGas: '387335562',
    }

    const response: ApprovalResponse = {
      requestId,
      approval: approvalTransaction,
      cancel: approvalTransaction,
      gasFee: '25181923967312',
      cancelGasFee: '25181923967312', // Same gas fee for cancel transaction
      gasEstimates: [gasEstimate],
    }

    return response
  }
}

export async function fetchCheckApproval(params: ApprovalRequest): Promise<ApprovalResponse> {
  const computedResponse = await computeApprovalTransaction(params)
  return computedResponse
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
