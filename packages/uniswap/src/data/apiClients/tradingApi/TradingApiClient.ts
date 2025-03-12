import { config } from 'uniswap/src/config'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'
import { SwappableTokensParams } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiSwappableTokensQuery'
import {
  ApprovalRequest,
  ApprovalResponse,
  BridgeQuote,
  ChainId,
  CheckApprovalLPRequest,
  CheckApprovalLPResponse,
  ClaimLPFeesRequest,
  ClaimLPFeesResponse,
  ClassicQuote,
  CreateLPPositionRequest,
  CreateLPPositionResponse,
  CreateSwapRequest,
  CreateSwapResponse,
  DecreaseLPPositionRequest,
  DecreaseLPPositionResponse,
  DutchQuoteV2,
  DutchQuoteV3,
  GetOrdersResponse,
  GetSwappableTokensResponse,
  GetSwapsResponse,
  IncreaseLPPositionRequest,
  IncreaseLPPositionResponse,
  IndicativeQuoteRequest,
  IndicativeQuoteResponse,
  MigrateLPPositionRequest,
  MigrateLPPositionResponse,
  OrderRequest,
  OrderResponse,
  PriorityQuote,
  QuoteRequest,
  QuoteResponse,
  Routing,
  TransactionHash,
  UniversalRouterVersion,
} from 'uniswap/src/data/tradingApi/__generated__'

// TradingAPI team is looking into updating type generation to produce the following types for it's current QuoteResponse type:
// See: https://linear.app/uniswap/issue/API-236/explore-changing-the-quote-schema-to-pull-out-a-basequoteresponse
export type DiscriminatedQuoteResponse =
  | ClassicQuoteResponse
  | DutchQuoteResponse
  | DutchV3QuoteResponse
  | PriorityQuoteResponse
  | BridgeQuoteResponse

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

export const TRADING_API_CACHE_KEY = 'TradingApi'

const TradingApiClient = createApiClient({
  baseUrl: uniswapUrls.tradingApiUrl,
  additionalHeaders: {
    'x-api-key': config.tradingApiKey,
  },
})

export type WithV4Flag<T> = T & { v4Enabled: boolean }

export async function fetchQuote({
  v4Enabled,
  ...params
}: WithV4Flag<QuoteRequest>): Promise<DiscriminatedQuoteResponse> {
  return await TradingApiClient.post<DiscriminatedQuoteResponse>(uniswapUrls.tradingApiPaths.quote, {
    body: JSON.stringify(params),
    headers: {
      'x-universal-router-version': v4Enabled ? UniversalRouterVersion._2_0 : UniversalRouterVersion._1_2,
    },
  })
}

export async function fetchIndicativeQuote(params: IndicativeQuoteRequest): Promise<IndicativeQuoteResponse> {
  return await TradingApiClient.post<IndicativeQuoteResponse>(uniswapUrls.tradingApiPaths.indicativeQuote, {
    body: JSON.stringify(params),
  })
}

export async function fetchSwap({ v4Enabled, ...params }: WithV4Flag<CreateSwapRequest>): Promise<CreateSwapResponse> {
  return await TradingApiClient.post<CreateSwapResponse>(uniswapUrls.tradingApiPaths.swap, {
    body: JSON.stringify(params),
    headers: {
      'x-universal-router-version': v4Enabled ? '2.0' : '1.2',
    },
  })
}

export async function fetchCheckApproval(params: ApprovalRequest): Promise<ApprovalResponse> {
  return await TradingApiClient.post<ApprovalResponse>(uniswapUrls.tradingApiPaths.approval, {
    body: JSON.stringify(params),
  })
}

export async function submitOrder(params: OrderRequest): Promise<OrderResponse> {
  return await TradingApiClient.post<OrderResponse>(uniswapUrls.tradingApiPaths.order, {
    body: JSON.stringify(params),
  })
}

export async function fetchOrders({ orderIds }: { orderIds: string[] }): Promise<GetOrdersResponse> {
  return await TradingApiClient.get<GetOrdersResponse>(uniswapUrls.tradingApiPaths.orders, {
    params: {
      orderIds: orderIds.join(','),
    },
  })
}

export async function fetchSwappableTokens(params: SwappableTokensParams): Promise<GetSwappableTokensResponse> {
  return await TradingApiClient.get<GetSwappableTokensResponse>(uniswapUrls.tradingApiPaths.swappableTokens, {
    params: {
      tokenIn: params.tokenIn,
      tokenInChainId: params.tokenInChainId,
    },
  })
}

export async function createLpPosition(params: CreateLPPositionRequest): Promise<CreateLPPositionResponse> {
  return await TradingApiClient.post<CreateLPPositionResponse>(uniswapUrls.tradingApiPaths.createLp, {
    body: JSON.stringify({
      ...params,
    }),
  })
}
export async function decreaseLpPosition(params: DecreaseLPPositionRequest): Promise<DecreaseLPPositionResponse> {
  return await TradingApiClient.post<DecreaseLPPositionResponse>(uniswapUrls.tradingApiPaths.decreaseLp, {
    body: JSON.stringify({
      ...params,
    }),
  })
}
export async function increaseLpPosition(params: IncreaseLPPositionRequest): Promise<IncreaseLPPositionResponse> {
  return await TradingApiClient.post<IncreaseLPPositionResponse>(uniswapUrls.tradingApiPaths.increaseLp, {
    body: JSON.stringify({
      ...params,
    }),
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
    headers,
  })
}

export async function claimLpFees(params: ClaimLPFeesRequest): Promise<ClaimLPFeesResponse> {
  return await TradingApiClient.post<ClaimLPFeesResponse>(uniswapUrls.tradingApiPaths.claimLpFees, {
    body: JSON.stringify({
      ...params,
    }),
  })
}

export async function fetchSwaps(params: { txHashes: TransactionHash[]; chainId: ChainId }): Promise<GetSwapsResponse> {
  return await TradingApiClient.get<GetSwapsResponse>(uniswapUrls.tradingApiPaths.swaps, {
    params: {
      txHashes: params.txHashes.join(','),
      chainId: params.chainId,
    },
  })
}

export async function migrateLpPosition(params: MigrateLPPositionRequest): Promise<MigrateLPPositionResponse> {
  return await TradingApiClient.post<MigrateLPPositionResponse>(uniswapUrls.tradingApiPaths.migrate, {
    body: JSON.stringify({
      ...params,
    }),
  })
}
