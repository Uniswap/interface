import type {
  GetLPPriceDiscrepancyRequest,
  GetLPPriceDiscrepancyResponse,
  PoolInfoRequest,
  PoolInfoResponse,
} from '@uniswap/client-trading/dist/trading/v1/api_pb'
import type { FetchClient } from '@universe/api/src/clients/base/types'
import { createFetcher } from '@universe/api/src/clients/base/utils'
import type {
  ApprovalRequest,
  ApprovalResponse,
  ChainId,
  CheckApprovalLPRequest,
  CheckApprovalLPResponse,
  ClaimLPFeesRequest,
  ClaimLPFeesResponse,
  ClaimLPRewardsRequest,
  ClaimLPRewardsResponse,
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
  QuoteRequest,
  TransactionHash,
  WalletCheckDelegationRequestBody,
  WalletCheckDelegationResponseBody,
  WalletEncode7702RequestBody,
} from '@universe/api/src/clients/trading/__generated__'
import { RoutingPreference } from '@universe/api/src/clients/trading/__generated__'
import type {
  DiscriminatedQuoteResponse,
  ExistingTradeRequest,
  NewTradeRequest,
  SwappableTokensParams,
  TradeResponse,
  UpdateExistingTradeRequest,
} from '@universe/api/src/clients/trading/tradeTypes'
import { logger } from 'utilities/src/logger/logger'

// TODO(app-infra), de-duplicate with uniswapUrls.tradingApiPaths when other consumers are migrated to use TradingApiClient
export const TRADING_API_PATHS = {
  approval: 'check_approval',
  lp: {
    priceDiscrepancy: 'lp/price_discrepancy',
    claimFees: 'lp/claim',
    claimRewards: 'lp/claim_rewards',
    create: 'lp/create',
    decrease: 'lp/decrease',
    increase: 'lp/increase',
    approve: 'lp/approve',
    migrate: 'lp/migrate',
    poolInfo: 'lp/pool_info',
  },
  order: 'order',
  orders: 'orders',
  quote: 'quote',
  swap: 'swap',
  swap5792: 'swap_5792',
  swap7702: 'swap_7702',
  swappableTokens: 'swappable_tokens',
  swaps: 'swaps',
  trade: 'trade',
  wallet: {
    checkDelegation: 'wallet/check_delegation',
    encode7702: 'wallet/encode_7702',
  },
}

export interface TradingClientContext {
  fetchClient: FetchClient
  getFeatureFlagHeaders: () => HeadersInit
  getQuoteHeaders: () => HeadersInit
  getV4Headers: () => HeadersInit
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
  getLPPriceDiscrepancy: (params: GetLPPriceDiscrepancyRequest) => Promise<GetLPPriceDiscrepancyResponse>
  createLpPosition: (params: CreateLPPositionRequest) => Promise<CreateLPPositionResponse>
  decreaseLpPosition: (params: DecreaseLPPositionRequest) => Promise<DecreaseLPPositionResponse>
  increaseLpPosition: (params: IncreaseLPPositionRequest) => Promise<IncreaseLPPositionResponse>
  checkLpApproval: (params: CheckApprovalLPRequest, headers?: HeadersInit) => Promise<CheckApprovalLPResponse>
  claimLpFees: (params: ClaimLPFeesRequest) => Promise<ClaimLPFeesResponse>
  migrateLpPosition: (params: MigrateLPPositionRequest) => Promise<MigrateLPPositionResponse>
  fetchPoolInfo: (params: PoolInfoRequest) => Promise<PoolInfoResponse>
  fetchClaimLpIncentiveRewards: (params: ClaimLPRewardsRequest) => Promise<ClaimLPRewardsResponse>
  fetchWalletEncoding7702: (params: WalletEncode7702RequestBody) => Promise<Encode7702ResponseBody>
  checkWalletDelegationWithoutBatching: (
    params: WalletCheckDelegationRequestBody,
  ) => Promise<WalletCheckDelegationResponseBody>
  fetchNewTrade: (params: NewTradeRequest) => Promise<TradeResponse>
  fetchTrade: (params: ExistingTradeRequest) => Promise<TradeResponse>
  updateExistingTrade: (params: UpdateExistingTradeRequest) => Promise<TradeResponse>
  getExistingTrade: (params: ExistingTradeRequest) => Promise<TradeResponse>
}

type IndicativeQuoteRequest = Pick<
  QuoteRequest,
  'type' | 'amount' | 'tokenInChainId' | 'tokenOutChainId' | 'tokenIn' | 'tokenOut' | 'swapper'
>

export function createTradingApiClient(ctx: TradingClientContext): TradingApiClient {
  const { fetchClient: client, getFeatureFlagHeaders, getQuoteHeaders, getV4Headers, getApiPathPrefix } = ctx
  const getCombinedHeaders = (): HeadersInit => ({ ...getFeatureFlagHeaders(), ...getV4Headers() })
  const getQuoteSpecificHeaders = (): HeadersInit => ({
    ...getFeatureFlagHeaders(),
    ...getQuoteHeaders(),
    ...getV4Headers(),
  })
  const getApiPath = (path: string): string => `${getApiPathPrefix()}/${path}`

  const fetchQuote = createFetcher<QuoteRequest & { isUSDQuote?: boolean }, DiscriminatedQuoteResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.quote),
    method: 'post',
    transformRequest: async () => ({
      headers: getQuoteSpecificHeaders(),
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
      headers: getCombinedHeaders(),
    }),
  })

  const fetchSwap5792 = createFetcher<CreateSwap5792Request, CreateSwap5792Response>({
    client,
    url: getApiPath(TRADING_API_PATHS.swap5792),
    method: 'post',
    transformRequest: async () => ({
      headers: getCombinedHeaders(),
    }),
  })

  const fetchSwap7702 = createFetcher<CreateSwap7702Request, CreateSwap7702Response>({
    client,
    url: getApiPath(TRADING_API_PATHS.swap7702),
    method: 'post',
    transformRequest: async () => ({
      headers: getCombinedHeaders(),
    }),
  })

  const fetchCheckApproval = createFetcher<ApprovalRequest, ApprovalResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.approval),
    method: 'post',
    transformRequest: async () => ({
      headers: getFeatureFlagHeaders(),
    }),
  })

  const submitOrder = createFetcher<OrderRequest, OrderResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.order),
    method: 'post',
    transformRequest: async () => ({
      headers: getFeatureFlagHeaders(),
    }),
  })

  const fetchOrders = createFetcher<{ orderIds: string[] }, GetOrdersResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.orders),
    method: 'get',
    transformRequest: async ({ params }) => ({
      headers: getFeatureFlagHeaders(),
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
      headers: getFeatureFlagHeaders(),
    }),
  })

  const getLPPriceDiscrepancy = createFetcher<GetLPPriceDiscrepancyRequest, GetLPPriceDiscrepancyResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.lp.priceDiscrepancy),
    method: 'post',
    transformRequest: async ({ params }) => ({
      headers: { ...getFeatureFlagHeaders(), 'x-uniquote-enabled': 'true' },
      params: {
        // this needs to be destructured because otherwise the enums get stringified to the key and the backend expects the value.
        ...params,
      },
    }),
  })

  const createLpPosition = createFetcher<CreateLPPositionRequest, CreateLPPositionResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.lp.create),
    method: 'post',
    transformRequest: async () => ({
      headers: getFeatureFlagHeaders(),
    }),
  })

  const decreaseLpPosition = createFetcher<DecreaseLPPositionRequest, DecreaseLPPositionResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.lp.decrease),
    method: 'post',
    transformRequest: async () => ({
      headers: getFeatureFlagHeaders(),
    }),
  })

  const increaseLpPosition = createFetcher<IncreaseLPPositionRequest, IncreaseLPPositionResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.lp.increase),
    method: 'post',
    transformRequest: async () => ({
      headers: getFeatureFlagHeaders(),
    }),
  })

  const checkLpApproval = createFetcher<CheckApprovalLPRequest, CheckApprovalLPResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.lp.approve),
    method: 'post',
    transformRequest: async () => ({
      headers: getFeatureFlagHeaders(),
    }),
  })

  const claimLpFees = createFetcher<ClaimLPFeesRequest, ClaimLPFeesResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.lp.claimFees),
    method: 'post',
    transformRequest: async () => ({
      headers: getFeatureFlagHeaders(),
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
      headers: getFeatureFlagHeaders(),
      params: {
        txHashes: params.txHashes.join(','),
        chainId: params.chainId,
      },
    }),
  })

  const migrateLpPosition = createFetcher<MigrateLPPositionRequest, MigrateLPPositionResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.lp.migrate),
    method: 'post',
    transformRequest: async () => ({
      headers: getFeatureFlagHeaders(),
    }),
  })

  const fetchClaimLpIncentiveRewards = createFetcher<ClaimLPRewardsRequest, ClaimLPRewardsResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.lp.claimRewards),
    method: 'post',
    transformRequest: async () => ({
      headers: getFeatureFlagHeaders(),
    }),
  })

  const fetchPoolInfo = createFetcher<PoolInfoRequest, PoolInfoResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.lp.poolInfo),
    method: 'post',
    transformRequest: async ({ params }) => ({
      headers: { ...getFeatureFlagHeaders(), 'x-uniquote-enabled': 'true' },
      params: {
        // this needs to be destructured because otherwise the enums get stringified to the key and the backend expects the value.
        ...params,
      },
    }),
  })

  const fetchWalletEncoding7702 = createFetcher<WalletEncode7702RequestBody, Encode7702ResponseBody>({
    client,
    url: getApiPath(TRADING_API_PATHS.wallet.encode7702),
    method: 'post',
    transformRequest: async () => ({
      headers: getFeatureFlagHeaders(),
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
      headers: getFeatureFlagHeaders(),
    }),
  })

  // TODO: SWAP-429 - Uses this endpoint.
  const fetchNewTrade = createFetcher<NewTradeRequest, TradeResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.trade),
    method: 'post',
    transformRequest: async () => ({
      headers: getCombinedHeaders(),
    }),
  })

  // TODO: SWAP-434 - Uses this endpoint.
  const fetchTrade = createFetcher<ExistingTradeRequest, TradeResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.trade),
    method: 'post',
    transformRequest: async () => ({
      headers: getCombinedHeaders(),
    }),
  })

  // TODO: SWAP-434 - Uses this endpoint.
  const updateExistingTrade = createFetcher<UpdateExistingTradeRequest, TradeResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.trade),
    method: 'patch',
    transformRequest: async ({ params, url }) => ({
      headers: getCombinedHeaders(),
      params: {
        steps: params.steps,
      },
      url: `${url}/${params.tradeId}`,
    }),
  })

  // TODO: SWAP-438 - Uses this endpoint.
  const getExistingTrade = createFetcher<ExistingTradeRequest, TradeResponse>({
    client,
    url: getApiPath(TRADING_API_PATHS.trade),
    method: 'get',
    transformRequest: async ({ params, url }) => ({
      headers: getCombinedHeaders(),
      url: `${url}/${params.tradeId}`,
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
    getLPPriceDiscrepancy,
    createLpPosition,
    decreaseLpPosition,
    increaseLpPosition,
    checkLpApproval,
    claimLpFees,
    migrateLpPosition,
    fetchPoolInfo,
    fetchClaimLpIncentiveRewards,
    fetchWalletEncoding7702,
    checkWalletDelegationWithoutBatching,
    fetchNewTrade,
    fetchTrade,
    updateExistingTrade,
    getExistingTrade,
  }
}
