import { skipToken } from '@reduxjs/toolkit/query/react'
import { ChainId, Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { AVERAGE_L1_BLOCK_TIME } from 'constants/chainInfo'
import { ZERO_PERCENT } from 'constants/misc'
import { useRoutingAPIArguments } from 'lib/hooks/routing/useRoutingAPIArguments'
import ms from 'ms'
import { useMemo } from 'react'

import { useGetQuickRouteQuery, useGetQuickRouteQueryState } from './quickRouteSlice'
import { useGetQuoteQuery, useGetQuoteQueryState } from './slice'
import { INTERNAL_ROUTER_PREFERENCE_PRICE, PreviewTrade, QuoteState, RouterPreference, TradeState } from './types'
import { currencyAddressForSwapQuote } from './utils'

const TRADE_NOT_FOUND = { state: TradeState.NO_ROUTE_FOUND, trade: undefined } as const
const TRADE_LOADING = { state: TradeState.LOADING, trade: undefined } as const

function useQuickRouteArguments({
  tokenIn,
  tokenOut,
  amount,
  tradeType,
  inputTax,
  outputTax,
}: {
  tokenIn?: Currency
  tokenOut?: Currency
  amount?: CurrencyAmount<Currency>
  tradeType: TradeType
  inputTax: Percent
  outputTax: Percent
}) {
  return useMemo(() => {
    if (!tokenIn || !tokenOut || !amount) return skipToken

    return {
      amount: amount.quotient.toString(),
      tokenInAddress: currencyAddressForSwapQuote(tokenIn),
      tokenInChainId: tokenIn.chainId,
      tokenInDecimals: tokenIn.wrapped.decimals,
      tokenInSymbol: tokenIn.wrapped.symbol,
      tokenOutAddress: currencyAddressForSwapQuote(tokenOut),
      tokenOutChainId: tokenOut.wrapped.chainId,
      tokenOutDecimals: tokenOut.wrapped.decimals,
      tokenOutSymbol: tokenOut.wrapped.symbol,
      tradeType,
      inputTax,
      outputTax,
    }
  }, [amount, inputTax, outputTax, tokenIn, tokenOut, tradeType])
}
/**
 * Returns the best trade by invoking the routing api or the smart order router on the client
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 */
function usePreviewTrade(
  tradeType: TradeType,
  amountSpecified: CurrencyAmount<Currency> | undefined,
  otherCurrency: Currency | undefined,
  skipFetch = false,
  inputTax = ZERO_PERCENT,
  outputTax = ZERO_PERCENT
): {
  state: TradeState
  trade?: PreviewTrade
  swapQuoteLatency?: number
} {
  const [currencyIn, currencyOut]: [Currency | undefined, Currency | undefined] = useMemo(
    () =>
      tradeType === TradeType.EXACT_INPUT
        ? [amountSpecified?.currency, otherCurrency]
        : [otherCurrency, amountSpecified?.currency],
    [amountSpecified, otherCurrency, tradeType]
  )

  const queryArgs = useQuickRouteArguments({
    tokenIn: currencyIn,
    tokenOut: currencyOut,
    amount: amountSpecified,
    tradeType,
    inputTax,
    outputTax,
  })

  const { isError, data: tradeResult, error, currentData } = useGetQuickRouteQueryState(queryArgs)
  useGetQuickRouteQuery(skipFetch ? skipToken : queryArgs, {
    // Price-fetching is informational and costly, so it's done less frequently.
    pollingInterval: routerPreference === INTERNAL_ROUTER_PREFERENCE_PRICE ? ms(`1m`) : AVERAGE_L1_BLOCK_TIME,
    // If latest quote from cache was fetched > 2m ago, instantly repoll for another instead of waiting for next poll period
    refetchOnMountOrArgChange: 2 * 60,
  })

  const { data } = useGetQuickRouteQueryState(queryArgs)
  const skipQuickRoute =
    routerPreference !== RouterPreference.API ||
    tradeType !== TradeType.EXACT_INPUT ||
    currencyIn?.chainId !== ChainId.MAINNET
  useGetQuickRouteQuery(skipQuickRoute ? skipToken : queryArgs, {
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
        swapQuoteLatency: tradeResult?.latencyMs,
      }
    } else if (!amountSpecified || isError || queryArgs === skipToken) {
      return {
        state: TradeState.INVALID,
        trade: undefined,
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
  ])
}
