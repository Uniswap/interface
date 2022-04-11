import { Trade as RouterSDKTrade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Route as V2RouteSDK } from '@uniswap/v2-sdk'
import { Route as V3RouteSDK } from '@uniswap/v3-sdk'
import { useMemo } from 'react'
import { useRouterQuote } from 'src/features/routing/hooks'
import { QuoteResult } from 'src/features/routing/types'
import { transformQuoteToTrade } from 'src/features/transactions/swap/routeUtils'
import { useDebounceWithStatus } from 'src/utils/timing'

// TODO: use composition instead of inheritance
export class Trade<
  TInput extends Currency = Currency,
  TOutput extends Currency = Currency,
  TTradeType extends TradeType = TradeType
> extends RouterSDKTrade<TInput, TOutput, TTradeType> {
  quote?: QuoteResult

  constructor({
    quote,
    ...routes
  }: {
    quote?: QuoteResult
    v2Routes: {
      routev2: V2RouteSDK<TInput, TOutput>
      inputAmount: CurrencyAmount<TInput>
      outputAmount: CurrencyAmount<TOutput>
    }[]
    v3Routes: {
      routev3: V3RouteSDK<TInput, TOutput>
      inputAmount: CurrencyAmount<TInput>
      outputAmount: CurrencyAmount<TOutput>
    }[]
    tradeType: TTradeType
  }) {
    super(routes)
    this.quote = quote
  }
}

export function useTrade(
  amountSpecified: CurrencyAmount<Currency> | null | undefined,
  otherCurrency: Currency | null | undefined,
  tradeType: TradeType
) {
  const [debouncedAmountSpecified, isDebouncing] = useDebounceWithStatus(amountSpecified)

  const {
    isLoading,
    error,
    currentData: data,
  } = useRouterQuote({
    amountSpecified: debouncedAmountSpecified,
    otherCurrency,
    tradeType,
  })

  const currencyIn =
    tradeType === TradeType.EXACT_INPUT ? debouncedAmountSpecified?.currency : otherCurrency
  const currencyOut =
    tradeType === TradeType.EXACT_OUTPUT ? debouncedAmountSpecified?.currency : otherCurrency

  return useMemo(() => {
    if (!currencyIn || !currencyOut || !data) {
      return { loading: isLoading, error, trade: null }
    }

    return {
      loading: isDebouncing || isLoading,
      error,
      trade: transformQuoteToTrade(currencyIn, currencyOut, tradeType, data),
    }
  }, [currencyIn, currencyOut, data, isDebouncing, isLoading, error, tradeType])
}
