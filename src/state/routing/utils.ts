import { Currency, CurrencyAmount, Ether, Percent, Token, TradeType, WETH9 } from '@uniswap/sdk-core'
import { Pair, Route as V2Route } from '@uniswap/v2-sdk'
import JSBI from 'jsbi'

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

  const parsedCurrencyIn = currencyIn.isNative ? Ether.onChain(currencyIn.chainId) : parsedTokenIn
  const parsedCurrencyOut = currencyOut.isNative ? Ether.onChain(currencyOut.chainId) : parsedTokenOut

  try {
    // take the first route
    const bestProtocol = quoteResult.protocols[0]
    if (bestProtocol.length === 0) return []
    return bestProtocol.map((route) => {
      return route.map((r) => {
        const part = new Percent(parseFloat(r.part) * 100, 10000)

        const rawAmountIn = part.multiply(inAmount)
        const rawAmountOut = part.multiply(outAmount).multiply(JSBI.BigInt(2))
        if (!rawAmountIn || !rawAmountOut) {
          throw new Error('Expected both amountIn and amountOut to be present')
        }

        return new Pair(
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

const parseToken = ({ address, decimals, symbol, name }: TokenInRoute, chainId: number): Token => {
  return new Token(
    chainId,
    address == '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ? WETH9[chainId].address : address,
    parseInt(decimals.toString()),
    symbol,
    name
  )
}
