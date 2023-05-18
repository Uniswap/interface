import { skipToken } from '@reduxjs/toolkit/query/react'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { IMetric, MetricLoggerUnit, setGlobalMetric } from '@uniswap/smart-order-router'
import { sendTiming } from 'components/analytics'
import { AVERAGE_L1_BLOCK_TIME } from 'constants/chainInfo'
import { useRoutingAPIArguments } from 'lib/hooks/routing/useRoutingAPIArguments'
import ms from 'ms.macro'
import { useMemo } from 'react'
import { INTERNAL_ROUTER_PREFERENCE_PRICE, RouterPreference, useGetQuoteQuery } from 'state/routing/slice'

import { InterfaceTrade, QuoteState, TradeState } from './types'

const TRADE_INVALID = { state: TradeState.INVALID, trade: undefined } as const
const TRADE_NOT_FOUND = { state: TradeState.NO_ROUTE_FOUND, trade: undefined } as const
const TRADE_LOADING = { state: TradeState.LOADING, trade: undefined } as const

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
  routerPreference: RouterPreference | typeof INTERNAL_ROUTER_PREFERENCE_PRICE
): {
  state: TradeState
  trade?: InterfaceTrade
} {
  const [currencyIn, currencyOut]: [Currency | undefined, Currency | undefined] = useMemo(
    () =>
      tradeType === TradeType.EXACT_INPUT
        ? [amountSpecified?.currency, otherCurrency]
        : [otherCurrency, amountSpecified?.currency],
    [amountSpecified, otherCurrency, tradeType]
  )

  const queryArgs = useRoutingAPIArguments({
    tokenIn: currencyIn,
    tokenOut: currencyOut,
    amount: amountSpecified,
    tradeType,
    routerPreference,
  })

  const {
    isError,
    data: tradeResult,
    currentData: currentTradeResult,
  } = useGetQuoteQuery(queryArgs ?? skipToken, {
    // Price-fetching is informational and costly, so it's done less frequently.
    pollingInterval: routerPreference === INTERNAL_ROUTER_PREFERENCE_PRICE ? ms`1m` : AVERAGE_L1_BLOCK_TIME,
    // If latest quote from cache was fetched > 2m ago, instantly repoll for another instead of waiting for next poll period
    refetchOnMountOrArgChange: 2 * 60,
  })

  const isCurrent = currentTradeResult === tradeResult

  return useMemo(() => {
    if (!amountSpecified || isError || !queryArgs) {
      return TRADE_INVALID
    } else if (tradeResult?.state === QuoteState.NOT_FOUND && isCurrent) {
      return TRADE_NOT_FOUND
    } else if (!tradeResult?.trade) {
      // TODO(WEB-3307): use `isLoading` returned by rtk-query hook instead of checking for `trade` status
      return TRADE_LOADING
    } else {
      return {
        state: isCurrent ? TradeState.VALID : TradeState.LOADING,
        trade: tradeResult.trade,
      }
    }
  }, [amountSpecified, isCurrent, isError, queryArgs, tradeResult])
}

// only want to enable this when app hook called
class GAMetric extends IMetric {
  putDimensions() {
    return
  }

  putMetric(key: string, value: number, unit?: MetricLoggerUnit) {
    sendTiming('Routing API', `${key} | ${unit}`, value, 'client')
  }
}

setGlobalMetric(new GAMetric())
