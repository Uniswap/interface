import { GraphQLApi } from '@universe/api'
import { TFunction } from 'i18next'
import { shouldReverseForWaterfall } from 'uniswap/src/features/tokens/waterfallPriority'
import { gqlToCurrency } from '~/appGraphql/data/util'

export const getPoolDetailPageTitle = (
  t: TFunction,
  tokens?: { token0?: GraphQLApi.Token; token1?: GraphQLApi.Token },
) => {
  const baseTitle = t('common.buyAndSell')
  const { token0, token1 } = tokens ?? {}
  if (!token0?.symbol || !token1?.symbol) {
    return baseTitle
  }

  const currency0 = gqlToCurrency(token0)
  const currency1 = gqlToCurrency(token1)
  const reverse = currency0 && currency1 ? shouldReverseForWaterfall(currency0, currency1) : false
  const [baseSymbol, quoteSymbol] = reverse ? [token1.symbol, token0.symbol] : [token0.symbol, token1.symbol]

  return `${baseSymbol}/${quoteSymbol}: ${baseTitle}`
}
