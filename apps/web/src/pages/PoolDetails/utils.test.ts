import { PoolData } from 'appGraphql/data/pools/usePoolData'
import { getPoolDetailPageTitle } from 'pages/PoolDetails/utils'
import { validPoolDataResponse } from 'test-utils/pools/fixtures'
import i18n from 'uniswap/src/i18n'

describe('getPoolDetailPageTitle', () => {
  it('should return the base title when poolData is undefined', () => {
    const result = getPoolDetailPageTitle(i18n.t)
    expect(result).toBe('Buy and sell on Uniswap')
  })

  it('should return the base title when token symbols are undefined', () => {
    const poolData = {
      token0: { symbol: undefined },
      token1: { symbol: undefined },
    } as PoolData
    const result = getPoolDetailPageTitle(i18n.t, poolData)
    expect(result).toBe('Buy and sell on Uniswap')
  })

  it('should return the correct title when token symbols are defined', () => {
    const poolData: PoolData = validPoolDataResponse.data
    const result = getPoolDetailPageTitle(i18n.t, poolData)
    expect(result).toBe('USDC/WETH: Buy and sell on Uniswap')
  })
})
