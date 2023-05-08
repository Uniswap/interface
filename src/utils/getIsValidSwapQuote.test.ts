import { TradeState } from 'state/routing/types'
import { TEST_TRADE_EXACT_INPUT } from 'test-utils/constants'

import { getIsValidSwapQuote } from './getIsValidSwapQuote'

describe('getIsValidSwapQuote', () => {
  it('should return true when swapInputError is truthy and trade and tradeState are truthy', () => {
    const swapInputError = 'swapInputError'
    expect(getIsValidSwapQuote(TEST_TRADE_EXACT_INPUT, TradeState.VALID, swapInputError)).toBe(true)
    expect(getIsValidSwapQuote(TEST_TRADE_EXACT_INPUT, TradeState.SYNCING, swapInputError)).toBe(true)
  })

  it('should return false when swapInputError is falsy and trade and tradeState are truthy', () => {
    const swapInputError = ''
    expect(getIsValidSwapQuote(TEST_TRADE_EXACT_INPUT, TradeState.VALID, swapInputError)).toBe(false)
  })

  it('should return false when swapInputError is truthy and trade/tradeState are falsy', () => {
    const swapInputError = 'swapInputError'
    // tradeState falsy
    expect(getIsValidSwapQuote(TEST_TRADE_EXACT_INPUT, TradeState.INVALID, swapInputError)).toBe(false)
    expect(getIsValidSwapQuote(TEST_TRADE_EXACT_INPUT, TradeState.NO_ROUTE_FOUND, swapInputError)).toBe(false)
    expect(getIsValidSwapQuote(TEST_TRADE_EXACT_INPUT, TradeState.LOADING, swapInputError)).toBe(false)
    // trade falsy
    expect(getIsValidSwapQuote(undefined, TradeState.VALID, swapInputError)).toBe(false)
    expect(getIsValidSwapQuote(undefined, TradeState.SYNCING, swapInputError)).toBe(false)
    // both falsey
    expect(getIsValidSwapQuote(undefined, TradeState.INVALID, swapInputError)).toBe(false)
    expect(getIsValidSwapQuote(undefined, TradeState.NO_ROUTE_FOUND, swapInputError)).toBe(false)
  })

  it('should return false when swapInputError is falsy and trade and tradeState are falsy', () => {
    const swapInputError = ''
    expect(getIsValidSwapQuote(undefined, TradeState.INVALID, swapInputError)).toBe(false)
  })
})
