import { skipToken } from '@reduxjs/toolkit/query/react'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Trade } from '@uniswap/v3-sdk'
import { BigNumber } from 'ethers'
import ms from 'ms.macro'
import { useMemo } from 'react'
import { useBlockNumber } from 'state/application/hooks'
import { useGetQuoteQuery } from 'state/routing/slice'
import { V3TradeState } from './types'
import { computeRoutes } from './computeRoutes'

function useFreshData<T>(data: T, dataBlockNumber: number, maxBlockAge = 10): T | undefined {
  const localBlockNumber = useBlockNumber()

  if (!localBlockNumber) return undefined
  if (localBlockNumber - dataBlockNumber > maxBlockAge) {
    return undefined
  }

  return data
}

/**
 * Returns query arguments for the Routing API query or undefined if the
 * query should be skipped.
 */
function useRoutingAPIArguments({
  tokenIn,
  tokenOut,
  amount,
  type,
}: {
  tokenIn: Currency | undefined
  tokenOut: Currency | undefined
  amount: CurrencyAmount<Currency> | undefined
  type: 'exactIn' | 'exactOut'
}) {
  if (!tokenIn || !tokenOut || !amount || tokenIn.equals(tokenOut)) {
    return undefined
  }

  return {
    tokenInAddress: tokenIn.wrapped.address,
    tokenInChainId: tokenIn.chainId,
    tokenOutAddress: tokenOut.wrapped.address,
    tokenOutChainId: tokenOut.chainId,
    amount: amount.quotient.toString(),
    type,
  }
}

export function useRoutingAPITradeExactIn(amountIn?: CurrencyAmount<Currency>, currencyOut?: Currency) {
  const queryArgs = useRoutingAPIArguments({
    tokenIn: amountIn?.currency,
    tokenOut: currencyOut,
    amount: amountIn,
    type: 'exactIn',
  })

  const { isLoading, isError, data } = useGetQuoteQuery(queryArgs ?? skipToken, {
    pollingInterval: ms`10s`,
    refetchOnFocus: true,
  })

  const quoteResult = useFreshData(data, Number(data?.blockNumber) || 0)

  const routes = useMemo(
    () => computeRoutes(amountIn?.currency, currencyOut, quoteResult),
    [amountIn, currencyOut, quoteResult]
  )

  return useMemo(() => {
    if (!amountIn || !currencyOut) {
      return {
        state: V3TradeState.INVALID,
        trade: null,
      }
    }

    if (isLoading && !quoteResult) {
      // only on first hook render
      return {
        state: V3TradeState.LOADING,
        trade: null,
      }
    }

    const amountOut =
      currencyOut && quoteResult ? CurrencyAmount.fromRawAmount(currencyOut, quoteResult.quote) : undefined

    if (isError || !amountOut || !routes || routes.length === 0 || !queryArgs) {
      return {
        state: V3TradeState.NO_ROUTE_FOUND,
        trade: null,
      }
    }

    const trade = Trade.createUncheckedTradeWithMultipleRoutes<Currency, Currency, TradeType.EXACT_INPUT>({
      routes,
      tradeType: TradeType.EXACT_INPUT,
    })

    const gasPriceWei = BigNumber.from(quoteResult?.gasPriceWei)
    const gasUseEstimate = BigNumber.from(quoteResult?.gasUseEstimate)

    return {
      // always return VALID regardless of isFetching status
      state: V3TradeState.VALID,
      trade,
      gasPriceWei,
      gasUseEstimate,
    }
  }, [amountIn, currencyOut, isLoading, quoteResult, isError, routes, queryArgs])
}

export function useRoutingAPITradeExactOut(currencyIn?: Currency, amountOut?: CurrencyAmount<Currency>) {
  const queryArgs = useRoutingAPIArguments({
    tokenIn: currencyIn,
    tokenOut: amountOut?.currency,
    amount: amountOut,
    type: 'exactOut',
  })

  const { isLoading, isError, data } = useGetQuoteQuery(queryArgs ?? skipToken, {
    pollingInterval: ms`10s`,
    refetchOnFocus: true,
  })

  const quoteResult = useFreshData(data, Number(data?.blockNumber) || 0)

  const routes = useMemo(
    () => computeRoutes(currencyIn, amountOut?.currency, quoteResult),
    [amountOut, currencyIn, quoteResult]
  )

  return useMemo(() => {
    if (!amountOut || !currencyIn) {
      return {
        state: V3TradeState.INVALID,
        trade: null,
      }
    }

    if (isLoading && !quoteResult) {
      return {
        state: V3TradeState.LOADING,
        trade: null,
      }
    }

    const amountIn = currencyIn && quoteResult ? CurrencyAmount.fromRawAmount(currencyIn, quoteResult.quote) : undefined

    if (isError || !amountIn || !routes || routes.length === 0 || !queryArgs) {
      return {
        state: V3TradeState.NO_ROUTE_FOUND,
        trade: null,
      }
    }

    const trade = Trade.createUncheckedTradeWithMultipleRoutes<Currency, Currency, TradeType.EXACT_OUTPUT>({
      routes,
      tradeType: TradeType.EXACT_OUTPUT,
    })

    const gasPriceWei = BigNumber.from(quoteResult?.gasPriceWei)
    const gasUseEstimate = BigNumber.from(quoteResult?.gasUseEstimate)

    return {
      state: V3TradeState.VALID,
      trade,
      gasPriceWei,
      gasUseEstimate,
    }
  }, [amountOut, currencyIn, isLoading, quoteResult, isError, routes, queryArgs])
}
