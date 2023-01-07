import { skipToken } from '@reduxjs/toolkit/query/react'
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { Route as RouteV3, Trade as TradeV3 } from '@uniswap/v3-sdk'
import { INCH_ROUTER_ADDRESS } from 'constants/addresses'
import { ONE_HUNDRED_PERCENT } from 'constants/misc'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import { useActiveWeb3React } from 'hooks/web3'
import JSBI from 'jsbi'
import ms from 'ms.macro'
import { useMemo } from 'react'
import { useGetQuoteInchQuery } from 'state/routing/slice'
import { useNetworkGasPrice, useUserSlippageToleranceWithDefault } from 'state/user/hooks'

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
  protocols,
}: {
  tokenIn: Currency | undefined
  tokenOut: Currency | undefined
  amount: CurrencyAmount<Currency> | undefined
  tradeType: TradeType
  protocols?: string
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
      protocols: protocols ?? null,
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
  otherCurrency?: Currency,
  protocols?: string
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
    protocols,
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

  const gasAmount = useNetworkGasPrice()
  const priceGwei =
    gasAmount && data?.estimatedGas
      ? gasAmount
          .multiply(JSBI.BigInt(data?.estimatedGas))
          .multiply(ONE_HUNDRED_PERCENT.subtract(new Percent(JSBI.BigInt(3000), JSBI.BigInt(10000))))
      : undefined
  const gasUseEstimateUSD = useUSDCValue(priceGwei) ?? null

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
      if (!data) {
        return {
          state: V3TradeState.INVALID,
          trade: undefined,
          tx: undefined,
        }
      }
      const inputAmount = CurrencyAmount.fromRawAmount(currencyIn, data.fromTokenAmount)
      const outputAmount = CurrencyAmount.fromRawAmount(currencyOut, data.toTokenAmount)
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
            gasUseEstimateUSD: gasUseEstimateUSD ? gasUseEstimateUSD.toFixed(2) : '0',
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
  }, [
    currencyIn,
    currencyOut,
    isLoading,
    data,
    tradeType,
    isError,
    routes,
    queryArgs,
    account,
    chainId,
    gasUseEstimateUSD,
  ])
}
