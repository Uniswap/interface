import { skipToken } from '@reduxjs/toolkit/dist/query/react'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useGetQuoteQuery } from 'state/routing/slice'
import { useActiveWeb3React } from './web3'

const DEFAULT_SLIPPAGE_TOLERANCE = '5'
const DEFAULT_DEADLINE = '360'

export function useRouterTradeExactIn(amountIn?: CurrencyAmount<Currency>, currencyOut?: Currency) {
  const { account } = useActiveWeb3React()

  const { isLoading, isError, data } = useGetQuoteQuery(
    amountIn?.currency?.wrapped?.address &&
      currencyOut?.wrapped?.address &&
      amountIn?.currency?.chainId &&
      currencyOut?.chainId &&
      account &&
      amountIn !== undefined
      ? {
          tokenIn: { address: amountIn.currency.wrapped.address, chainId: amountIn.currency.chainId },
          tokenOut: {
            address: currencyOut.wrapped.address,
            chainId: currencyOut.chainId,
          },
          amount: amountIn.toSignificant(6),
          type: 'exactIn',
          recipient: account,
          slippageTolerance: DEFAULT_SLIPPAGE_TOLERANCE,
          deadline: DEFAULT_DEADLINE,
        }
      : skipToken
  )

  return !isLoading && !isError ? data?.routeString : undefined
}
