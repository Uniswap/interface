import { skipToken } from '@reduxjs/toolkit/query/react'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Trade } from '@uniswap/v3-sdk'
import { V3_SWAP_DEFAULT_SLIPPAGE } from 'hooks/useSwapSlippageTolerance'
import { V3TradeState } from 'hooks/useV3Trade'
import ms from 'ms.macro'
import { useMemo } from 'react'
import { useBlockNumber } from 'state/application/hooks'
import { useGetQuoteQuery } from 'state/routing/slice'
import { useIsLegacyRouter, useUserSlippageToleranceWithDefault, useUserTransactionTTL } from 'state/user/hooks'
import { useActiveWeb3React } from '../../hooks/web3'
import { useRoutes } from './useRoutes'
import ReactGA from 'react-ga'
import { BigNumber } from 'ethers'

function useFreshData<T>(data: T, dataBlockNumber: number, maxBlockAge = 10): T | undefined {
  const localBlockNumber = useBlockNumber()

  if (!localBlockNumber) return undefined
  if (localBlockNumber - dataBlockNumber > maxBlockAge) {
    ReactGA.exception({ description: `Routing API stale (app: ${localBlockNumber} api: ${dataBlockNumber}` })
    return undefined
  }

  return data
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
          tokenInAddress: amountIn.currency.wrapped.address,
          tokenInChainId: amountIn.currency.chainId,
          tokenOutAddress: currencyOut.wrapped.address,
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

  const quoteResult = useFreshData(data, Number(data?.blockNumber) ?? 0)

  const routes = useRoutes(amountIn?.currency, currencyOut, quoteResult)

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

    if (isError || !amountOut || !routes || routes.length === 0 || !routingAPIEnabled) {
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
      trade: trade,
      gasPriceWei,
      gasUseEstimate,
    }
  }, [amountIn, currencyOut, isLoading, quoteResult, isError, routes, routingAPIEnabled])
}

export function useRouterTradeExactOut(currencyIn?: Currency, amountOut?: CurrencyAmount<Currency>) {
  const { recipient, slippageTolerance, deadline, routingAPIEnabled } = useRouterTradeArguments()

  const { isLoading, isError, data } = useGetQuoteQuery(
    routingAPIEnabled && amountOut && currencyIn && !amountOut.currency.equals(currencyIn)
      ? {
          tokenInAddress: currencyIn.wrapped.address,
          tokenInChainId: currencyIn.chainId,
          tokenOutAddress: amountOut.currency.wrapped.address,
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

  const quoteResult = useFreshData(data, Number(data?.blockNumber) ?? 0)

  const routes = useRoutes(currencyIn, amountOut?.currency, quoteResult)

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

    if (isError || !amountIn || !routes || routes.length === 0 || !routingAPIEnabled) {
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
      trade: trade,
      gasPriceWei,
      gasUseEstimate,
    }
  }, [amountOut, currencyIn, isLoading, quoteResult, isError, routes, routingAPIEnabled])
}
