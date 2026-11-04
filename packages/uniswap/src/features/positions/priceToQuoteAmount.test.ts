import { Price, Token } from '@uniswap/sdk-core'
import { priceToQuoteAmount } from 'uniswap/src/features/positions/priceToQuoteAmount'
import { describe, expect, it } from 'vitest'

const LONG_TAIL = new Token(1, '0x0000000000000000000000000000000000000001', 18, 'CASHCAT', 'CashCat')
const WETH = new Token(1, '0x0000000000000000000000000000000000000002', 18, 'WETH', 'Wrapped Ether')
const USDC = new Token(1, '0x0000000000000000000000000000000000000003', 6, 'USDC', 'USD Coin')

describe('priceToQuoteAmount', () => {
  it('returns undefined for a missing price', () => {
    expect(priceToQuoteAmount(undefined)).toBeUndefined()
  })

  it('returns the quote amount for 1 base token', () => {
    const amount = priceToQuoteAmount(new Price(LONG_TAIL, WETH, 1, 2000))

    expect(amount?.currency).toBe(WETH)
    expect(amount?.toExact()).toBe('2000')
  })

  it('keeps full precision for long-tail prices that Price.toFixed() rounds', () => {
    // 6.15e-5 WETH per token; toFixed() would give '0.0001'
    const price = new Price(LONG_TAIL, WETH, 10_000_000, 615)

    expect(price.toFixed()).toBe('0.0001')
    expect(priceToQuoteAmount(price)?.toExact()).toBe('0.0000615')
  })

  it('returns a non-zero amount for prices below 5e-5 that Price.toFixed() rounds to zero', () => {
    const price = new Price(LONG_TAIL, WETH, 10_000_000_000, 123)

    expect(price.toFixed()).toBe('0.0000')
    expect(priceToQuoteAmount(price)?.toExact()).toBe('0.0000000123')
  })

  it('handles differing base/quote decimals', () => {
    // 1 USDC (6 decimals) = 0.0005 WETH (18 decimals)
    const amount = priceToQuoteAmount(new Price(USDC, WETH, 1_000_000, 500_000_000_000_000))

    expect(amount?.currency).toBe(WETH)
    expect(amount?.toExact()).toBe('0.0005')
  })

  it('returns undefined when the price has a zero denominator', () => {
    expect(priceToQuoteAmount(new Price(LONG_TAIL, WETH, 0, 1))).toBeUndefined()
  })
})
