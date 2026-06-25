import type { FetchClient } from '@universe/api/src/clients/base/types'
import { createFetcher } from '@universe/api/src/clients/base/utils'
import type {
  ApprovalRequest,
  ApprovalResponse,
  ChainId,
  CreateSwap5792Request,
  CreateSwap5792Response,
  CreateSwap7702Request,
  CreateSwap7702Response,
  CreateSwapRequest,
  CreateSwapResponse,
  Encode4337Request,
  Encode4337Response,
  Swap4337Request,
  Swap4337Response,
  Encode7702ResponseBody,
  GetOrdersResponse,
  GetSwappableTokensResponse,
  GetSwapsResponse,
  OrderRequest,
  OrderResponse,
  OrderStatus,
  QuoteRequest,
  TransactionHash,
  WalletCheckDelegationRequestBody,
  WalletCheckDelegationResponseBody,
  WalletEncode7702RequestBody,
} from '@universe/api/src/clients/trading/__generated__'
import { CreatePlanRequest, PlanResponse, RoutingPreference } from '@universe/api/src/clients/trading/__generated__'
import type {
  DiscriminatedQuoteResponse,
  ExistingPlanRequest,
  SwappableTokensParams,
  UpdatePlanRequestWithPlanId,
} from '@universe/api/src/clients/trading/tradeTypes'
import { logger } from 'utilities/src/logger/logger'

export const TRADING_API_PATHS = {
  approval: 'check_approval',
  order: 'order',
  orders: 'orders',
  quote: 'quote',
  plan: 'plan',
  swap: 'swap',
  swap4337: 'swap_4337',
  swap5792: 'swap_5792',
  swap7702: 'swap_7702',
  swappableTokens: 'swappable_tokens',
  swaps: 'swaps',
  wallet: {
    checkDelegation: 'wallet/check_delegation',
    encode7702: 'wallet/encode_7702',
    encode4337: 'wallet/encode_4337',
  },
}

export type TradingApiPaths = typeof TRADING_API_PATHS

/** Prefixes each trading API path (e.g. with the '/v1' version prefix). */
export function getVersionedTradingApiPaths(apiPathPrefix: string): TradingApiPaths {
  const addPrefix = <T extends Record<string, string | Record<string, string>>>(paths: T): T =>
    Object.fromEntries(
      Object.entries(paths).map(([key, value]) =>
        typeof value === 'string' ? [key, `${apiPathPrefix}/${value}`] : [key, addPrefix(value)],
      ),
      // Object.fromEntries widens to a generic record; the structure is unchanged so reassert T.
    ) as T
  return addPrefix(TRADING_API_PATHS)
}

/** Trading API paths under the default v1 prefix. */
export const V1_TRADING_API_PATHS = getVersionedTradingApiPaths('/v1')

export interface TradingClientContext {
  fetchClient: FetchClient
  getFeatureFlagHeaders: (
    tradingApiPath: (typeof TRADING_API_PATHS)[keyof typeof TRADING_API_PATHS],
    chainId?: ChainId,
  ) => HeadersInit | Promise<HeadersInit>
  getApiPathPrefix: () => string
}

export interface TradingApiClient {
  fetchQuote: (params: QuoteRequest & { isUSDQuote?: boolean }) => Promise<DiscriminatedQuoteResponse>
  fetchIndicativeQuote: (params: IndicativeQuoteRequest) => Promise<DiscriminatedQuoteResponse>
  fetchSwap: (params: CreateSwapRequest) => Promise<CreateSwapResponse>
  fetchSwap4337: (params: Swap4337Request) => Promise<Swap4337Response>
  fetchSwap5792: (params: CreateSwap5792Request) => Promise<CreateSwap5792Response>
  fetchSwap7702: (params: CreateSwap7702Request) => Promise<CreateSwap7702Response>
  fetchSwaps: (params: {
    txHashes?: TransactionHash[]
    userOpHashes?: string[]
    chainId: ChainId
    // When provided, the endpoint decorates matching sponsored swaps with `sponsorship` metadata.
    swapper?: string
  }) => Promise<GetSwapsResponse>
  fetchCheckApproval: (params: ApprovalRequest) => Promise<ApprovalResponse>
  submitOrder: (params: OrderRequest) => Promise<OrderResponse>
  fetchOrders: (params: { orderIds: string[] }) => Promise<GetOrdersResponse>
  fetchOrdersWithoutIds: (params: {
    swapper: string
    limit: number
    orderStatus: OrderStatus
  }) => Promise<GetOrdersResponse>
  fetchSwappableTokens: (params: SwappableTokensParams) => Promise<GetSwappableTokensResponse>
  fetchWalletEncoding7702: (params: WalletEncode7702RequestBody) => Promise<Encode7702ResponseBody>
  fetchWalletEncoding4337: (params: Encode4337Request) => Promise<Encode4337Response>
  checkWalletDelegationWithoutBatching: (
    params: WalletCheckDelegationRequestBody,
  ) => Promise<WalletCheckDelegationResponseBody>
}

export interface PlanEndpoints {
  createNewPlan: (params: CreatePlanRequest) => Promise<PlanResponse>
  fetchPlan: (params: ExistingPlanRequest) => Promise<PlanResponse>
  updateExistingPlan: (params: UpdatePlanRequestWithPlanId) => Promise<PlanResponse>
  getExistingPlan: (params: ExistingPlanRequest) => Promise<PlanResponse>
  refreshExistingPlan: (params: ExistingPlanRequest) => Promise<PlanResponse>
}

type IndicativeQuoteBase = Pick<
  QuoteRequest,
  'type' | 'amount' | 'tokenInChainId' | 'tokenOutChainId' | 'tokenIn' | 'tokenOut' | 'swapper'
>

type IndicativeQuoteRequest =
  | (IndicativeQuoteBase & Pick<QuoteRequest, 'autoSlippage'> & { slippageTolerance?: never })
  | (IndicativeQuoteBase & Pick<QuoteRequest, 'slippageTolerance'> & { autoSlippage?: never })

export function createTradingApiClient(ctx: TradingClientContext): TradingApiClient & PlanEndpoints {
  const { fetchClient: client, getFeatureFlagHeaders, getApiPathPrefix } = ctx
  const getApiPath = (path: string): string => `${getApiPathPrefix()}/${path}`

  const fetchQuote = createFetcher<QuoteRequest & { isUSDQuote?: boolean }, DiscriminatedQuoteResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.quote),
    method: 'post',
    transformRequest: async ({ params }) => ({
      headers: await getFeatureFlagHeaders(TRADING_API_PATHS.quote, params.tokenInChainId),
    }),
    on404: (params: QuoteRequest & { isUSDQuote?: boolean }) => {
      logger.warn('TradingApiClient', 'fetchQuote', 'Quote 404', {
        chainIdIn: params.tokenInChainId,
        chainIdOut: params.tokenOutChainId,
        tradeType: params.type,
        isBridging: params.tokenInChainId !== params.tokenOutChainId,
      })
    },
  })

  /**
   * Fetches an indicative quote - a faster quote with FASTEST routing preference
   * Used to show approximate pricing while the full quote is being fetched
   */
  const fetchIndicativeQuote = (params: IndicativeQuoteRequest): Promise<DiscriminatedQuoteResponse> => {
    return fetchQuote({
      ...params,
      routingPreference: RoutingPreference.FASTEST,
    })
  }

  const fetchSwap = createFetcher<CreateSwapRequest, CreateSwapResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.swap),
    method: 'post',
    transformRequest: async ({ params }) => ({
      headers: await getFeatureFlagHeaders(TRADING_API_PATHS.swap, params.quote.chainId),
    }),
  })

  const fetchSwap4337 = createFetcher<Swap4337Request, Swap4337Response>({
    client,
    url: getApiPath(TRADING_API_PATHS.swap4337),
    method: 'post',
    transformRequest: async ({ params }) => ({
      headers: await getFeatureFlagHeaders(TRADING_API_PATHS.swap4337, params.quote.chainId),
    }),
  })

  const fetchSwap5792 = createFetcher<CreateSwap5792Request, CreateSwap5792Response>({
    client,
    url: getApiPath(TRADING_API_PATHS.swap5792),
    method: 'post',
    transformRequest: async ({ params }) => ({
      headers: await getFeatureFlagHeaders(TRADING_API_PATHS.swap5792, params.quote.chainId),
    }),
  })

  const fetchSwap7702 = createFetcher<CreateSwap7702Request, CreateSwap7702Response>({
    client,
    url: getApiPath(TRADING_API_PATHS.swap7702),
    method: 'post',
    transformRequest: async ({ params }) => ({
      headers: await getFeatureFlagHeaders(TRADING_API_PATHS.swap7702, params.quote.chainId),
    }),
  })

  const fetchCheckApproval = createFetcher<ApprovalRequest, ApprovalResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.approval),
    method: 'post',
    transformRequest: async ({ params }) => ({
      headers: await getFeatureFlagHeaders(TRADING_API_PATHS.approval, params.chainId),
    }),
  })

  const submitOrder = createFetcher<OrderRequest, OrderResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.order),
    method: 'post',
    transformRequest: async () => ({
      headers: await getFeatureFlagHeaders(TRADING_API_PATHS.order),
    }),
  })

  const fetchOrders = createFetcher<{ orderIds: string[] }, GetOrdersResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.orders),
    method: 'get',
    transformRequest: async ({ params }) => ({
      headers: await getFeatureFlagHeaders(TRADING_API_PATHS.orders),
      params: {
        orderIds: params.orderIds.join(','),
      },
    }),
  })

  const fetchOrdersWithoutIds = createFetcher<
    {
      swapper: string
      orderStatus: OrderStatus
      limit?: number
    },
    GetOrdersResponse
  >({
    client,
    url: getApiPath(TRADING_API_PATHS.orders),
    method: 'get',
    transformRequest: async ({ params }) => ({
      headers: await getFeatureFlagHeaders(TRADING_API_PATHS.orders),
      params: {
        swapper: params.swapper,
        orderStatus: params.orderStatus,
        limit: params.limit ?? 1,
      },
    }),
  })

  const fetchSwappableTokens = createFetcher<SwappableTokensParams, GetSwappableTokensResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.swappableTokens),
    method: 'get',
    transformRequest: async () => ({
      headers: await getFeatureFlagHeaders(TRADING_API_PATHS.swappableTokens),
    }),
  })

  const fetchSwaps = createFetcher<
    {
      txHashes?: TransactionHash[]
      userOpHashes?: string[]
      chainId: ChainId
      swapper?: string
    },
    GetSwapsResponse
  >({
    client,
    url: getApiPath(TRADING_API_PATHS.swaps),
    method: 'get',
    transformRequest: async ({ params }) => ({
      headers: await getFeatureFlagHeaders(TRADING_API_PATHS.swaps, params.chainId),
      params: {
        ...(params.txHashes ? { txHashes: params.txHashes.join(',') } : {}),
        ...(params.userOpHashes ? { userOpHashes: params.userOpHashes.join(',') } : {}),
        ...(params.swapper ? { swapper: params.swapper } : {}),
        chainId: params.chainId,
      },
    }),
  })

  const fetchWalletEncoding7702 = createFetcher<WalletEncode7702RequestBody, Encode7702ResponseBody>({
    client,
    url: getApiPath(TRADING_API_PATHS.wallet.encode7702),
    method: 'post',
    transformRequest: async () => ({
      headers: await getFeatureFlagHeaders(TRADING_API_PATHS.wallet.encode7702),
    }),
  })

  const fetchWalletEncoding4337 = createFetcher<Encode4337Request, Encode4337Response>({
    client,
    url: getApiPath(TRADING_API_PATHS.wallet.encode4337),
    method: 'post',
    transformRequest: async () => ({
      headers: await getFeatureFlagHeaders(TRADING_API_PATHS.wallet.encode4337),
    }),
  })

  const checkWalletDelegationWithoutBatching = createFetcher<
    WalletCheckDelegationRequestBody,
    WalletCheckDelegationResponseBody
  >({
    client,
    url: getApiPath(TRADING_API_PATHS.wallet.checkDelegation),
    method: 'post',
    transformRequest: async () => ({
      headers: await getFeatureFlagHeaders(TRADING_API_PATHS.wallet.checkDelegation),
    }),
  })

  const createNewPlan = createFetcher<CreatePlanRequest, PlanResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.plan),
    method: 'post',
    transformRequest: async () => ({
      headers: await getFeatureFlagHeaders(TRADING_API_PATHS.plan),
    }),
  })

  const fetchPlan = createFetcher<ExistingPlanRequest, PlanResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.plan),
    method: 'post',
    transformRequest: async () => ({
      headers: await getFeatureFlagHeaders(TRADING_API_PATHS.plan),
    }),
  })

  const updateExistingPlan = createFetcher<UpdatePlanRequestWithPlanId, PlanResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.plan),
    method: 'patch',
    transformRequest: async ({ params, url }) => ({
      headers: await getFeatureFlagHeaders(TRADING_API_PATHS.plan),
      params: {
        steps: params.steps,
      },
      url: `${url}/${params.planId}`,
    }),
  })

  const getExistingPlan = createFetcher<ExistingPlanRequest, PlanResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.plan),
    method: 'get',
    transformRequest: async ({ params, url }) => ({
      headers: await getFeatureFlagHeaders(TRADING_API_PATHS.plan),
      url: `${url}/${params.planId}`,
      params: {},
    }),
  })

  const refreshExistingPlan = createFetcher<ExistingPlanRequest, PlanResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.plan),
    method: 'get',
    transformRequest: async ({ params, url }) => ({
      headers: await getFeatureFlagHeaders(TRADING_API_PATHS.plan),
      url: `${url}/${params.planId}`,
      params: {
        forceRefresh: true,
      },
    }),
  })

  return {
    fetchQuote,
    fetchIndicativeQuote,
    fetchSwap,
    fetchSwap4337,
    fetchSwap5792,
    fetchSwap7702,
    fetchSwaps,
    fetchCheckApproval,
    submitOrder,
    fetchOrders,
    fetchOrdersWithoutIds,
    fetchSwappableTokens,
    fetchWalletEncoding7702,
    fetchWalletEncoding4337,
    checkWalletDelegationWithoutBatching,
    createNewPlan,
    fetchPlan,
    updateExistingPlan,
    getExistingPlan,
    refreshExistingPlan,
  }
}
