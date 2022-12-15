import { SerializedError } from '@reduxjs/toolkit'
import { FetchBaseQueryError } from '@reduxjs/toolkit/dist/query'
import { MixedRouteSDK, Trade as RouterSDKTrade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Route as V2RouteSDK } from '@uniswap/v2-sdk'
import { Route as V3RouteSDK } from '@uniswap/v3-sdk'
import { useMemo } from 'react'
import { PollingInterval } from 'src/constants/misc'
import { useRouterQuote } from 'src/features/routing/hooks'
import { QuoteResult } from 'src/features/routing/types'
import { clearStaleTrades } from 'src/features/transactions/swap/utils'
import { useDebounceWithStatus } from 'src/utils/timing'

// TODO: [MOB-3906] use composition instead of inheritance
export class Trade<
  TInput extends Currency = Currency,
  TOutput extends Currency = Currency,
  TTradeType extends TradeType = TradeType
> extends RouterSDKTrade<TInput, TOutput, TTradeType> {
  quote?: QuoteResult
  deadline?: number
  slippageTolerance?: number

  constructor({
    quote,
    deadline,
    slippageTolerance,
    ...routes
  }: {
    quote?: QuoteResult
    deadline?: number
    slippageTolerance?: number
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
    mixedRoutes: {
      mixedRoute: MixedRouteSDK<TInput, TOutput>
      inputAmount: CurrencyAmount<TInput>
      outputAmount: CurrencyAmount<TOutput>
    }[]
    tradeType: TTradeType
  }) {
    super(routes)
    this.quote = quote
    this.deadline = deadline
    this.slippageTolerance = slippageTolerance
  }
}

interface TradeWithStatus {
  loading: boolean
  error?: FetchBaseQueryError | SerializedError
  trade: null | Trade<Currency, Currency, TradeType>
  isFetching?: boolean
}

export function useTrade(
  amountSpecified: CurrencyAmount<Currency> | null | undefined,
  otherCurrency: Currency | null | undefined,
  tradeType: TradeType,
  pollingInterval?: PollingInterval
): TradeWithStatus {
  const [debouncedAmountSpecified, isDebouncing] = useDebounceWithStatus(amountSpecified)

  // if user clears input (amountSpecified is null or undefined), immediately use that
  // instead of the debounced value so that there's no lingering loading state on empty inputs
  const amount = !amountSpecified ? amountSpecified : debouncedAmountSpecified

  const { isLoading, isFetching, error, data } = useRouterQuote({
    amountSpecified: amount,
    otherCurrency,
    tradeType,
    pollingInterval,
  })

  return useMemo(() => {
    if (!data?.trade) return { loading: isLoading, error, trade: null }

    const [currencyIn, currencyOut] =
      tradeType === TradeType.EXACT_INPUT
        ? [amount?.currency, otherCurrency]
        : [otherCurrency, amount?.currency]

    const trade = clearStaleTrades(data.trade, currencyIn, currencyOut)

    return {
      loading: (amountSpecified && isDebouncing) || isLoading,
      isFetching,
      error,
      trade,
    }
  }, [
    data?.trade,
    isLoading,
    error,
    tradeType,
    amount?.currency,
    otherCurrency,
    amountSpecified,
    isDebouncing,
    isFetching,
  ])
}
