import { TFunction } from 'i18next'
import type { ParsedToken } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { getPoolName } from 'uniswap/src/features/pools/names'

export const getPoolDetailPageTitle = (
  t: TFunction,
  tokens?: { token0?: ParsedToken; token1?: ParsedToken; isToken0Quote?: boolean },
) => {
  const baseTitle = t('common.buyAndSell')
  const poolName = getPoolName({
    symbol0: tokens?.token0?.symbol,
    symbol1: tokens?.token1?.symbol,
    token0IsQuote: tokens?.isToken0Quote,
  })

  return poolName ? `${poolName}: ${baseTitle}` : baseTitle
}
