import { skipToken } from '@reduxjs/toolkit/query/react'
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { Route } from '@uniswap/v2-sdk'
import { Route as RouteV3, Trade as TradeV3 } from '@uniswap/v3-sdk'
import { INCH_ROUTER_ADDRESS, V2_ROUTER_ADDRESS } from 'constants/addresses'
import { SupportedChainId } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import JSBI from 'jsbi'
import ms from 'ms.macro'
import { useMemo } from 'react'
import { useBlockNumber } from 'state/application/hooks'
import { CHAIN_0x_URL, useGetSwap0xQuery } from 'state/quote/slice'
import { SwapTransaction, V3TradeState } from 'state/routing/types'
import { v2StylePool } from 'state/routing/utils'
import { useUserSlippageToleranceWithDefault } from 'state/user/hooks'

import { computeRoutes0x } from './utils'

const DEFAULT_REMOVE_LIQUIDITY_SLIPPAGE_TOLERANCE = new Percent(5, 100)

/**
 * Returns query arguments for the Routing API query or undefined if the
 * query should be skipped.
 */
function useRoutingAPIArguments({
  tokenIn,
  tokenOut,
  amount,
  tradeType,
  recipient,
  skipValidation,
}: {
  tokenIn: Currency | undefined
  tokenOut: Currency | undefined
  amount: CurrencyAmount<Currency> | undefined
  tradeType: TradeType
  recipient: string | null | undefined
  skipValidation: boolean
}) {
  const { chainId, account } = useActiveWeb3React()
  const allowedSlippage = useUserSlippageToleranceWithDefault(DEFAULT_REMOVE_LIQUIDITY_SLIPPAGE_TOLERANCE)

  if (!chainId || !account || !tokenIn || !tokenOut || !amount || tokenIn.equals(tokenOut)) {
    return undefined
  }

  return {
    chainId: chainId.toString(),
    queryArg: {
      sellToken: tokenIn.isNative ? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' : tokenIn.wrapped.address,
      buyToken: tokenOut.isNative ? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' : tokenOut.wrapped.address,
      sellAmount: tradeType == TradeType.EXACT_INPUT ? amount.quotient.toString() : null,
      buyAmount: tradeType == TradeType.EXACT_OUTPUT ? amount.quotient.toString() : null,
      slippagePercentage: allowedSlippage.divide(1_000).toSignificant(6),
      takerAddress: recipient ? recipient : account.toString(),
      skipValidation,
    },
  }
}

/**
 * Returns the best v3 trade by invoking the routing api
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 */
export function use0xQuoteAPITrade(
  tradeType: TradeType,
  recipient: string | null | undefined,
  skipValidation: boolean,
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
  const queryArgs = useRoutingAPIArguments({
    tokenIn: currencyIn,
    tokenOut: currencyOut,
    amount: amountSpecified,
    tradeType,
    recipient,
    skipValidation,
  })

  const { isLoading, isError, data } = useGetSwap0xQuery(queryArgs ?? skipToken, {
    pollingInterval: ms`30s`,
    refetchOnFocus: true,
  })

  const quoteResult = data

  const routes = useMemo(
    () => computeRoutes0x(currencyIn, currencyOut, tradeType, quoteResult),
    [currencyIn, currencyOut, quoteResult, tradeType]
  )

  return useMemo(() => {
    if (!currencyIn || !currencyOut) {
      return {
        state: V3TradeState.INVALID,
        trade: undefined,
        tx: undefined,
      }
    }

    if (isLoading && !quoteResult) {
      // only on first hook render
      return {
        state: V3TradeState.LOADING,
        trade: undefined,
        tx: undefined,
      }
    }

    const otherAmount =
      tradeType === TradeType.EXACT_INPUT
        ? currencyIn && quoteResult
          ? CurrencyAmount.fromRawAmount(currencyIn, quoteResult.sellAmount)
          : undefined
        : currencyOut && quoteResult
        ? CurrencyAmount.fromRawAmount(currencyOut, quoteResult.buyAmount)
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
      const inputAmount = CurrencyAmount.fromRawAmount(currencyIn, quoteResult ? quoteResult.sellAmount : 0)
      const outputAmount = CurrencyAmount.fromRawAmount(currencyOut, quoteResult ? quoteResult.buyAmount : 0)
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
        tx: {
          from: account?.toString() ?? '',
          to: quoteResult?.to ?? '',
          data: quoteResult?.data ?? '',
          value: quoteResult?.value ?? '',
          gas: quoteResult?.gas ?? '',
          type: 1,
        },
      }
    } catch (error) {
      console.log(error)
      return {
        state: V3TradeState.INVALID,
        trade: undefined,
        tx: undefined,
      }
    }
  }, [currencyIn, currencyOut, isError, isLoading, quoteResult, tradeType, routes, queryArgs, account])
}
