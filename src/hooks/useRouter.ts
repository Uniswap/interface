import { skipToken } from '@reduxjs/toolkit/query/react'
import { Currency, CurrencyAmount, Price, TradeType } from '@uniswap/sdk-core'
import { useBlockNumber } from 'state/application/hooks'
import { useGetQuoteQuery } from 'state/routing/slice'
import { GetQuoteResult } from 'state/routing/types'
import { V3TradeState } from './useBestV3Trade'
import { useActiveWeb3React } from './web3'

const DEFAULT_SLIPPAGE_TOLERANCE = '5'
const DEFAULT_DEADLINE = '360'

export interface RouterTrade<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType>
  extends GetQuoteResult {
  tradeType: TTradeType
  executionPrice: Price<TInput, TOutput>
  inputAmount: CurrencyAmount<TInput>
  outputAmount: CurrencyAmount<TOutput>
}

export function useRouterTradeExactIn(
  amountIn?: CurrencyAmount<Currency>,
  currencyOut?: Currency
): { state: V3TradeState; trade: RouterTrade<Currency, Currency, TradeType> | undefined } {
  const { account } = useActiveWeb3React()
  const blockNumber = useBlockNumber()

  const { isLoading, isFetching, isError, data } = useGetQuoteQuery(
    blockNumber && amountIn && currencyOut && account
      ? {
          blockNumber,
          tokenIn: { address: amountIn.currency.wrapped.address, chainId: amountIn.currency.chainId },
          tokenOut: {
            address: currencyOut.wrapped.address,
            chainId: currencyOut.chainId,
          },
          amount: amountIn.toExact(),
          type: 'exactIn',
          recipient: account,
          slippageTolerance: DEFAULT_SLIPPAGE_TOLERANCE,
          deadline: DEFAULT_DEADLINE,
        }
      : skipToken
  )

  const trade: RouterTrade<Currency, Currency, TradeType> | undefined =
    currencyOut && amountIn && data
      ? {
          tradeType: TradeType.EXACT_INPUT,
          inputAmount: amountIn,
          outputAmount: CurrencyAmount.fromRawAmount(currencyOut, data.quote),
          executionPrice: new Price(amountIn?.currency, currencyOut, 1, 1),
          ...data,
        }
      : undefined

  return {
    state: isLoading
      ? V3TradeState.LOADING
      : isFetching
      ? V3TradeState.SYNCING
      : isError
      ? V3TradeState.INVALID
      : !data
      ? V3TradeState.NO_ROUTE_FOUND
      : V3TradeState.VALID,
    trade,
  }
}

export function useRouterTradeExactOut(
  currencyIn?: Currency,
  amountOut?: CurrencyAmount<Currency>
): { state: V3TradeState; trade: RouterTrade<Currency, Currency, TradeType> | undefined } {
  const { account } = useActiveWeb3React()
  const blockNumber = useBlockNumber()

  const { isLoading, isFetching, isError, data } = useGetQuoteQuery(
    blockNumber && currencyIn && amountOut && account
      ? {
          blockNumber,
          tokenIn: { address: currencyIn.wrapped.address, chainId: currencyIn.chainId },
          tokenOut: {
            address: amountOut?.currency.wrapped.address,
            chainId: amountOut?.currency.chainId,
          },
          amount: amountOut.toExact(),
          type: 'exactOut',
          recipient: account,
          slippageTolerance: DEFAULT_SLIPPAGE_TOLERANCE,
          deadline: DEFAULT_DEADLINE,
        }
      : skipToken
  )

  return {
    state: isLoading
      ? V3TradeState.LOADING
      : isFetching
      ? V3TradeState.SYNCING
      : isError
      ? V3TradeState.INVALID
      : !data
      ? V3TradeState.NO_ROUTE_FOUND
      : V3TradeState.VALID,
    trade: undefined, // data,
  }
}
