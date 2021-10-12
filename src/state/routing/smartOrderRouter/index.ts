import { BigintIsh, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { AlphaRouter, ChainId } from '@uniswap/smart-order-router'
import JSBI from 'jsbi'
import { GetQuoteResult } from 'state/routing/types'
import { processSwapRoute } from 'utils/processSwapRoute'

import { DEFAULT_ROUTING_CONFIG } from './constants'
import { buildDependencies } from './dependencies'

const routerParamsByChain = buildDependencies()

export async function getQuote({
  type,
  chainId,
  tokenIn,
  tokenOut,
  amount: amountRaw,
}: {
  type: 'exactIn' | 'exactOut'
  chainId: ChainId
  tokenIn: { address: string; chainId: number; decimals: number; symbol?: string }
  tokenOut: { address: string; chainId: number; decimals: number; symbol?: string }
  amount: BigintIsh
}): Promise<{ data: GetQuoteResult; error?: unknown }> {
  const params = routerParamsByChain[chainId]
  if (!params) {
    throw new Error('Router dependencies not initialized.')
  }

  const router = new AlphaRouter(params)

  const currencyIn = new Token(tokenIn.chainId, tokenIn.address, tokenIn.decimals, tokenIn.symbol)
  const currencyOut = new Token(tokenOut.chainId, tokenOut.address, tokenOut.decimals, tokenOut.symbol)
  const amount = CurrencyAmount.fromRawAmount(currencyIn, JSBI.BigInt(amountRaw))

  const method = type === 'exactIn' ? 'routeExactIn' : 'routeExactOut'
  const swapRoute = await router[method](currencyIn, currencyOut, amount, undefined, DEFAULT_ROUTING_CONFIG)

  if (!swapRoute) throw new Error('Failed to generate client side quote')

  return { data: processSwapRoute(type, amount, params.poolProvider, swapRoute) }
}

export interface Router extends Worker {
  getQuote: typeof getQuote
}
