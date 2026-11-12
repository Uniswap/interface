import { UniverseChainId } from '@universe/chains'
import i18n from 'uniswap/src/i18n'
import { getPoolDetailPageTitle } from '~/pages/PoolDetails/utils'
import { validParsedPoolToken0, validParsedPoolToken1 } from '~/test-utils/pools/fixtures'

describe('getPoolDetailPageTitle', () => {
  it('should return the base title when tokens are undefined', () => {
    const result = getPoolDetailPageTitle(i18n.t)
    expect(result).toBe('Buy and sell on Uniswap')
  })

  it('should return the base title when token symbols are undefined', () => {
    const result = getPoolDetailPageTitle(i18n.t, {
      token0: { chainId: UniverseChainId.Mainnet, symbol: undefined },
      token1: { chainId: UniverseChainId.Mainnet, symbol: undefined },
    })
    expect(result).toBe('Buy and sell on Uniswap')
  })

  it('should keep token0/token1 order when token1 is the quote', () => {
    const result = getPoolDetailPageTitle(i18n.t, { token0: validParsedPoolToken0, token1: validParsedPoolToken1 })
    expect(result).toBe(`${validParsedPoolToken0.symbol}/${validParsedPoolToken1.symbol}: Buy and sell on Uniswap`)
  })

  it('should show token0 second when it is the quote', () => {
    const result = getPoolDetailPageTitle(i18n.t, {
      token0: validParsedPoolToken0,
      token1: validParsedPoolToken1,
      isToken0Quote: true,
    })
    expect(result).toBe(`${validParsedPoolToken1.symbol}/${validParsedPoolToken0.symbol}: Buy and sell on Uniswap`)
  })
})
