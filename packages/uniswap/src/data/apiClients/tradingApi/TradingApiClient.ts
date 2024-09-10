import { config } from 'uniswap/src/config'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'
import {
  ClassicQuote,
  CreateSwapRequest,
  CreateSwapResponse,
  DutchQuoteV2,
  QuoteRequest,
  QuoteResponse,
  Routing,
} from 'uniswap/src/data/tradingApi/__generated__'

// TradingAPI team is looking into updating type generation to produce the following types for it's current QuoteResponse type:
// See: https://linear.app/uniswap/issue/API-236/explore-changing-the-quote-schema-to-pull-out-a-basequoteresponse
export type DiscriminatedQuoteResponse = ClassicQuoteResponse | DutchQuoteResponse

export type DutchQuoteResponse = QuoteResponse & {
  quote: DutchQuoteV2
  routing: Routing.DUTCH_V2
}

export type ClassicQuoteResponse = QuoteResponse & {
  quote: ClassicQuote
  routing: Routing.CLASSIC
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

export async function fetchSwap(params: CreateSwapRequest): Promise<CreateSwapResponse> {
  return await TradingApiClient.post<CreateSwapResponse>(uniswapUrls.tradingApiPaths.swap, {
    body: JSON.stringify(params),
  })
}
