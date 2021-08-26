import { skipToken } from '@reduxjs/toolkit/query/react'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Trade } from '@uniswap/v3-sdk'
import { V3_SWAP_DEFAULT_SLIPPAGE } from 'hooks/useSwapSlippageTolerance'
import { V3TradeState } from 'hooks/useV3Trade'
import ms from 'ms.macro'
import { useMemo } from 'react'
import { useGetQuoteQuery } from 'state/routing/slice'
import { useIsLegacyRouter, useUserSlippageToleranceWithDefault, useUserTransactionTTL } from 'state/user/hooks'
import { useActiveWeb3React } from '../../hooks/web3'
import { useRoutes } from './useRoutes'

// todo(judo): validate block number for freshness

function getAddress(currency: Currency): string {
  return currency.isToken ? currency.address : currency.isNative ? 'ETH' : ''
}

function useRouterTradeArguments() {
  const { account } = useActiveWeb3React()

  const userSlippageTolerance = useUserSlippageToleranceWithDefault(V3_SWAP_DEFAULT_SLIPPAGE)
  const [deadline] = useUserTransactionTTL()

  const [legacyRouter] = useIsLegacyRouter()

  return {
    recipient: account ?? undefined,
    slippageTolerance:
      typeof userSlippageTolerance === 'string' ? userSlippageTolerance : userSlippageTolerance.toSignificant(),
    deadline: deadline.toString(),
    routingAPIEnabled: !legacyRouter,
  }
}

export function useRouterTradeExactIn(amountIn?: CurrencyAmount<Currency>, currencyOut?: Currency) {
  const { recipient, slippageTolerance, deadline, routingAPIEnabled } = useRouterTradeArguments()

  const { isLoading, isError, data } = useGetQuoteQuery(
    routingAPIEnabled && amountIn && currencyOut && !amountIn.currency.equals(currencyOut)
      ? {
          tokenInAddress: getAddress(amountIn.currency),
          tokenInChainId: amountIn.currency.chainId,
          tokenOutAddress: getAddress(currencyOut),
          tokenOutChainId: currencyOut.chainId,
          amount: amountIn.quotient.toString(),
          type: 'exactIn',
          recipient,
          slippageTolerance,
          deadline,
        }
      : skipToken,
    { pollingInterval: ms`10s` }
  )

  const routes = useRoutes(data)

  return useMemo(() => {
    if (!amountIn || !currencyOut) {
      return {
        state: V3TradeState.INVALID,
        trade: null,
      }
    }

    if (isLoading && !data) {
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
      // always return VALID regardless of isFetching status
      state: V3TradeState.VALID,
      trade: trade,
    }
  }, [amountIn, currencyOut, isLoading, data, isError, routes])
}

export function useRouterTradeExactOut(currencyIn?: Currency, amountOut?: CurrencyAmount<Currency>) {
  const { recipient, slippageTolerance, deadline, routingAPIEnabled } = useRouterTradeArguments()

  const { isLoading, isError, data } = useGetQuoteQuery(
    routingAPIEnabled && amountOut && currencyIn && !amountOut.currency.equals(currencyIn)
      ? {
          tokenInAddress: getAddress(currencyIn),
          tokenInChainId: currencyIn.chainId,
          tokenOutAddress: getAddress(amountOut.currency),
          tokenOutChainId: amountOut.currency.chainId,
          amount: amountOut.quotient.toString(),
          type: 'exactOut',
          recipient,
          slippageTolerance,
          deadline,
        }
      : skipToken,
    { pollingInterval: ms`10s` }
  )

  const routes = useRoutes(data)

  return useMemo(() => {
    if (!amountOut || !currencyIn) {
      return {
        state: V3TradeState.INVALID,
        trade: null,
      }
    }

    if (isLoading && !data) {
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
      state: V3TradeState.VALID,
      trade: trade,
    }
  }, [amountOut, currencyIn, isLoading, data, isError, routes])
}
