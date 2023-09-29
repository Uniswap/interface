import { skipToken } from '@reduxjs/toolkit/query/react'
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { AVERAGE_L1_BLOCK_TIME } from 'constants/chainInfo'
import { ZERO_PERCENT } from 'constants/misc'
import { useRoutingAPIArguments } from 'lib/hooks/routing/useRoutingAPIArguments'
import ms from 'ms'
import { useMemo } from 'react'

import { useGetQuoteQuery, useGetQuoteQueryState } from './slice'
import {
  ClassicTrade,
  INTERNAL_ROUTER_PREFERENCE_PRICE,
  QuoteMethod,
  QuoteState,
  RouterPreference,
  SubmittableTrade,
  TradeState,
} from './types'

const TRADE_NOT_FOUND = { state: TradeState.NO_ROUTE_FOUND, trade: undefined, currentData: undefined } as const
const TRADE_LOADING = { state: TradeState.LOADING, trade: undefined, currentData: undefined } as const

export function useRoutingAPITrade<TTradeType extends TradeType>(
  skipFetch: boolean,
  tradeType: TTradeType,
  amountSpecified: CurrencyAmount<Currency> | undefined,
  otherCurrency: Currency | undefined,
  routerPreference: typeof INTERNAL_ROUTER_PREFERENCE_PRICE,
  account?: string,
  inputTax?: Percent,
  outputTax?: Percent
): {
  state: TradeState
  trade?: ClassicTrade
  currentTrade?: ClassicTrade
  swapQuoteLatency?: number
}

export function useRoutingAPITrade<TTradeType extends TradeType>(
  skipFetch: boolean,
  tradeType: TTradeType,
  amountSpecified: CurrencyAmount<Currency> | undefined,
  otherCurrency: Currency | undefined,
  routerPreference: RouterPreference,
  account?: string,
  inputTax?: Percent,
  outputTax?: Percent
): {
  state: TradeState
  trade?: SubmittableTrade
  currentTrade?: SubmittableTrade
  swapQuoteLatency?: number
}

/**
 * Returns the best trade by invoking the routing api or the smart order router on the client
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 */
export function useRoutingAPITrade<TTradeType extends TradeType>(
  skipFetch = false,
  tradeType: TTradeType,
  amountSpecified: CurrencyAmount<Currency> | undefined,
  otherCurrency: Currency | undefined,
  routerPreference: RouterPreference | typeof INTERNAL_ROUTER_PREFERENCE_PRICE,
  account?: string,
  inputTax = ZERO_PERCENT,
  outputTax = ZERO_PERCENT
): {
  state: TradeState
  trade?: SubmittableTrade
  currentTrade?: SubmittableTrade
  method?: QuoteMethod
  swapQuoteLatency?: number
} {
  const [currencyIn, currencyOut]: [Currency | undefined, Currency | undefined] = useMemo(
    () =>
      tradeType === TradeType.EXACT_INPUT
        ? [amountSpecified?.currency, otherCurrency]
        : [otherCurrency, amountSpecified?.currency],
    [amountSpecified, otherCurrency, tradeType]
  )

  const queryArgs = useRoutingAPIArguments({
    account,
    tokenIn: currencyIn,
    tokenOut: currencyOut,
    amount: amountSpecified,
    tradeType,
    routerPreference,
    inputTax,
    outputTax,
  })

  const { isError, data: tradeResult, error, currentData } = useGetQuoteQueryState(queryArgs)
  useGetQuoteQuery(skipFetch ? skipToken : queryArgs, {
    // Price-fetching is informational and costly, so it's done less frequently.
    pollingInterval: routerPreference === INTERNAL_ROUTER_PREFERENCE_PRICE ? ms(`1m`) : AVERAGE_L1_BLOCK_TIME,
    // If latest quote from cache was fetched > 2m ago, instantly repoll for another instead of waiting for next poll period
    refetchOnMountOrArgChange: 2 * 60,
  })

  const isFetching = currentData !== tradeResult || !currentData

  return useMemo(() => {
    if (amountSpecified && queryArgs === skipToken) {
      return {
        state: TradeState.STALE,
        trade: tradeResult?.trade,
        currentTrade: currentData?.trade,
        swapQuoteLatency: tradeResult?.latencyMs,
      }
    } else if (!amountSpecified || isError || queryArgs === skipToken) {
      return {
        state: TradeState.INVALID,
        trade: undefined,
        currentTrade: currentData?.trade,
        error: JSON.stringify(error),
      }
    } else if (tradeResult?.state === QuoteState.NOT_FOUND && !isFetching) {
      return TRADE_NOT_FOUND
    } else if (!tradeResult?.trade) {
      return TRADE_LOADING
    } else {
      return {
        state: isFetching ? TradeState.LOADING : TradeState.VALID,
        trade: tradeResult?.trade,
        currentTrade: currentData?.trade,
        swapQuoteLatency: tradeResult?.latencyMs,
      }
    }
  }, [
    amountSpecified,
    error,
    isError,
    isFetching,
    queryArgs,
    tradeResult?.latencyMs,
    tradeResult?.state,
    tradeResult?.trade,
    currentData?.trade,
  ])
}
