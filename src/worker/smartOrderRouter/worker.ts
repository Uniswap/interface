import { BigintIsh, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import {
  AlphaRouter,
  ChainId
} from '@uniswap/smart-order-router'
import * as Comlink from 'comlink'
import JSBI from 'jsbi'

import { buildDependencies, DEFAULT_ROUTING_CONFIG } from './dependencies'
import { processSwapRoute } from './processSwapRoute'

const routerParamsByChain = buildDependencies()

const service = {
  async getQuote({
    tradeType,
    chainId,
    tokenIn,
    tokenOut,
    amount: amountRaw,
  }: {
    tradeType: TradeType.EXACT_INPUT | TradeType.EXACT_OUTPUT
    chainId: ChainId
    tokenIn: { address: string; chainId: number; decimals: number; symbol?: string }
    tokenOut: { address: string; chainId: number; decimals: number; symbol?: string }
    amount: BigintIsh
  }) {
    const params = routerParamsByChain[chainId]
    if (!params) {
      throw new Error('Router dependencies not initialized.')
    }

    const router = new AlphaRouter(params)

    const currencyIn = new Token(tokenIn.chainId, tokenIn.address, tokenIn.decimals, tokenIn.symbol)
    const currencyOut = new Token(tokenOut.chainId, tokenOut.address, tokenOut.decimals, tokenOut.symbol)
    const amount = CurrencyAmount.fromRawAmount(currencyIn, JSBI.BigInt(amountRaw))

    const swapRoute =
      tradeType === TradeType.EXACT_INPUT
        ? await router.routeExactIn(currencyIn, currencyOut, amount, undefined, DEFAULT_ROUTING_CONFIG)
        : await router.routeExactOut(currencyIn, currencyOut, amount, undefined, DEFAULT_ROUTING_CONFIG)

    // return GetQuoteResult for consistency with Routing API and WebWorker
    return swapRoute ? processSwapRoute(tradeType, amount, params.poolProvider, swapRoute) : undefined
  },
}

export type GetQuoteWorkerType = typeof service

Comlink.expose(service)
