import { config } from 'uniswap/src/config'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'
import { SwappableTokensParams } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiSwappableTokensQuery'
import {
  ApprovalRequest,
  ApprovalResponse,
  BridgeQuote,
  ClassicQuote,
  CreateSwapRequest,
  CreateSwapResponse,
  DutchQuoteV2,
  GetOrdersResponse,
  GetSwappableTokensResponse,
  IndicativeQuoteRequest,
  IndicativeQuoteResponse,
  OrderRequest,
  OrderResponse,
  QuoteRequest,
  QuoteResponse,
  ReduceLPPositionRequest,
  ReduceLPPositionResponse,
  Routing,
} from 'uniswap/src/data/tradingApi/__generated__'

// TradingAPI team is looking into updating type generation to produce the following types for it's current QuoteResponse type:
// See: https://linear.app/uniswap/issue/API-236/explore-changing-the-quote-schema-to-pull-out-a-basequoteresponse
export type DiscriminatedQuoteResponse = ClassicQuoteResponse | DutchQuoteResponse | BridgeQuoteResponse

export type DutchQuoteResponse = QuoteResponse & {
  quote: DutchQuoteV2
  routing: Routing.DUTCH_V2
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

export async function fetchQuote(params: QuoteRequest): Promise<DiscriminatedQuoteResponse> {
  return await TradingApiClient.post<DiscriminatedQuoteResponse>(uniswapUrls.tradingApiPaths.quote, {
    body: JSON.stringify(params),
  })
}

export async function fetchIndicativeQuote(params: IndicativeQuoteRequest): Promise<IndicativeQuoteResponse> {
  return await TradingApiClient.post<IndicativeQuoteResponse>(uniswapUrls.tradingApiPaths.indicativeQuote, {
    body: JSON.stringify(params),
  })
}

export async function fetchSwap(params: CreateSwapRequest): Promise<CreateSwapResponse> {
  return await TradingApiClient.post<CreateSwapResponse>(uniswapUrls.tradingApiPaths.swap, {
    body: JSON.stringify(params),
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
      ...(params.tokenOut && { tokenOut: params.tokenOut }),
      ...(params.tokenOutChainId && { tokenOutChainId: params.tokenOutChainId }),
    },
  })
}

export async function reduceLpPosition(params: ReduceLPPositionRequest): Promise<ReduceLPPositionResponse> {
  return await TradingApiClient.post<ReduceLPPositionResponse>(uniswapUrls.tradingApiPaths.reduceLp, {
    body: JSON.stringify({
      ...params,
      includeGasInfo: true,
    }),
  })
}
