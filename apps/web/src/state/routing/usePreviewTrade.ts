import { skipToken } from '@reduxjs/toolkit/query/react'
import { ChainId, Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { routingPreferencesAtom } from 'components/Settings/MultipleRoutingOptions'
import { ZERO_PERCENT } from 'constants/misc'
import useIsWindowVisible from 'hooks/useIsWindowVisible'
import { useAtomValue } from 'jotai/utils'
import { useMemo } from 'react'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useGetQuickRouteQuery, useGetQuickRouteQueryState } from './quickRouteSlice'
import { GetQuickQuoteArgs, PreviewTrade, QuoteState, TradeState } from './types'
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
}): GetQuickQuoteArgs | typeof skipToken {
  const enabledMainnet = useFeatureFlag(FeatureFlags.QuickRouteMainnet)
  const multipleRouteOptionsRoutingPreference = useAtomValue(routingPreferencesAtom)
  const allRoutesEnabled = multipleRouteOptionsRoutingPreference.protocols.length === 3

  return useMemo(() => {
    if (!tokenIn || !tokenOut || !amount) return skipToken
    if (!enabledMainnet || tokenIn.chainId !== ChainId.MAINNET || !allRoutesEnabled) return skipToken

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
  }, [allRoutesEnabled, amount, enabledMainnet, inputTax, outputTax, tokenIn, tokenOut, tradeType])
}

export function usePreviewTrade(
  skipFetch = false,
  tradeType: TradeType,
  amountSpecified: CurrencyAmount<Currency> | undefined,
  otherCurrency: Currency | undefined,
  inputTax = ZERO_PERCENT,
  outputTax = ZERO_PERCENT
): {
  state: TradeState
  trade?: PreviewTrade
  currentTrade?: PreviewTrade
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
  const isWindowVisible = useIsWindowVisible()

  const { isError, data: tradeResult, error, currentData } = useGetQuickRouteQueryState(queryArgs)
  useGetQuickRouteQuery(skipFetch || !isWindowVisible ? skipToken : queryArgs, {
    // If latest quote from cache was fetched > 2m ago, instantly repoll for another instead of waiting for next poll period
    refetchOnMountOrArgChange: 2 * 60,
  })

  const isFetching = currentData !== tradeResult || !currentData

  return useMemo(() => {
    if (amountSpecified && otherCurrency && queryArgs === skipToken) {
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
        trade: tradeResult.trade,
        currentTrade: currentData?.trade,
        swapQuoteLatency: tradeResult.latencyMs,
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
    otherCurrency,
  ])
}
