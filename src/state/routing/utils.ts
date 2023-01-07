import { Currency, CurrencyAmount, Percent, sqrt, Token } from '@uniswap/sdk-core'
import { encodeSqrtRatioX96, FeeAmount, nearestUsableTick, Pool, TICK_SPACINGS, TickMath } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'

import { nativeOnChain, WRAPPED_NATIVE_CURRENCY } from '../../constants/tokens'
import { GetSwapInchResult, TokenInRoute } from './types'

/**
 * Transforms a Routing API quote into an array of routes that
 * can be used to create a V3 `Trade`.
 */
export function computeRoutes(
  currencyIn: Currency | undefined,
  currencyOut: Currency | undefined,
  fromToken: TokenInRoute | undefined,
  toToken: TokenInRoute | undefined,
  quoteResult: Pick<GetSwapInchResult, 'protocols'> | undefined,
  inAmount: string | undefined,
  outAmount: string | undefined
) {
  if (
    !quoteResult ||
    !quoteResult.protocols ||
    !currencyIn ||
    !currencyOut ||
    !inAmount ||
    !outAmount ||
    !fromToken ||
    !toToken
  )
    return undefined

  if (quoteResult.protocols.length === 0) return []

  const parsedTokenIn = parseToken(fromToken, currencyIn.chainId)
  const parsedTokenOut = parseToken(toToken, currencyOut.chainId)

  if (parsedTokenIn.address !== currencyIn.wrapped.address) return undefined
  if (parsedTokenOut.address !== currencyOut.wrapped.address) return undefined

  const parsedCurrencyIn = currencyIn.isNative ? nativeOnChain(currencyIn.chainId) : parsedTokenIn
  const parsedCurrencyOut = currencyOut.isNative ? nativeOnChain(currencyOut.chainId) : parsedTokenOut

  try {
    // take the first route
    const bestProtocol = quoteResult.protocols[0]
    if (bestProtocol.length === 0) return []
    return bestProtocol.map((route) => {
      return route.map((r) => {
        const part = new Percent(parseFloat(r.part) * 100, 10000)

        const rawAmountIn = part.multiply(inAmount)
        const rawAmountOut = part.multiply(outAmount)
        if (!rawAmountIn || !rawAmountOut) {
          throw new Error('Expected both amountIn and amountOut to be present')
        }

        return v2StylePool(
          CurrencyAmount.fromRawAmount(parseToken(fromToken, currencyIn.chainId), rawAmountIn.quotient),
          CurrencyAmount.fromRawAmount(parseToken(toToken, currencyOut.chainId), rawAmountOut.quotient)
        )
      })
    })
  } catch (e) {
    console.log(e)
    // `Route` constructor may throw if inputs/outputs are temporarily out of sync
    // (RTK-Query always returns the latest data which may not be the right inputs/outputs)
    // This is not fatal and will fix itself in future render cycles
    return undefined
  }
}

export function v2StylePool(
  reserve0: CurrencyAmount<Token>,
  reserve1: CurrencyAmount<Token>,
  feeAmount: FeeAmount = FeeAmount.MEDIUM
) {
  const sqrtRatioX96 = encodeSqrtRatioX96(reserve1.quotient, reserve0.quotient)
  const liquidity = sqrt(JSBI.multiply(reserve0.quotient, reserve1.quotient))
  return new Pool(
    reserve0.currency,
    reserve1.currency,
    feeAmount,
    sqrtRatioX96,
    liquidity,
    TickMath.getTickAtSqrtRatio(sqrtRatioX96),
    [
      {
        index: nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeAmount]),
        liquidityNet: liquidity,
        liquidityGross: liquidity,
      },
      {
        index: nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[feeAmount]),
        liquidityNet: JSBI.multiply(liquidity, JSBI.BigInt(-1)),
        liquidityGross: liquidity,
      },
    ]
  )
}

const parseToken = ({ address, decimals, symbol, name }: TokenInRoute, chainId: number): Token => {
  return new Token(
    chainId,
    address == '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ? WRAPPED_NATIVE_CURRENCY[chainId].address : address,
    parseInt(decimals.toString()),
    symbol,
    name
  )
}
