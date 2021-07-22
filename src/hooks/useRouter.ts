import { skipToken } from '@reduxjs/toolkit/query/react'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import ms from 'ms.macro'
import { MultiRouteTrade, useGetQuoteQuery } from 'state/routing/slice'
import { V3TradeState } from './useBestV3Trade'
import { useActiveWeb3React } from './web3'

export function useRouterTradeExactIn(amountIn?: CurrencyAmount<Currency>, currencyOut?: Currency) {
  const { account } = useActiveWeb3React()

  const { isLoading, isError, data } = useGetQuoteQuery(
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
    { pollingInterval: ms`10s` }
  )

  // todo(judo): validate block number for freshness

  // augment routing api response with additional data
  const multiRouteTrade =
    currencyOut && data
      ? ({
          ...data,
          tradeType: TradeType.EXACT_INPUT,
          inputAmount: amountIn,
          outputAmount: CurrencyAmount.fromRawAmount(currencyOut, data.quote),
        } as MultiRouteTrade<Currency, Currency, TradeType.EXACT_INPUT>)
      : null

  return {
    state: isLoading
      ? V3TradeState.LOADING
      : isError
      ? V3TradeState.NO_ROUTE_FOUND
      : !data
      ? V3TradeState.NO_ROUTE_FOUND
      : V3TradeState.VALID,
    trade: multiRouteTrade,
  }
}

export function useRouterTradeExactOut(currencyIn?: Currency, amountOut?: CurrencyAmount<Currency>) {
  const { account } = useActiveWeb3React()

  const { isLoading, isError, data } = useGetQuoteQuery(
    amountOut && currencyIn && account
      ? {
          tokenInAddress: currencyIn.wrapped.address,
          tokenInChainId: currencyIn.chainId,
          tokenOutAddress: amountOut.currency.wrapped.address,
          tokenOutChainId: amountOut.currency.chainId,
          amount: amountOut.quotient.toString(),
          type: 'exactOut',
        }
      : skipToken,
    { pollingInterval: ms`10s` }
  )

  // todo(judo): validate block number for freshness

  // augment routing api response with additional data
  const multiRouteTrade =
    currencyIn && data
      ? ({
          ...data,
          tradeType: TradeType.EXACT_OUTPUT,
          inputAmount: CurrencyAmount.fromRawAmount(currencyIn, data.quote),
          outputAmount: amountOut,
        } as MultiRouteTrade<Currency, Currency, TradeType.EXACT_OUTPUT>)
      : null

  return {
    state: isLoading
      ? V3TradeState.LOADING
      : isError
      ? V3TradeState.NO_ROUTE_FOUND
      : !data
      ? V3TradeState.NO_ROUTE_FOUND
      : V3TradeState.VALID,
    trade: multiRouteTrade,
  }
}
