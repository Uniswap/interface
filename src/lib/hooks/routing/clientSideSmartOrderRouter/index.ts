import { Protocol } from '@uniswap/router-sdk'
import { BigintIsh, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { AlphaRouter, AlphaRouterConfig, ChainId } from '@uniswap/smart-order-router'
import JSBI from 'jsbi'
import { GetQuoteResult } from 'state/routing/types'
import { transformSwapRouteToGetQuoteResult } from 'utils/transformSwapRouteToGetQuoteResult'

import { buildDependencies } from './dependencies'

const routerParamsByChain = buildDependencies()

async function getQuote(
  {
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
  },
  alphaRouterConfig: Partial<AlphaRouterConfig>
): Promise<{ data: GetQuoteResult; error?: unknown }> {
  const params = routerParamsByChain[chainId]
  if (!params) {
    throw new Error('Router dependencies not initialized.')
  }

  const router = new AlphaRouter(params)

  const currencyIn = new Token(tokenIn.chainId, tokenIn.address, tokenIn.decimals, tokenIn.symbol)
  const currencyOut = new Token(tokenOut.chainId, tokenOut.address, tokenOut.decimals, tokenOut.symbol)

  const baseCurrency = type === 'exactIn' ? currencyIn : currencyOut
  const quoteCurrency = type === 'exactIn' ? currencyOut : currencyIn
  const amount = CurrencyAmount.fromRawAmount(baseCurrency, JSBI.BigInt(amountRaw))

  const swapRoute = await router.route(
    amount,
    quoteCurrency,
    type === 'exactIn' ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
    /*swapConfig=*/ undefined,
    alphaRouterConfig
  )

  if (!swapRoute) throw new Error('Failed to generate client side quote')

  return { data: transformSwapRouteToGetQuoteResult(type, amount, swapRoute) }
}

const protocols: Protocol[] = [Protocol.V2, Protocol.V3]

interface QuoteArguments {
  tokenInAddress: string
  tokenInChainId: ChainId
  tokenInDecimals: number
  tokenInSymbol?: string
  tokenOutAddress: string
  tokenOutChainId: ChainId
  tokenOutDecimals: number
  tokenOutSymbol?: string
  amount: string
  type: 'exactIn' | 'exactOut'
}

export async function getClientSideQuote({
  tokenInAddress,
  tokenInChainId,
  tokenInDecimals,
  tokenInSymbol,
  tokenOutAddress,
  tokenOutChainId,
  tokenOutDecimals,
  tokenOutSymbol,
  amount,
  type,
}: QuoteArguments) {
  return getQuote(
    {
      type,
      chainId: tokenInChainId,
      tokenIn: {
        address: tokenInAddress,
        chainId: tokenInChainId,
        decimals: tokenInDecimals,
        symbol: tokenInSymbol,
      },
      tokenOut: {
        address: tokenOutAddress,
        chainId: tokenOutChainId,
        decimals: tokenOutDecimals,
        symbol: tokenOutSymbol,
      },
      amount,
    },
    { protocols }
  )
}
