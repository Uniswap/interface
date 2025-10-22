import type { GraphQLApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { tokenProjectToCurrencyInfos } from 'uniswap/src/features/dataApi/tokenProjects/utils/tokenProjectToCurrencyInfos'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { removeSafetyInfo, usdcTokenProject } from 'uniswap/src/test/fixtures'

describe(tokenProjectToCurrencyInfos, () => {
  const project = usdcTokenProject()

  const getExpectedResult = (token: GraphQLApi.Token): CurrencyInfo =>
    ({
      logoUrl: project.logoUrl,
      currencyId: `${fromGraphQLChain(token.chain)}-${token.address}`,
      currency: buildCurrency({
        chainId: fromGraphQLChain(token.chain),
        address: token.address,
        decimals: token.decimals,
        symbol: token.symbol,
        name: token.name ?? project.name,
      }),
    }) as CurrencyInfo

  it('converts tokenProject to CurrencyInfo', () => {
    const result = tokenProjectToCurrencyInfos([project]).map(removeSafetyInfo)

    expect(result).toEqual(project.tokens.map((token) => getExpectedResult(token)))
  })

  it('filters by chainId if chainFilter is provided', () => {
    const result = tokenProjectToCurrencyInfos([project], UniverseChainId.Polygon).map(removeSafetyInfo)

    expect(result).toEqual(
      project.tokens.filter((token) => token.chain === 'POLYGON').map((token) => getExpectedResult(token)),
    )
  })

  it('filters out values for which currency is invalid', () => {
    const projectWithInvalidTokens = {
      ...project,
      tokens: [
        project.tokens[0],
        {
          ...project.tokens[1],
          chain: 'INVALID',
        },
      ],
    } as GraphQLApi.TokenProject

    const result = tokenProjectToCurrencyInfos([projectWithInvalidTokens], UniverseChainId.Mainnet).map(
      removeSafetyInfo,
    )

    expect(result).toEqual([getExpectedResult(project.tokens[0] as GraphQLApi.Token)])
  })
})
