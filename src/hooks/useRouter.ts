import { skipToken } from '@reduxjs/toolkit/query/react'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import ms from 'ms.macro'
import { useBlockNumber } from 'state/application/hooks'
import { useGetQuoteQuery } from 'state/routing/slice'
import { useActiveWeb3React } from './web3'

const DEFAULT_SLIPPAGE_TOLERANCE = '5'
const DEFAULT_DEADLINE = '360'

export function useRouterTradeExactIn(amountIn?: CurrencyAmount<Currency>, currencyOut?: Currency) {
  const { account } = useActiveWeb3React()

  const blockNumber = useBlockNumber()

  const { isLoading, isError, data } = useGetQuoteQuery(
    amountIn && currencyOut && account && blockNumber
      ? {
          tokenInAddress: amountIn.currency.wrapped.address,
          tokenInChainId: amountIn.currency.chainId,
          tokenOutAddress: currencyOut.wrapped.address,
          tokenOutChainId: currencyOut.chainId,
          amount: amountIn.quotient.toString(),
          type: 'exactIn',
          recipient: account,
          slippageTolerance: DEFAULT_SLIPPAGE_TOLERANCE,
          deadline: DEFAULT_DEADLINE,
        }
      : skipToken,
    { pollingInterval: ms`10s` }
  )

  // todo(judo): validate block number for freshness

  return !isLoading && !isError ? data?.routeString : undefined
}
