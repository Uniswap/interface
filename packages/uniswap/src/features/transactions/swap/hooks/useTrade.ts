import { Currency } from '@uniswap/sdk-core'
import { useEffect, useMemo, useRef } from 'react'
import { FetchError } from 'uniswap/src/data/apiClients/FetchError'
import { QuoteWithTradeAndGasEstimate } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiQuoteQuery'
import { useIndicativeTrade } from 'uniswap/src/features/transactions/swap/hooks/useIndicativeTrade'
import { GetQuoteRequestResult } from 'uniswap/src/features/transactions/swap/hooks/useTrade/createGetQuoteRequestArgs'
import { determineSwapCurrenciesAndStaticArgs } from 'uniswap/src/features/transactions/swap/hooks/useTrade/determineSwapCurrenciesAndStaticArgs'
import { useIndicativeTradeQuery } from 'uniswap/src/features/transactions/swap/hooks/useTrade/useIndicativeTradeQuery'
import { useQuoteRequestArgs } from 'uniswap/src/features/transactions/swap/hooks/useTrade/useQuoteRequestArgs'
import { useTradeQuery } from 'uniswap/src/features/transactions/swap/hooks/useTrade/useTradeQuery'
import { TradeWithStatus, UseTradeArgs } from 'uniswap/src/features/transactions/swap/types/trade'
import { logger } from 'utilities/src/logger/logger'
import { isMobileApp } from 'utilities/src/platform'

// error strings hardcoded in @uniswap/unified-routing-api
// https://github.com/Uniswap/unified-routing-api/blob/020ea371a00d4cc25ce9f9906479b00a43c65f2c/lib/util/errors.ts#L4
export const SWAP_QUOTE_ERROR = 'QUOTE_ERROR'

export const API_RATE_LIMIT_ERROR = 'TOO_MANY_REQUESTS'

export function useTrade(params: UseTradeArgs): TradeWithStatus {
  const quoteRequestArgs = useQuoteRequestArgs(params)
  const response = useTradeQuery({ ...params, quoteRequestArgs })
  const { error, data, isLoading: queryIsLoading, isFetching } = response
  const isLoading = (params.amountSpecified && params.isDebouncing) || queryIsLoading
  const indicative = useIndicativeTradeQuery({ ...params, quoteRequestArgs })
  const { currencyIn, currencyOut } = determineSwapCurrenciesAndStaticArgs(params)

  useErrorSideEffectsEffect({ error, data, quoteRequestArgs, isUSDQuote: params.isUSDQuote })

  return useMemo(() => {
    return parseTradeResult({
      data,
      currencyIn,
      currencyOut,
      isLoading,
      isFetching,
      indicative,
      error,
      isDebouncing: params.isDebouncing,
    })
  }, [currencyIn, currencyOut, data, error, indicative, isFetching, isLoading, params.isDebouncing])
}

function useErrorSideEffectsEffect(input: {
  error: Error | null
  data?: QuoteWithTradeAndGasEstimate
  quoteRequestArgs?: GetQuoteRequestResult
  isUSDQuote?: boolean
}): void {
  const { error, data, quoteRequestArgs, isUSDQuote } = input
  // Use refs to track previous state
  const prevErrorRef = useRef(error)
  const prevDataRef = useRef(data)

  useEffect(() => {
    // Only handle error side effects if error or data changed
    if (prevErrorRef.current !== error || prevDataRef.current !== data) {
      handleErrorSideEffects({
        error,
        data,
        quoteRequestArgs,
        isUSDQuote,
      })

      // Update refs
      prevErrorRef.current = error
      prevDataRef.current = data
    }
  }, [error, data, quoteRequestArgs, isUSDQuote])
}

function handleErrorSideEffects(input: {
  error: Error | null
  data?: QuoteWithTradeAndGasEstimate
  quoteRequestArgs?: GetQuoteRequestResult
  isUSDQuote?: boolean
}): void {
  const { error, data, quoteRequestArgs, isUSDQuote } = input
  // Error logging
  // We use DataDog to catch network errors on Mobile
  if (error && (!isMobileApp || !(error instanceof FetchError)) && !isUSDQuote) {
    logger.error(error, { tags: { file: 'useTrade', function: 'quote' }, extra: { ...quoteRequestArgs } })
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (data && !data.quote) {
    logger.error(new Error('Unexpected empty Trading API response'), {
      tags: { file: 'useTrade', function: 'quote' },
      extra: {
        quoteRequestArgs,
      },
    })
  }
}

function parseTradeResult(input: {
  data?: QuoteWithTradeAndGasEstimate
  currencyIn?: Currency
  currencyOut?: Currency
  isLoading: boolean
  isFetching: boolean
  indicative: ReturnType<typeof useIndicativeTrade>
  error: Error | null
  isDebouncing?: boolean
}): TradeWithStatus {
  const { data, currencyIn, currencyOut, isLoading, isFetching, indicative, error, isDebouncing } = input
  if (!data?.trade || !currencyIn || !currencyOut) {
    return {
      isLoading: Boolean(isLoading || isDebouncing),
      isFetching,
      trade: null,
      indicativeTrade: isLoading ? indicative.trade : undefined,
      isIndicativeLoading: indicative.isLoading,
      error,
      gasEstimate: data?.gasEstimate,
    }
  }

  // If `transformTradingApiResponseToTrade` returns a `null` trade, it means we have a non-null quote, but no routes.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (data.trade === null) {
    return {
      isLoading,
      isFetching,
      trade: null,
      indicativeTrade: undefined, // We don't want to show the indicative trade if there is no completable trade
      isIndicativeLoading: false,
      error: new Error('Unable to validate trade'),
      gasEstimate: data.gasEstimate,
    }
  }

  return {
    isLoading: isDebouncing || isLoading,
    isFetching,
    trade: data.trade,
    indicativeTrade: indicative.trade,
    isIndicativeLoading: indicative.isLoading,
    error,
    gasEstimate: data.gasEstimate,
  }
}
