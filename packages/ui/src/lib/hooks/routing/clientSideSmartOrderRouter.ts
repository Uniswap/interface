// This file is lazy-loaded, so the import of smart-order-router is intentional.
// eslint-disable-next-line no-restricted-imports
import { AlphaRouter, AlphaRouterConfig, ChainId, SwapOptions } from '@teleswap/smart-order-router'
import { BigintIsh, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { SupportedChainId } from 'constants/chains'
import JSBI from 'jsbi'
import { GetQuoteResult } from 'state/routing/types'
import { transformSwapRouteToGetQuoteResult } from 'utils/transformSwapRouteToGetQuoteResult'
import { Percent } from '@uniswap/sdk-core'

export function toSupportedChainId(chainId: ChainId): SupportedChainId | undefined {
  const numericChainId: number = chainId
  if (SupportedChainId[numericChainId]) return numericChainId
  return undefined
}
export function isSupportedChainId(chainId: ChainId | undefined): boolean {
  if (chainId === undefined) return false
  return toSupportedChainId(chainId) !== undefined
}

async function getQuote(
  {
    type,
    tokenIn,
    tokenOut,
    amount: amountRaw
  }: {
    type: 'exactIn' | 'exactOut'
    tokenIn: { address: string; chainId: number; decimals: number; symbol?: string }
    tokenOut: { address: string; chainId: number; decimals: number; symbol?: string }
    amount: BigintIsh
  },
  router: AlphaRouter,
  swapConfig: SwapOptions,
  config: Partial<AlphaRouterConfig>
): Promise<{ data: GetQuoteResult; error?: unknown }> {
  const currencyIn = new Token(tokenIn.chainId, tokenIn.address, tokenIn.decimals, tokenIn.symbol)
  const currencyOut = new Token(tokenOut.chainId, tokenOut.address, tokenOut.decimals, tokenOut.symbol)

  const baseCurrency = type === 'exactIn' ? currencyIn : currencyOut
  const quoteCurrency = type === 'exactIn' ? currencyOut : currencyIn
  const amount = CurrencyAmount.fromRawAmount(baseCurrency, JSBI.BigInt(amountRaw))

  const swapRoute = await router.route(
    amount,
    quoteCurrency,
    type === 'exactIn' ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
    swapConfig,
    config
  )

  if (!swapRoute) throw new Error('Failed to generate client side quote')

  return { data: transformSwapRouteToGetQuoteResult(type, amount, swapRoute, swapConfig) }
}

export interface QuoteArguments {
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
  recipient
  slippageTolerance
  deadline
}

export async function getClientSideQuote(
  {
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
    recipient,
    slippageTolerance,
    deadline
  }: QuoteArguments,
  router: AlphaRouter,
  config: Partial<AlphaRouterConfig>
) {
  const slippageTolerancePercent = parseSlippageTolerance(slippageTolerance)
  const swapConfig = {
    deadline: parseDeadline(deadline),
    recipient,
    slippageTolerance: slippageTolerancePercent
  }
  return getQuote(
    {
      type,
      tokenIn: {
        address: tokenInAddress,
        chainId: tokenInChainId,
        decimals: tokenInDecimals,
        symbol: tokenInSymbol
      },
      tokenOut: {
        address: tokenOutAddress,
        chainId: tokenOutChainId,
        decimals: tokenOutDecimals,
        symbol: tokenOutSymbol
      },
      amount
    },
    router,
    swapConfig,
    config
  )
}

export function parseSlippageTolerance(slippageTolerance: string): Percent {
  const slippagePer10k = Math.round(parseFloat(slippageTolerance) * 100)
  return new Percent(slippagePer10k, 10_000)
}

export function parseDeadline(deadline: string): number {
  return Math.floor(Date.now() / 1000) + parseInt(deadline)
}
