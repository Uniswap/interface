import { skipToken } from '@reduxjs/toolkit/query/react'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { IMetric, MetricLoggerUnit, setGlobalMetric } from '@uniswap/smart-order-router'
import { sendTiming } from 'components/analytics'
import { AVERAGE_L1_BLOCK_TIME } from 'constants/chainInfo'
import { useRoutingAPIArguments } from 'lib/hooks/routing/useRoutingAPIArguments'
import ms from 'ms'
import { useMemo } from 'react'

import { useGetQuoteQuery } from './slice'
import {
  ClassicTrade,
  InterfaceTrade,
  INTERNAL_ROUTER_PREFERENCE_PRICE,
  QuoteMethod,
  QuoteState,
  RouterPreference,
  TradeState,
} from './types'

const TRADE_NOT_FOUND = { state: TradeState.NO_ROUTE_FOUND, trade: undefined } as const
const TRADE_LOADING = { state: TradeState.LOADING, trade: undefined } as const

export function useRoutingAPITrade<TTradeType extends TradeType>(
  tradeType: TTradeType,
  amountSpecified: CurrencyAmount<Currency> | undefined,
  otherCurrency: Currency | undefined,
  routerPreference: typeof INTERNAL_ROUTER_PREFERENCE_PRICE,
  skipFetch?: boolean,
  account?: string
): {
  state: TradeState
  trade?: ClassicTrade
  swapQuoteLatency?: number
}

export function useRoutingAPITrade<TTradeType extends TradeType>(
  tradeType: TTradeType,
  amountSpecified: CurrencyAmount<Currency> | undefined,
  otherCurrency: Currency | undefined,
  routerPreference: RouterPreference,
  skipFetch?: boolean,
  account?: string
): {
  state: TradeState
  trade?: InterfaceTrade
  swapQuoteLatency?: number
}

/**
 * Returns the best trade by invoking the routing api or the smart order router on the client
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 */
export function useRoutingAPITrade<TTradeType extends TradeType>(
  tradeType: TTradeType,
  amountSpecified: CurrencyAmount<Currency> | undefined,
  otherCurrency: Currency | undefined,
  routerPreference: RouterPreference | typeof INTERNAL_ROUTER_PREFERENCE_PRICE,
  skipFetch = false,
  account?: string
): {
  state: TradeState
  trade?: InterfaceTrade
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
    amount: skipFetch ? undefined : amountSpecified,
    tradeType,
    routerPreference,
  })

  const {
    isError,
    data: tradeResult,
    error,
    currentData: currentTradeResult,
  } = useGetQuoteQuery(queryArgs ?? skipToken, {
    // Price-fetching is informational and costly, so it's done less frequently.
    pollingInterval: routerPreference === INTERNAL_ROUTER_PREFERENCE_PRICE ? ms(`1m`) : AVERAGE_L1_BLOCK_TIME,
    // If latest quote from cache was fetched > 2m ago, instantly repoll for another instead of waiting for next poll period
    refetchOnMountOrArgChange: 2 * 60,
  })
  const isCurrent = currentTradeResult === tradeResult

  return useMemo(() => {
    if (skipFetch && amountSpecified) {
      // If we don't want to fetch new trades, but have valid inputs, return the stale trade.
      return { state: TradeState.STALE, trade: tradeResult?.trade, swapQuoteLatency: tradeResult?.latencyMs }
    } else if (!amountSpecified || isError || !queryArgs) {
      return {
        state: TradeState.INVALID,
        trade: undefined,
        error: JSON.stringify(error),
      }
    } else if (tradeResult?.state === QuoteState.NOT_FOUND && isCurrent) {
      return TRADE_NOT_FOUND
    } else if (!tradeResult?.trade) {
      // TODO(WEB-1985): use `isLoading` returned by rtk-query hook instead of checking for `trade` status
      return TRADE_LOADING
    } else {
      return {
        state: isCurrent ? TradeState.VALID : TradeState.LOADING,
        trade: tradeResult.trade,
        swapQuoteLatency: tradeResult.latencyMs,
      }
    }
  }, [
    amountSpecified,
    error,
    isCurrent,
    isError,
    queryArgs,
    skipFetch,
    tradeResult?.state,
    tradeResult?.latencyMs,
    tradeResult?.trade,
  ])
}

// only want to enable this when app hook called
class GAMetric extends IMetric {
  putDimensions() {
    return
  }

  putMetric(key: string, value: number, unit?: MetricLoggerUnit) {
    sendTiming('Routing API', `${key} | ${unit}`, value, 'client')
  }

  setProperty() {
    return
  }
}

setGlobalMetric(new GAMetric())
