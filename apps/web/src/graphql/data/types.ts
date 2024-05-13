import { gqlToCurrency } from 'graphql/data/util'
import { Token as GqlToken, SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { currencyId } from 'utils/currencyId'

// TODO(WEB-3839): replace all usage of Currency in the web app with CurrencyInfo

// TODO: remove this function once we have it in the shared package
export function gqlTokenToCurrencyInfo(token?: GqlToken): CurrencyInfo | undefined {
  if (!token) {
    return undefined
  }

  const currency = gqlToCurrency(token)

  if (!currency) {
    return undefined
  }

  const currencyInfo: CurrencyInfo = {
    currency,
    currencyId: currencyId(currency),
    logoUrl: token.project?.logo?.url ?? token.project?.logoUrl,
    safetyLevel: token.project?.safetyLevel ?? SafetyLevel.StrongWarning,
    isSpam: token.project?.isSpam ?? false,
  }
  return currencyInfo
}
