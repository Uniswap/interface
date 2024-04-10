import { Currency } from '@uniswap/sdk-core'
import { Token as GqlToken, SafetyLevel } from 'graphql/data/__generated__/types-and-hooks'
import { gqlToCurrency } from 'graphql/data/util'
import { currencyId } from 'utils/currencyId'

// TODO: use shared versions of these types/utils when they are moved to the packages/uniswap package
// TODO(WEB-3839): replace all usage of Currency in the web app with CurrencyInfo

// eslint-disable-next-line import/no-unused-modules
export type CurrencyInfo = {
  currency: Currency
  currencyId: string
  safetyLevel: Maybe<SafetyLevel>
  logoUrl: Maybe<string>
  isSpam?: Maybe<boolean>
}

// eslint-disable-next-line import/no-unused-modules
export function gqlTokenToCurrencyInfo(token: GqlToken): CurrencyInfo | undefined {
  const currency = gqlToCurrency(token)

  if (!currency) {
    return undefined
  }

  const currencyInfo: CurrencyInfo = {
    currency,
    currencyId: currencyId(currency),
    logoUrl: token.project?.logo?.url,
    safetyLevel: token.project?.safetyLevel ?? SafetyLevel.StrongWarning,
    isSpam: token.project?.isSpam ?? false,
  }
  return currencyInfo
}
