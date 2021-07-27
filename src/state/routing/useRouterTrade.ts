import { skipToken } from '@reduxjs/toolkit/query/react'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Route, Trade } from '@uniswap/v3-sdk'
import ms from 'ms.macro'
import { useMemo } from 'react'
import { useGetQuoteQuery } from 'state/routing/slice'
import { V3TradeState } from '../../hooks/useBestV3Trade'
import { useActiveWeb3React } from '../../hooks/web3'
import { useRoute } from './useRoute'

export function useRouterTradeExactIn(amountIn?: CurrencyAmount<Currency>, currencyOut?: Currency) {
  const { account } = useActiveWeb3React()

  const { isLoading, isFetching, isError, data } = useGetQuoteQuery(
    amountIn && currencyOut && account
      ? {
          tokenInAddress: amountIn.currency.wrapped.address,
          tokenInChainId: amountIn.currency.chainId,
          tokenOutAddress: currencyOut.wrapped.address,
          tokenOutChainId: currencyOut.chainId,
          amount: amountIn.quotient.toString(),
          type: 'exactIn',
        }
      : skipToken,
    { pollingInterval: ms`5m` }
  )

  // process route data
  // todo(judo): add s
  const routes = useRoute(amountIn?.currency, currencyOut, data)

  // todo(judo): validate block number for freshness

  return useMemo(() => {
    if (!amountIn || !currencyOut || isError) {
      return {
        state: V3TradeState.INVALID,
        trade: null,
      }
    }

    if (isLoading || routes === undefined) {
      return {
        state: V3TradeState.LOADING,
        trade: null,
      }
    }

    const amountOut = currencyOut && data ? CurrencyAmount.fromRawAmount(currencyOut, data.quote) : undefined

    if (!amountOut || routes === []) {
      return {
        state: V3TradeState.NO_ROUTE_FOUND,
        trade: null,
      }
    }

    const trade = Trade.createUncheckedTradeWithMultipleRoutes<Currency, Currency, TradeType.EXACT_INPUT>({
      routes: routes.map((route) => ({ route, inputAmount: amountIn, outputAmount: amountOut })),
      tradeType: TradeType.EXACT_INPUT,
    })

    return {
      state: isFetching ? V3TradeState.SYNCING : V3TradeState.VALID,
      trade: trade,
    }
  }, [amountIn, currencyOut, isError, isLoading, routes, data, isFetching])
}

export function useRouterTradeExactOut(currencyIn?: Currency, amountOut?: CurrencyAmount<Currency>) {
  const { account } = useActiveWeb3React()

  const { isLoading, isFetching, isError, data } = useGetQuoteQuery(
    // amountOut && currencyIn && account
    //   ? {
    //       tokenInAddress: currencyIn.wrapped.address,
    //       tokenInChainId: currencyIn.chainId,
    //       tokenOutAddress: amountOut.currency.wrapped.address,
    //       tokenOutChainId: amountOut.currency.chainId,
    //       amount: amountOut.quotient.toString(),
    //       type: 'exactOut',
    //     }
    //   :
    skipToken,
    { pollingInterval: ms`5m` }
  )

  // todo(judo): validate block number for freshness

  return useMemo(() => {
    if (!amountOut || !currencyIn || isError) {
      return {
        state: V3TradeState.INVALID,
        trade: null,
      }
    }

    if (isLoading) {
      return {
        state: V3TradeState.LOADING,
        trade: null,
      }
    }

    const amountIn = currencyIn && data ? CurrencyAmount.fromRawAmount(currencyIn, data.quote) : undefined

    if (!amountIn) {
      return {
        state: V3TradeState.NO_ROUTE_FOUND,
        trade: null,
      }
    }

    const trade = Trade.createUncheckedTradeWithMultipleRoutes<Currency, Currency, TradeType.EXACT_OUTPUT>({
      routes: [
        {
          route: null as any as Route<Currency, Currency>,
          inputAmount: amountIn,
          outputAmount: amountOut,
        },
      ],
      tradeType: TradeType.EXACT_OUTPUT,
    })

    return {
      state: isFetching ? V3TradeState.SYNCING : V3TradeState.VALID,
      trade: trade,
    }
  }, [amountOut, currencyIn, isError, isLoading, isFetching])
}
