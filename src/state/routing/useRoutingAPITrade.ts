import { skipToken } from '@reduxjs/toolkit/query/react'
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { Route, Trade } from '@uniswap/v2-sdk'
import { Route as RouteV3, Trade as TradeV3 } from '@uniswap/v3-sdk'
import { INCH_ROUTER_ADDRESS, V2_ROUTER_ADDRESS } from 'constants/addresses'
import { SupportedChainId } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import JSBI from 'jsbi'
import ms from 'ms.macro'
import { useMemo } from 'react'
import { useBlockNumber } from 'state/application/hooks'
import { useGetQuoteInchQuery, useGetSwapInchQuery } from 'state/routing/slice'
import { useUserSlippageToleranceWithDefault } from 'state/user/hooks'

import { SwapTransaction, V3TradeState } from './types'
import { computeRoutes, v2StylePool } from './utils'

const DEFAULT_REMOVE_LIQUIDITY_SLIPPAGE_TOLERANCE = new Percent(5, 100)

/**
 * Returns query arguments for the Routing API query or undefined if the
 * query should be skipped.
 */
function useQuoteAPIArguments({
  tokenIn,
  tokenOut,
  amount,
  tradeType,
}: {
  tokenIn: Currency | undefined
  tokenOut: Currency | undefined
  amount: CurrencyAmount<Currency> | undefined
  tradeType: TradeType
}) {
  const { chainId, account } = useActiveWeb3React()

  if (
    !chainId ||
    !account ||
    !tokenIn ||
    !tokenOut ||
    !amount ||
    tokenIn.equals(tokenOut) ||
    tradeType == TradeType.EXACT_OUTPUT
  ) {
    return undefined
  }

  return {
    chainId: chainId.toString(),
    queryArg: {
      fromTokenAddress: tokenIn.isNative ? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' : tokenIn.wrapped.address,
      toTokenAddress: tokenOut.isNative ? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' : tokenOut.wrapped.address,
      amount: amount.quotient.toString(),
    },
  }
}

/**
 * Returns query arguments for the Routing API query or undefined if the
 * query should be skipped.
 */
function useSwapAPIArguments({
  swapTransaction,
  tokenIn,
  tokenOut,
  amount,
  tradeType,
  recipient,
}: {
  swapTransaction: SwapTransaction | null | undefined
  tokenIn: Currency | undefined
  tokenOut: Currency | undefined
  amount: CurrencyAmount<Currency> | undefined
  tradeType: TradeType
  recipient: string | null | undefined
}) {
  const { chainId, account } = useActiveWeb3React()
  const allowedSlippage = useUserSlippageToleranceWithDefault(DEFAULT_REMOVE_LIQUIDITY_SLIPPAGE_TOLERANCE)

  if (
    !chainId ||
    !account ||
    !tokenIn ||
    !tokenOut ||
    !amount ||
    !swapTransaction ||
    !(swapTransaction.type === 2) ||
    tokenIn.equals(tokenOut) ||
    tradeType == TradeType.EXACT_OUTPUT
  ) {
    return undefined
  }

  return {
    chainId: chainId.toString(),
    queryArg: {
      fromTokenAddress: tokenIn.isNative ? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' : tokenIn.wrapped.address,
      toTokenAddress: tokenOut.isNative ? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' : tokenOut.wrapped.address,
      amount: amount.quotient.toString(),
      fromAddress: account.toString(),
      slippage: allowedSlippage.toSignificant(6),
      destReceiver: recipient ? recipient : account.toString(),
      disableEstimate: false,
    },
  }
}

export function useInchQuoteAPITrade(
  tradeType: TradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency
): {
  state: V3TradeState
  trade: TradeV3<Currency, Currency, TradeType> | undefined
  tx: SwapTransaction | undefined
} {
  const [currencyIn, currencyOut]: [Currency | undefined, Currency | undefined] = useMemo(
    () =>
      tradeType === TradeType.EXACT_INPUT
        ? [amountSpecified?.currency, otherCurrency]
        : [otherCurrency, amountSpecified?.currency],
    [amountSpecified, otherCurrency, tradeType]
  )

  const { chainId, account } = useActiveWeb3React()

  const queryArgs = useQuoteAPIArguments({
    tokenIn: currencyIn,
    tokenOut: currencyOut,
    amount: amountSpecified,
    tradeType,
  })

  const { isLoading, isError, data } = useGetQuoteInchQuery(queryArgs ?? skipToken, {
    pollingInterval: ms`30s`,
    refetchOnFocus: true,
  })

  const routes = useMemo(
    () =>
      computeRoutes(
        currencyIn,
        currencyOut,
        data?.fromToken,
        data?.toToken,
        data,
        data?.fromTokenAmount,
        data?.toTokenAmount
      ),
    [currencyIn, currencyOut, data]
  )

  // get USD gas cost of trade in active chains stablecoin amount
  // const gasUseEstimateUSD = useStablecoinAmountFromFiatValue(quoteResult?.gasUseEstimateUSD) ?? null

  return useMemo(() => {
    if (!currencyIn || !currencyOut) {
      return {
        state: V3TradeState.INVALID,
        trade: undefined,
        tx: undefined,
      }
    }

    if (isLoading && !data) {
      // only on first hook render
      return {
        state: V3TradeState.LOADING,
        trade: undefined,
        tx: undefined,
      }
    }

    const otherAmount =
      tradeType === TradeType.EXACT_INPUT
        ? currencyIn && data
          ? CurrencyAmount.fromRawAmount(currencyIn, data.fromTokenAmount)
          : undefined
        : currencyOut && data
        ? CurrencyAmount.fromRawAmount(currencyOut, data.toTokenAmount)
        : undefined

    if (isError || !otherAmount || !routes || routes.length === 0 || !queryArgs) {
      return {
        state: V3TradeState.NO_ROUTE_FOUND,
        trade: undefined,
        tx: undefined,
      }
    }

    try {
      // get those from API
      const inputAmount = CurrencyAmount.fromRawAmount(currencyIn, data ? data.fromTokenAmount : 0)
      const outputAmount = CurrencyAmount.fromRawAmount(currencyOut, data ? data.toTokenAmount : 0)
      const route = new RouteV3([v2StylePool(inputAmount.wrapped, outputAmount.wrapped)], currencyIn, currencyOut)
      const bestTrade = TradeV3.createUncheckedTrade({
        route,
        inputAmount,
        outputAmount,
        tradeType,
      })

      const tx = data
        ? {
            gas: data ? data.estimatedGas : '0x0',
            from: account ? account.toString() : '0x0',
            to: chainId ? INCH_ROUTER_ADDRESS[chainId] : '0x0',
            data: '0x0',
            value: '0x0',
            type: 2,
          }
        : undefined
      return {
        // always return VALID regardless of isFetching status
        state: V3TradeState.VALID,
        trade: bestTrade,
        tx,
      }
    } catch (error) {
      return {
        state: V3TradeState.INVALID,
        trade: undefined,
        tx: undefined,
      }
    }
  }, [currencyIn, currencyOut, isLoading, data, tradeType, isError, routes, queryArgs, account, chainId])
}

export function useInchSwapAPITrade(
  swapTransaction: SwapTransaction | null | undefined,
  tradeType: TradeType,
  recipient: string | null | undefined,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency
): {
  state: V3TradeState
  trade: TradeV3<Currency, Currency, TradeType> | null
  tx: SwapTransaction | undefined
} {
  const [currencyIn, currencyOut]: [Currency | undefined, Currency | undefined] = useMemo(
    () =>
      tradeType === TradeType.EXACT_INPUT
        ? [amountSpecified?.currency, otherCurrency]
        : [otherCurrency, amountSpecified?.currency],
    [amountSpecified, otherCurrency, tradeType]
  )

  const queryArgs = useSwapAPIArguments({
    swapTransaction,
    tokenIn: currencyIn,
    tokenOut: currencyOut,
    amount: amountSpecified,
    tradeType,
    recipient,
  })

  const { isLoading, isError, data } = useGetSwapInchQuery(queryArgs ?? skipToken, {
    pollingInterval: ms`30s`,
    refetchOnFocus: true,
  })

  const quoteResult = data

  const routes = useMemo(
    () =>
      computeRoutes(
        currencyIn,
        currencyOut,
        quoteResult?.fromToken,
        quoteResult?.toToken,
        quoteResult,
        quoteResult?.fromTokenAmount,
        quoteResult?.toTokenAmount
      ),
    [currencyIn, currencyOut, quoteResult]
  )

  return useMemo(() => {
    if (!currencyIn || !currencyOut) {
      return {
        state: V3TradeState.INVALID,
        trade: null,
        tx: undefined,
      }
    }

    if (isLoading && !quoteResult) {
      // only on first hook render
      return {
        state: V3TradeState.LOADING,
        trade: null,
        tx: undefined,
      }
    }

    const otherAmount =
      tradeType === TradeType.EXACT_INPUT
        ? currencyIn && quoteResult
          ? CurrencyAmount.fromRawAmount(currencyIn, quoteResult.fromTokenAmount)
          : undefined
        : currencyOut && quoteResult
        ? CurrencyAmount.fromRawAmount(currencyOut, quoteResult.toTokenAmount)
        : undefined

    if (isError || !otherAmount || !routes || routes.length === 0 || !queryArgs) {
      return {
        state: V3TradeState.NO_ROUTE_FOUND,
        trade: null,
        tx: undefined,
      }
    }

    try {
      // get those from API
      const inputAmount = CurrencyAmount.fromRawAmount(currencyIn, quoteResult ? quoteResult.fromTokenAmount : 0)
      const outputAmount = CurrencyAmount.fromRawAmount(currencyOut, quoteResult ? quoteResult.toTokenAmount : 0)
      const route = new RouteV3([v2StylePool(inputAmount.wrapped, outputAmount.wrapped)], currencyIn, currencyOut)
      const bestTrade = TradeV3.createUncheckedTrade({
        route,
        inputAmount,
        outputAmount,
        tradeType,
      })

      return {
        // always return VALID regardless of isFetching status
        state: V3TradeState.VALID,
        trade: bestTrade,
        tx: quoteResult?.tx,
      }
    } catch (error) {
      return {
        state: V3TradeState.NO_ROUTE_FOUND,
        trade: null,
        tx: undefined,
      }
    }
  }, [currencyIn, currencyOut, isLoading, quoteResult, tradeType, isError, routes, queryArgs])
}
