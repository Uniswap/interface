import { skipToken } from '@reduxjs/toolkit/query/react'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Trade } from '@uniswap/v3-sdk'
import { V3TradeState } from 'hooks/useV3Trade'
import ms from 'ms.macro'
import { useMemo } from 'react'
import { useGetQuoteQuery } from 'state/routing/slice'
import { useUserRoutingAPIEnabled, useUserSlippageTolerance, useUserTransactionTTL } from 'state/user/hooks'
import { useActiveWeb3React } from '../../hooks/web3'
import { useRoutes } from './useRoutes'

// todo(judo): validate block number for freshness

export function useRouterTradeExactIn(amountIn?: CurrencyAmount<Currency>, currencyOut?: Currency) {
  const { account } = useActiveWeb3React()

  // TODO(judo): `useUserSlippageToleranceWithDefault` when 'auto'
  const userSlippageTolerance = useUserSlippageTolerance()
  const [deadline] = useUserTransactionTTL()

  const [userRoutingAPIEnabled] = useUserRoutingAPIEnabled()

  const { isLoading, isFetching, isError, data } = useGetQuoteQuery(
    userRoutingAPIEnabled && amountIn && currencyOut && !amountIn.currency.equals(currencyOut)
      ? {
          tokenInAddress: amountIn.currency.wrapped.address,
          tokenInChainId: amountIn.currency.chainId,
          tokenOutAddress: currencyOut.wrapped.address,
          tokenOutChainId: currencyOut.chainId,
          amount: amountIn.quotient.toString(),
          type: 'exactIn',
          recipient: account ?? undefined,
          slippageTolerance:
            typeof userSlippageTolerance === 'string' ? userSlippageTolerance : userSlippageTolerance.toSignificant(),
          deadline: deadline.toString(),
        }
      : skipToken,
    { pollingInterval: ms`10s` }
  )

  // always calcuate routes regardless of query status
  // note: `data` may be stale, rely on UI treatment of query status
  const routes = useRoutes(data)

  return useMemo(() => {
    if (!amountIn || !currencyOut) {
      return {
        state: V3TradeState.INVALID,
        trade: null,
      }
    }

    if (isLoading) {
      // only on first hook render
      return {
        state: V3TradeState.LOADING,
        trade: null,
      }
    }

    const amountOut = currencyOut && data ? CurrencyAmount.fromRawAmount(currencyOut, data.quote) : undefined

    if (isError || !amountOut || !routes || routes.length === 0) {
      return {
        state: V3TradeState.NO_ROUTE_FOUND,
        trade: null,
      }
    }

    const trade = Trade.createUncheckedTradeWithMultipleRoutes<Currency, Currency, TradeType.EXACT_INPUT>({
      routes,
      tradeType: TradeType.EXACT_INPUT,
    })

    return {
      // when syncing, UI should visually invalidate `trade`
      state: isFetching ? V3TradeState.SYNCING : V3TradeState.VALID,
      trade: trade,
    }
  }, [amountIn, currencyOut, isLoading, data, isError, routes, isFetching])
}

export function useRouterTradeExactOut(currencyIn?: Currency, amountOut?: CurrencyAmount<Currency>) {
  const { account } = useActiveWeb3React()
  const userSlippageTolerance = useUserSlippageTolerance()
  const [deadline] = useUserTransactionTTL()

  const [userRoutingAPIEnabled] = useUserRoutingAPIEnabled()

  const { isLoading, isFetching, isError, data } = useGetQuoteQuery(
    userRoutingAPIEnabled && amountOut && currencyIn && !amountOut.currency.equals(currencyIn)
      ? {
          tokenInAddress: currencyIn.wrapped.address,
          tokenInChainId: currencyIn.chainId,
          tokenOutAddress: amountOut.currency.wrapped.address,
          tokenOutChainId: amountOut.currency.chainId,
          amount: amountOut.quotient.toString(),
          type: 'exactOut',
          recipient: account ?? undefined,
          slippageTolerance:
            typeof userSlippageTolerance === 'string' ? userSlippageTolerance : userSlippageTolerance.toSignificant(),
          deadline: deadline.toString(),
        }
      : skipToken,
    { pollingInterval: ms`10s` }
  )

  const routes = useRoutes(data)

  // todo(judo): validate block number for freshness

  return useMemo(() => {
    if (!amountOut || !currencyIn) {
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

    if (isError || !amountIn || !routes || routes.length === 0) {
      return {
        state: V3TradeState.NO_ROUTE_FOUND,
        trade: null,
      }
    }

    const trade = Trade.createUncheckedTradeWithMultipleRoutes<Currency, Currency, TradeType.EXACT_OUTPUT>({
      routes,
      tradeType: TradeType.EXACT_OUTPUT,
    })

    return {
      state: isFetching ? V3TradeState.SYNCING : V3TradeState.VALID,
      trade: trade,
    }
  }, [amountOut, currencyIn, isLoading, data, isError, routes, isFetching])
}
