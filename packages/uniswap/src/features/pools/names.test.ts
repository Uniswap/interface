import { getPoolName } from 'uniswap/src/features/pools/names'

describe('getPoolName', () => {
  it('names the pool token0/token1 when token1 is the quote', () => {
    expect(getPoolName({ symbol0: 'ETH', symbol1: 'USDC' })).toBe('ETH/USDC')
  })

  it('puts token0 second when it is the quote', () => {
    expect(getPoolName({ symbol0: 'USDC', symbol1: 'ETH', token0IsQuote: true })).toBe('ETH/USDC')
  })

  it('spaces the separator on request', () => {
    expect(getPoolName({ symbol0: 'ETH', symbol1: 'USDC', spaced: true })).toBe('ETH / USDC')
  })

  it('is undefined when a symbol is missing', () => {
    expect(getPoolName({ symbol0: undefined, symbol1: 'USDC' })).toBeUndefined()
  })
})
