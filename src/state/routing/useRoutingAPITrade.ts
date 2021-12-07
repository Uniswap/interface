import { skipToken } from '@reduxjs/toolkit/query/react'
import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { useStablecoinAmountFromFiatValue } from 'hooks/useUSDCPrice'
import ms from 'ms.macro'
import { useMemo } from 'react'
import { useBlockNumber } from 'state/application/hooks'
import { useGetQuoteQuery } from 'state/routing/slice'
import { useClientSideRouter } from 'state/user/hooks'

import { GetQuoteResult, InterfaceTrade, TradeState } from './types'
import { computeRoutes, transformRoutesToTrade } from './utils'

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
  tradeType,
}: {
  tokenIn: Currency | undefined
  tokenOut: Currency | undefined
  amount: CurrencyAmount<Currency> | undefined
  tradeType: TradeType
}) {
  const [clientSideRouter] = useClientSideRouter()

  if (!tokenIn || !tokenOut || !amount || tokenIn.equals(tokenOut)) {
    return undefined
  }

  return {
    amount: amount.quotient.toString(),
    tokenInAddress: tokenIn.wrapped.address,
    tokenInChainId: tokenIn.wrapped.chainId,
    tokenInDecimals: tokenIn.wrapped.decimals,
    tokenInSymbol: tokenIn.wrapped.symbol,
    tokenOutAddress: tokenOut.wrapped.address,
    tokenOutChainId: tokenOut.wrapped.chainId,
    tokenOutDecimals: tokenOut.wrapped.decimals,
    tokenOutSymbol: tokenOut.wrapped.symbol,
    useClientSideRouter: clientSideRouter,
    type: (tradeType === TradeType.EXACT_INPUT ? 'exactIn' : 'exactOut') as 'exactIn' | 'exactOut',
  }
}

/**
 * Returns the best trade by invoking the routing api or the smart order router on the client
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 */
export function useRoutingAPITrade<TTradeType extends TradeType>(
  tradeType: TTradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency
): {
  state: TradeState
  trade: InterfaceTrade<Currency, Currency, TTradeType> | undefined
  gasUseEstimateUSD: CurrencyAmount<Token> | null // dollar amount in active chains stabelcoin
} {
  const [currencyIn, currencyOut]: [Currency | undefined, Currency | undefined] = useMemo(
    () =>
      tradeType === TradeType.EXACT_INPUT
        ? [amountSpecified?.currency, otherCurrency]
        : [otherCurrency, amountSpecified?.currency],
    [amountSpecified, otherCurrency, tradeType]
  )

  const queryArgs = useRoutingAPIArguments({
    tokenIn: currencyIn,
    tokenOut: currencyOut,
    amount: amountSpecified,
    tradeType,
  })

  const { isLoading, isError, data } = useGetQuoteQuery(queryArgs ?? skipToken, {
    pollingInterval: ms`15s`,
    refetchOnFocus: true,
  })

  const quoteResult: GetQuoteResult | undefined = useFreshData(data, Number(data?.blockNumber) || 0)

  const route = useMemo(
    () => computeRoutes(currencyIn, currencyOut, tradeType, quoteResult),
    [currencyIn, currencyOut, quoteResult, tradeType]
  )

  // get USD gas cost of trade in active chains stablecoin amount
  const gasUseEstimateUSD = useStablecoinAmountFromFiatValue(quoteResult?.gasUseEstimateUSD) ?? null

  return useMemo(() => {
    if (!currencyIn || !currencyOut) {
      return {
        state: TradeState.INVALID,
        trade: undefined,
        gasUseEstimateUSD,
      }
    }

    if (isLoading && !quoteResult) {
      // only on first hook render
      return {
        state: TradeState.LOADING,
        trade: undefined,
        gasUseEstimateUSD,
      }
    }

    const otherAmount =
      tradeType === TradeType.EXACT_INPUT
        ? currencyOut && quoteResult
          ? CurrencyAmount.fromRawAmount(currencyOut, quoteResult.quote)
          : undefined
        : currencyIn && quoteResult
        ? CurrencyAmount.fromRawAmount(currencyIn, quoteResult.quote)
        : undefined

    if (isError || !otherAmount || !route || route.length === 0 || !queryArgs) {
      return {
        state: TradeState.NO_ROUTE_FOUND,
        trade: undefined,
        gasUseEstimateUSD,
      }
    }

    const trade = transformRoutesToTrade(route, tradeType, gasUseEstimateUSD)

    return {
      // always return VALID regardless of isFetching status
      state: TradeState.VALID,
      trade,
      gasUseEstimateUSD,
    }
  }, [currencyIn, currencyOut, isLoading, quoteResult, tradeType, isError, route, queryArgs, gasUseEstimateUSD])
}
