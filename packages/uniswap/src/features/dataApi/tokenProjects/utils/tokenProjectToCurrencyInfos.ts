import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { getCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils/getCurrencySafetyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'

export function tokenProjectToCurrencyInfos(
  tokenProjects: GraphQLApi.TokenProjectsQuery['tokenProjects'],
  chainFilter?: UniverseChainId | null,
): CurrencyInfo[] {
  return tokenProjects
    ?.flatMap((project) =>
      project?.tokens.map((token) => {
        const { logoUrl, safetyLevel } = project
        const { name, chain, address, decimals, symbol, feeData, protectionInfo } = token
        const chainId = fromGraphQLChain(chain)

        if (chainFilter && chainFilter !== chainId) {
          return null
        }

        const currency = buildCurrency({
          chainId,
          address,
          decimals,
          symbol,
          name,
          buyFeeBps: feeData?.buyFeeBps,
          sellFeeBps: feeData?.sellFeeBps,
        })

        if (!currency) {
          return null
        }

        const currencyInfo = buildCurrencyInfo({
          currency,
          currencyId: currencyId(currency),
          logoUrl,
          safetyInfo: getCurrencySafetyInfo(safetyLevel, protectionInfo),
        })

        return currencyInfo
      }),
    )
    .filter(Boolean) as CurrencyInfo[]
}
