import { skipToken } from '@reduxjs/toolkit/query/react'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { IMetric, MetricLoggerUnit, setGlobalMetric } from '@uniswap/smart-order-router'
import { sendTiming } from 'components/analytics'
import { AVERAGE_L1_BLOCK_TIME } from 'constants/chainInfo'
import { useStablecoinAmountFromFiatValue } from 'hooks/useStablecoinPrice'
import { useRoutingAPIArguments } from 'lib/hooks/routing/useRoutingAPIArguments'
import useBlockNumber from 'lib/hooks/useBlockNumber'
import useIsValidBlock from 'lib/hooks/useIsValidBlock'
import ms from 'ms.macro'
import { useMemo } from 'react'
import { RouterPreference, useGetQuoteQuery } from 'state/routing/slice'

import { GetQuoteResult, InterfaceFloodTrade, InterfaceTrade, TradeState } from './types'
import { FloodQuoteResult, isFloodQuote, useFloodAPI } from './useFloodAPI'
import { computeRoutes, transformRoutesToTrade } from './utils'
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
  routerPreference: RouterPreference
): {
  state: TradeState
  trade:
    | InterfaceTrade<Currency, Currency, TTradeType>
    | InterfaceFloodTrade<Currency, Currency, TTradeType>
    | undefined
  uniswapQuote: GetQuoteResult | undefined
  floodQuote: FloodQuoteResult | undefined
  isUsingFlood: boolean
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

  const uniswapQuery = useGetQuoteQuery(queryArgs ?? skipToken, {
    // Price-fetching is informational and costly, so it's done less frequently.
    pollingInterval: routerPreference === RouterPreference.PRICE ? ms`2m` : AVERAGE_L1_BLOCK_TIME,
  })
  const shouldUseFlood = routerPreference === RouterPreference.API && tradeType === TradeType.EXACT_INPUT
  const floodQuery = useFloodAPI(
    currencyIn?.wrapped.address,
    currencyOut?.wrapped.address,
    amountSpecified?.quotient.toString(),
    currencyIn?.chainId,
    shouldUseFlood,
    routerPreference === RouterPreference.PRICE ? ms`2m` : AVERAGE_L1_BLOCK_TIME
  )

  const isLoading = uniswapQuery.isLoading || floodQuery.isLoading
  const isError = uniswapQuery.isError && floodQuery.isError
  const isUniswapSyncing = uniswapQuery.currentData !== uniswapQuery.data
  const isFloodSyncing = floodQuery.isPreviousData
  const data = floodQuery.data ?? uniswapQuery.data
  const isUsingFlood = isFloodQuote(data)
  const currentBlock = useBlockNumber()
  const isValidBlock = useIsValidBlock(Number(data?.blockNumber) || 0)
  const quoteResult = isValidBlock ? data : undefined

  const route = useMemo(
    () => computeRoutes(currencyIn, currencyOut, tradeType, quoteResult, isUsingFlood),
    [currencyIn, currencyOut, isUsingFlood, quoteResult, tradeType]
  )

  // get USD gas cost of trade in active chains stablecoin amount
  const gasUseEstimateUSD =
    useStablecoinAmountFromFiatValue(
      isUsingFlood ? undefined : (quoteResult as unknown as GetQuoteResult)?.gasUseEstimateUSD
    ) ?? null

  const isSyncing = isFloodSyncing || isUniswapSyncing

  return useMemo(() => {
    if (!currencyIn || !currencyOut) {
      return {
        state: TradeState.INVALID,
        trade: undefined,
        uniswapQuote: undefined,
        floodQuote: undefined,
        isUsingFlood: false,
      }
    }

    if (isLoading && !quoteResult) {
      // only on first hook render
      return {
        state: TradeState.LOADING,
        trade: undefined,
        uniswapQuote: undefined,
        floodQuote: undefined,
        isUsingFlood,
      }
    }

    let otherAmount = undefined
    if (quoteResult) {
      if (tradeType === TradeType.EXACT_INPUT && currencyOut) {
        otherAmount = CurrencyAmount.fromRawAmount(currencyOut, quoteResult.quote)
      }

      if (tradeType === TradeType.EXACT_OUTPUT && currencyIn) {
        otherAmount = CurrencyAmount.fromRawAmount(currencyIn, quoteResult.quote)
      }
    }

    if (isError || !otherAmount || !route || route.length === 0 || !queryArgs) {
      return {
        state: TradeState.NO_ROUTE_FOUND,
        trade: undefined,
        uniswapQuote: undefined,
        floodQuote: undefined,
        isUsingFlood,
      }
    }

    try {
      const trade = transformRoutesToTrade(route, tradeType, quoteResult?.blockNumber, gasUseEstimateUSD, isUsingFlood)
      return {
        // always return VALID regardless of isFetching status
        state: TradeState.VALID,
        trade,
        uniswapQuote: uniswapQuery.data,
        floodQuote: floodQuery.data,
        isUsingFlood,
      }
    } catch (e) {
      return {
        state: TradeState.INVALID,
        trade: undefined,
        uniswapQuote: undefined,
        floodQuote: undefined,
        isUsingFlood: false,
      }
    }
  }, [
    currencyIn,
    currencyOut,
    isLoading,
    quoteResult,
    isError,
    route,
    queryArgs,
    tradeType,
    gasUseEstimateUSD,
    isUsingFlood,
    uniswapQuery.data,
    floodQuery.data,
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
}

setGlobalMetric(new GAMetric())
