import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { parseQuoteCurrencies } from 'uniswap/src/features/transactions/swap/hooks/useTrade/parseQuoteCurrencies'
import { useIndicativeTradeQuery } from 'uniswap/src/features/transactions/swap/hooks/useTrade/useIndicativeTradeQuery'
import { useTradeQuery } from 'uniswap/src/features/transactions/swap/hooks/useTrade/useTradeQuery'
import type { TradeWithGasEstimates } from 'uniswap/src/features/transactions/swap/services/tradeService/tradeService'
import { TradeWithStatus, UseTradeArgs } from 'uniswap/src/features/transactions/swap/types/trade'

// error strings hardcoded in @uniswap/unified-routing-api
// https://github.com/Uniswap/unified-routing-api/blob/020ea371a00d4cc25ce9f9906479b00a43c65f2c/lib/util/errors.ts#L4
export const SWAP_QUOTE_ERROR = 'QUOTE_ERROR'

export const API_RATE_LIMIT_ERROR = 'TOO_MANY_REQUESTS'

export function useTrade(params: UseTradeArgs): TradeWithStatus {
  const { error, data, isLoading: queryIsLoading, isFetching } = useTradeQuery(params)
  const isLoading = (params.amountSpecified && params.isDebouncing) || queryIsLoading
  const indicative = useIndicativeTradeQuery(params)
  const { currencyIn, currencyOut } = parseQuoteCurrencies(params)

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

function parseTradeResult(input: {
  data?: TradeWithGasEstimates
  currencyIn?: Currency
  currencyOut?: Currency
  isLoading: boolean
  isFetching: boolean
  indicative: ReturnType<typeof useIndicativeTradeQuery>
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
      quoteHash: data?.quoteHash,
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
      quoteHash: data.quoteHash,
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
    quoteHash: data.quoteHash,
  }
}
