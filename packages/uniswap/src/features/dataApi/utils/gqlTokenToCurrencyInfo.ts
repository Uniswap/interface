import { GraphQLApi } from '@universe/api'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { getCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils/getCurrencySafetyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'

// Type for the token parameter that gqlTokenToCurrencyInfo expects
export type GqlTokenToCurrencyInfoToken = Omit<NonNullable<NonNullable<GraphQLApi.TokenQuery['token']>>, 'project'> & {
  project?: Omit<NonNullable<NonNullable<GraphQLApi.TokenQuery['token']>['project']>, 'tokens'>
}

export function gqlTokenToCurrencyInfo(token: GqlTokenToCurrencyInfoToken): CurrencyInfo | null {
  const { name, chain, address, decimals, symbol, project, feeData, protectionInfo, isBridged, bridgedWithdrawalInfo } =
    token
  const chainId = fromGraphQLChain(chain)

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

  return buildCurrencyInfo({
    currency,
    currencyId: currencyId(currency),
    logoUrl: project?.logoUrl,
    safetyInfo: getCurrencySafetyInfo(project?.safetyLevel, protectionInfo),
    // defaulting to not spam. currently this flow triggers when a user is searching
    // for a token, in which case the user probably doesn't expect the token to be spam
    isSpam: project?.isSpam ?? false,
    isBridged,
    bridgedWithdrawalInfo,
  })
}
