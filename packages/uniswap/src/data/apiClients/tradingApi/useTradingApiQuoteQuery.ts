import { queryOptions } from '@tanstack/react-query'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { DiscriminatedQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { QuoteRequest } from 'uniswap/src/data/tradingApi/__generated__'
import { GasEstimate } from 'uniswap/src/data/tradingApi/types'
import { DetermineSwapCurrenciesAndStaticArgsOutput } from 'uniswap/src/features/transactions/swap/hooks/useTrade/determineSwapCurrenciesAndStaticArgs'
import { QuoteRepository } from 'uniswap/src/features/transactions/swap/services/tradeService/quoteRepository'
import {
  transformTradingApiResponseToTrade,
  validateTrade,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { type Logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { inXMinutesUnix } from 'utilities/src/time/time'

type QueryFnData = DiscriminatedQuoteResponse | null

export type QuoteWithTradeAndGasEstimate =
  | (DiscriminatedQuoteResponse & {
      gasEstimate: GasEstimate | undefined
      trade: NonNullable<ReturnType<typeof validateTrade>> | null
    })
  | null

export type TradingApiQuoteQueryOptions = QueryOptionsResult<
  QueryFnData,
  Error,
  QuoteWithTradeAndGasEstimate,
  [ReactQueryCacheKey.TradingApi, string, (QuoteRequest & { isUSDQuote?: boolean }) | undefined]
>

const DEFAULT_SWAP_VALIDITY_TIME_MINS = 30

export type GetTradingApiQuoteQueryOptions = (params?: QuoteRequest) => TradingApiQuoteQueryOptions

export function createGetTradingApiQuoteQueryOptions(ctx: {
  select: (data: DiscriminatedQuoteResponse | null) => QuoteWithTradeAndGasEstimate
  quoteRepository: QuoteRepository
  logger?: Logger
}): GetTradingApiQuoteQueryOptions {
  const getTradingApiQuoteQueryOptions = (params?: QuoteRequest): TradingApiQuoteQueryOptions => {
    return queryOptions({
      queryKey: [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.quote, params],
      queryFn: async (): Promise<DiscriminatedQuoteResponse | null> => {
        if (!params) {
          return null
        }
        return ctx.quoteRepository.fetchQuote(params)
      },
      enabled: !!params,
      select: ctx.select,
    })
  }

  return getTradingApiQuoteQueryOptions
}

function getGasEstimate(data: DiscriminatedQuoteResponse | null): GasEstimate | undefined {
  let gasEstimate: GasEstimate | undefined
  if (data?.quote && 'gasEstimates' in data.quote && data.quote.gasEstimates) {
    // Only classic quotes include gasEstimates
    gasEstimate = data.quote.gasEstimates[0]
  }
  return gasEstimate
}

export function getTransformQuoteToTrade(ctx: {
  getDerivedParamData: () => DetermineSwapCurrenciesAndStaticArgsOutput
  getAmountSpecified: () => Maybe<CurrencyAmount<Currency>>
}): (data: DiscriminatedQuoteResponse | null) => QuoteWithTradeAndGasEstimate {
  return (data): QuoteWithTradeAndGasEstimate => {
    if (!data) {
      return null
    }

    const { currencyIn, currencyOut, requestTradeType, exactCurrencyField } = ctx.getDerivedParamData()
    const gasEstimate = getGasEstimate(data)

    const formattedTrade =
      currencyIn && currencyOut
        ? transformTradingApiResponseToTrade({
            currencyIn,
            currencyOut,
            tradeType: requestTradeType,
            deadline: inXMinutesUnix(DEFAULT_SWAP_VALIDITY_TIME_MINS), // TODO(MOB-3050): set deadline as `quoteRequestArgs.deadline`
            data,
          })
        : null

    const trade = formattedTrade
      ? validateTrade({
          trade: formattedTrade,
          currencyIn,
          currencyOut,
          exactAmount: ctx.getAmountSpecified(),
          exactCurrencyField,
        })
      : null

    return {
      ...data,
      gasEstimate,
      trade,
    }
  }
}
