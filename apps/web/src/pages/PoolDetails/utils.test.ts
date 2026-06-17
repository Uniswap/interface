import { GraphQLApi } from '@universe/api'
import i18n from 'uniswap/src/i18n'
import { getPoolDetailPageTitle } from '~/pages/PoolDetails/utils'
import { validBEPoolToken0, validBEPoolToken1 } from '~/test-utils/pools/fixtures'

describe('getPoolDetailPageTitle', () => {
  it('should return the base title when tokens are undefined', () => {
    const result = getPoolDetailPageTitle(i18n.t)
    expect(result).toBe('Buy and sell on Uniswap')
  })

  it('should return the base title when token symbols are undefined', () => {
    const result = getPoolDetailPageTitle(i18n.t, {
      token0: { symbol: undefined } as GraphQLApi.Token,
      token1: { symbol: undefined } as GraphQLApi.Token,
    })
    expect(result).toBe('Buy and sell on Uniswap')
  })

  it('should order the symbols by waterfall priority (stablecoin as quote)', () => {
    const result = getPoolDetailPageTitle(i18n.t, { token0: validBEPoolToken0, token1: validBEPoolToken1 })
    expect(result).toBe('WETH/USDC: Buy and sell on Uniswap')
  })
})
