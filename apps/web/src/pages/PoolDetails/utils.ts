import { t } from '@lingui/macro'
import { PoolData } from 'graphql/data/pools/usePoolData'

export const getPoolDetailPageTitle = (poolData?: PoolData) => {
  const token0Symbol = poolData?.token0.symbol
  const token1Symbol = poolData?.token1.symbol

  const baseTitle = t`Buy, sell, and trade on Uniswap`
  if (!token0Symbol || !token1Symbol) {
    return baseTitle
  }

  return `${token0Symbol}/${token1Symbol}: ${baseTitle}`
}
