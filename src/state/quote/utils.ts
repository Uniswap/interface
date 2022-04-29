import { Currency, CurrencyAmount, Ether, Percent, Token, TradeType, WETH9 } from '@uniswap/sdk-core'
import { Pair, Route as V2Route } from '@uniswap/v2-sdk'
import JSBI from 'jsbi'
import { v2StylePool } from 'state/routing/utils'

import { GetQuote0xResult } from './types'

/**
 * Transforms a Routing API quote into an array of routes that
 * can be used to create a V3 `Trade`.
 */
export function computeRoutes0x(
  currencyIn: Currency | undefined,
  currencyOut: Currency | undefined,
  tradeType: TradeType,
  quoteResult: Pick<GetQuote0xResult, 'orders'> | undefined
) {
  if (!quoteResult || !quoteResult.orders || !currencyIn || !currencyOut) return undefined

  if (quoteResult.orders.length === 0) return []

  const parsedCurrencyIn = currencyIn.isNative ? WETH9[currencyIn.chainId] : currencyIn
  const parsedCurrencyOut = currencyOut.isNative ? WETH9[currencyOut.chainId] : currencyOut

  try {
    return quoteResult.orders.map((order) => {
      const inputCurr = CurrencyAmount.fromRawAmount(parsedCurrencyIn, order.takerAmount)
      const outCurr = CurrencyAmount.fromRawAmount(parsedCurrencyOut, order.makerAmount)
      if (inputCurr.equalTo('0') || outCurr.equalTo('0')) return
      return v2StylePool(inputCurr, outCurr)
    })
  } catch (e) {
    console.log(e)
    // `Route` constructor may throw if inputs/outputs are temporarily out of sync
    // (RTK-Query always returns the latest data which may not be the right inputs/outputs)
    // This is not fatal and will fix itself in future render cycles
    return undefined
  }
}
