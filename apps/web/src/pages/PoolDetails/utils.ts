import { PoolData } from 'appGraphql/data/pools/usePoolData'
import { TFunction } from 'i18next'

export const getPoolDetailPageTitle = (t: TFunction, poolData?: PoolData) => {
  const token0Symbol = poolData?.token0.symbol
  const token1Symbol = poolData?.token1.symbol
  const baseTitle = t('common.buyAndSell')
  if (!token0Symbol || !token1Symbol) {
    return baseTitle
  }

  return `${token0Symbol}/${token1Symbol}: ${baseTitle}`
}
