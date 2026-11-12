import { isToken0Quote, orderPoolDataByQuoteToken } from 'uniswap/src/features/pools/quoteToken'

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const NATIVE = '0x0000000000000000000000000000000000000000'

describe('isToken0Quote', () => {
  it('is true when the quote is token0', () => {
    expect(isToken0Quote({ token0Address: USDC, quoteTokenAddress: USDC })).toBe(true)
  })

  it('is false when the quote is token1', () => {
    expect(isToken0Quote({ token0Address: USDC, quoteTokenAddress: WETH })).toBe(false)
  })

  it('compares addresses case-insensitively', () => {
    expect(isToken0Quote({ token0Address: USDC.toLowerCase(), quoteTokenAddress: USDC })).toBe(true)
  })

  it('matches a native leg served as the zero address', () => {
    expect(isToken0Quote({ token0Address: NATIVE, quoteTokenAddress: NATIVE })).toBe(true)
  })

  it('keeps token0 / token1 order while the quote is unresolved', () => {
    expect(isToken0Quote({ token0Address: USDC, quoteTokenAddress: undefined })).toBe(false)
  })

  it('is false without a token0 address', () => {
    expect(isToken0Quote({ token0Address: undefined, quoteTokenAddress: USDC })).toBe(false)
  })
})

describe('orderPoolDataByQuoteToken', () => {
  it('keeps the legs in order when token1 is the quote', () => {
    expect(orderPoolDataByQuoteToken({ token0IsQuote: false, data0: 'a', data1: 'b' })).toEqual(['a', 'b'])
    expect(orderPoolDataByQuoteToken({ token0IsQuote: undefined, data0: 'a', data1: 'b' })).toEqual(['a', 'b'])
  })

  it('swaps the legs when token0 is the quote', () => {
    expect(orderPoolDataByQuoteToken({ token0IsQuote: true, data0: 'a', data1: 'b' })).toEqual(['b', 'a'])
  })
})
