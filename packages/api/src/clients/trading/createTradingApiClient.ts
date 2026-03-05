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

// TODO(app-infra), de-duplicate with uniswapUrls.tradingApiPaths when other consumers are migrated to use TradingApiClient
export const TRADING_API_PATHS = {
  approval: 'check_approval',
  order: 'order',
  orders: 'orders',
  quote: 'quote',
  plan: 'plan',
  swap: 'swap',
  swap5792: 'swap_5792',
  swap7702: 'swap_7702',
  swappableTokens: 'swappable_tokens',
  swaps: 'swaps',
  wallet: {
    checkDelegation: 'wallet/check_delegation',
    encode7702: 'wallet/encode_7702',
  },
}

export interface TradingClientContext {
  fetchClient: FetchClient
  getFeatureFlagHeaders: (tradingApiPath: (typeof TRADING_API_PATHS)[keyof typeof TRADING_API_PATHS]) => HeadersInit
  getApiPathPrefix: () => string
}

export interface TradingApiClient {
  fetchQuote: (params: QuoteRequest & { isUSDQuote?: boolean }) => Promise<DiscriminatedQuoteResponse>
  fetchIndicativeQuote: (params: IndicativeQuoteRequest) => Promise<DiscriminatedQuoteResponse>
  fetchSwap: (params: CreateSwapRequest) => Promise<CreateSwapResponse>
  fetchSwap5792: (params: CreateSwap5792Request) => Promise<CreateSwap5792Response>
  fetchSwap7702: (params: CreateSwap7702Request) => Promise<CreateSwap7702Response>
  fetchSwaps: (params: { txHashes: TransactionHash[]; chainId: ChainId }) => Promise<GetSwapsResponse>
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

type IndicativeQuoteRequest = Pick<
  QuoteRequest,
  'type' | 'amount' | 'tokenInChainId' | 'tokenOutChainId' | 'tokenIn' | 'tokenOut' | 'swapper'
>

export function createTradingApiClient(ctx: TradingClientContext): TradingApiClient & PlanEndpoints {
  const { fetchClient: client, getFeatureFlagHeaders, getApiPathPrefix } = ctx
  const getApiPath = (path: string): string => `${getApiPathPrefix()}/${path}`

  const fetchQuote = createFetcher<QuoteRequest & { isUSDQuote?: boolean }, DiscriminatedQuoteResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.quote),
    method: 'post',
    transformRequest: async () => ({
      headers: getFeatureFlagHeaders(TRADING_API_PATHS.quote),
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
    transformRequest: async () => ({
      headers: getFeatureFlagHeaders(TRADING_API_PATHS.swap),
    }),
  })

  const fetchSwap5792 = createFetcher<CreateSwap5792Request, CreateSwap5792Response>({
    client,
    url: getApiPath(TRADING_API_PATHS.swap5792),
    method: 'post',
    transformRequest: async () => ({
      headers: getFeatureFlagHeaders(TRADING_API_PATHS.swap5792),
    }),
  })

  const fetchSwap7702 = createFetcher<CreateSwap7702Request, CreateSwap7702Response>({
    client,
    url: getApiPath(TRADING_API_PATHS.swap7702),
    method: 'post',
    transformRequest: async () => ({
      headers: getFeatureFlagHeaders(TRADING_API_PATHS.swap7702),
    }),
  })

  const fetchCheckApproval = createFetcher<ApprovalRequest, ApprovalResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.approval),
    method: 'post',
    transformRequest: async () => ({
      headers: getFeatureFlagHeaders(TRADING_API_PATHS.approval),
    }),
  })

  const submitOrder = createFetcher<OrderRequest, OrderResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.order),
    method: 'post',
    transformRequest: async () => ({
      headers: getFeatureFlagHeaders(TRADING_API_PATHS.order),
    }),
  })

  const fetchOrders = createFetcher<{ orderIds: string[] }, GetOrdersResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.orders),
    method: 'get',
    transformRequest: async ({ params }) => ({
      headers: getFeatureFlagHeaders(TRADING_API_PATHS.orders),
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
      headers: getFeatureFlagHeaders(TRADING_API_PATHS.orders),
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
      headers: getFeatureFlagHeaders(TRADING_API_PATHS.swappableTokens),
    }),
  })

  const fetchSwaps = createFetcher<
    {
      txHashes: TransactionHash[]
      chainId: ChainId
    },
    GetSwapsResponse
  >({
    client,
    url: getApiPath(TRADING_API_PATHS.swaps),
    method: 'get',
    transformRequest: async ({ params }) => ({
      headers: getFeatureFlagHeaders(TRADING_API_PATHS.swaps),
      params: {
        txHashes: params.txHashes.join(','),
        chainId: params.chainId,
      },
    }),
  })

  const fetchWalletEncoding7702 = createFetcher<WalletEncode7702RequestBody, Encode7702ResponseBody>({
    client,
    url: getApiPath(TRADING_API_PATHS.wallet.encode7702),
    method: 'post',
    transformRequest: async () => ({
      headers: getFeatureFlagHeaders(TRADING_API_PATHS.wallet.encode7702),
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
      headers: getFeatureFlagHeaders(TRADING_API_PATHS.wallet.checkDelegation),
    }),
  })

  const createNewPlan = createFetcher<CreatePlanRequest, PlanResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.plan),
    method: 'post',
    transformRequest: async () => ({
      headers: getFeatureFlagHeaders(TRADING_API_PATHS.plan),
    }),
  })

  const fetchPlan = createFetcher<ExistingPlanRequest, PlanResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.plan),
    method: 'post',
    transformRequest: async () => ({
      headers: getFeatureFlagHeaders(TRADING_API_PATHS.plan),
    }),
  })

  const updateExistingPlan = createFetcher<UpdatePlanRequestWithPlanId, PlanResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.plan),
    method: 'patch',
    transformRequest: async ({ params, url }) => ({
      headers: getFeatureFlagHeaders(TRADING_API_PATHS.plan),
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
      headers: getFeatureFlagHeaders(TRADING_API_PATHS.plan),
      url: `${url}/${params.planId}`,
      params: {},
    }),
  })

  const refreshExistingPlan = createFetcher<ExistingPlanRequest, PlanResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.plan),
    method: 'get',
    transformRequest: async ({ params, url }) => ({
      headers: getFeatureFlagHeaders(TRADING_API_PATHS.plan),
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
    fetchSwap5792,
    fetchSwap7702,
    fetchSwaps,
    fetchCheckApproval,
    submitOrder,
    fetchOrders,
    fetchOrdersWithoutIds,
    fetchSwappableTokens,
    fetchWalletEncoding7702,
    checkWalletDelegationWithoutBatching,
    createNewPlan,
    fetchPlan,
    updateExistingPlan,
    getExistingPlan,
    refreshExistingPlan,
  }
}
