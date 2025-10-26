import { GraphQLApi } from '@universe/api'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { buildCurrency } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import {
  GqlTokenToCurrencyInfoToken,
  gqlTokenToCurrencyInfo,
} from 'uniswap/src/features/dataApi/utils/gqlTokenToCurrencyInfo'
import { ethToken, removeSafetyInfo } from 'uniswap/src/test/fixtures'

describe(gqlTokenToCurrencyInfo, () => {
  it('returns formatted CurrencyInfo for a given token', () => {
    const token = ethToken()
    const result = removeSafetyInfo(gqlTokenToCurrencyInfo(token satisfies GqlTokenToCurrencyInfoToken))

    expect(result).toEqual({
      currency: buildCurrency({
        chainId: fromGraphQLChain(token.chain),
        address: token.address,
        decimals: token.decimals,
        symbol: token.symbol,
        name: token.name,
      }),
      currencyId: `${fromGraphQLChain(token.chain)}-${token.address}`,
      logoUrl: token.project.logoUrl,
      isSpam: token.project.isSpam,
    })
  })

  it('returns null if currency is invalid', () => {
    const result = gqlTokenToCurrencyInfo(
      ethToken({ chain: 'INVALID' as GraphQLApi.Chain }) satisfies GqlTokenToCurrencyInfoToken,
    )

    expect(result).toBeNull()
  })
})
