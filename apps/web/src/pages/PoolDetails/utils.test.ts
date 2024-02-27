import { PoolData } from 'graphql/data/pools/usePoolData'
import { validPoolDataResponse } from 'test-utils/pools/fixtures'
import { getPoolDetailPageTitle } from './utils'

describe('getPoolDetailPageTitle', () => {
  it('should return the base title when poolData is undefined', () => {
    const result = getPoolDetailPageTitle()
    expect(result).toBe('Buy, sell, and trade on Uniswap')
  })

  it('should return the base title when token symbols are undefined', () => {
    const poolData = {
      token0: { symbol: undefined },
      token1: { symbol: undefined },
    } as PoolData
    const result = getPoolDetailPageTitle(poolData)
    expect(result).toBe('Buy, sell, and trade on Uniswap')
  })

  it('should return the correct title when token symbols are defined', () => {
    const poolData: PoolData = validPoolDataResponse.data
    const result = getPoolDetailPageTitle(poolData)
    expect(result).toBe('USDC/WETH: Buy, sell, and trade on Uniswap')
  })
})
