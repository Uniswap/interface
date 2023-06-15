import { skipToken } from '@reduxjs/toolkit/query/react'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { IMetric, MetricLoggerUnit, setGlobalMetric } from '@uniswap/smart-order-router'
import { sendTiming } from 'components/analytics'
import { AVERAGE_L1_BLOCK_TIME } from 'constants/chainInfo'
import { useRoutingAPIV2Enabled } from 'featureFlags/flags/unifiedRouter'
import { useRoutingAPIArguments } from 'lib/hooks/routing/useRoutingAPIArguments'
import ms from 'ms.macro'
import { useMemo } from 'react'
import { INTERNAL_ROUTER_PREFERENCE_PRICE, RouterPreference, useGetQuoteQuery } from 'state/routing/slice'
import { useGetQuoteQuery as useGetQuoteQueryV2 } from 'state/routing/v2Slice'

import { InterfaceTrade, QuoteState, TradeState } from './types'

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
  routerPreference: RouterPreference | typeof INTERNAL_ROUTER_PREFERENCE_PRICE,
  skipFetch = false
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
    amount: skipFetch ? undefined : amountSpecified,
    tradeType,
    routerPreference,
  })

  const shouldUseRoutingApiV2 = useRoutingAPIV2Enabled()

  const {
    isError: isLegacyAPIError,
    data: legacyAPITradeResult,
    currentData: currentLegacyAPITradeResult,
  } = useGetQuoteQuery(shouldUseRoutingApiV2 ? skipToken : queryArgs ?? skipToken, {
    // Price-fetching is informational and costly, so it's done less frequently.
    pollingInterval: routerPreference === INTERNAL_ROUTER_PREFERENCE_PRICE ? ms`1m` : AVERAGE_L1_BLOCK_TIME,
    // If latest quote from cache was fetched > 2m ago, instantly repoll for another instead of waiting for next poll period
    refetchOnMountOrArgChange: 2 * 60,
  })

  const {
    isError: isV2APIError,
    data: v2TradeResult,
    currentData: currentV2TradeResult,
  } = useGetQuoteQueryV2(!shouldUseRoutingApiV2 ? skipToken : queryArgs ?? skipToken, {
    // Price-fetching is informational and costly, so it's done less frequently.
    pollingInterval: routerPreference === INTERNAL_ROUTER_PREFERENCE_PRICE ? ms`1m` : AVERAGE_L1_BLOCK_TIME,
    // If latest quote from cache was fetched > 2m ago, instantly repoll for another instead of waiting for next poll period
    refetchOnMountOrArgChange: 2 * 60,
  })

  const [tradeResult, currentTradeResult, isError] = shouldUseRoutingApiV2
    ? [v2TradeResult, currentV2TradeResult, isV2APIError]
    : [legacyAPITradeResult, currentLegacyAPITradeResult, isLegacyAPIError]

  const isCurrent = currentTradeResult === tradeResult

  return useMemo(() => {
    if (skipFetch && amountSpecified) {
      // If we don't want to fetch new trades, but have valid inputs, return the stale trade.
      return { state: TradeState.STALE, trade: tradeResult?.trade }
    } else if (!amountSpecified || isError || !queryArgs) {
      return { state: TradeState.INVALID, trade: undefined }
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
  }, [amountSpecified, isCurrent, isError, queryArgs, skipFetch, tradeResult?.state, tradeResult?.trade])
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
