import { t } from '@lingui/macro'
import { TokenQuery } from 'graphql/data/__generated__/types-and-hooks'

export const getTokenPageTitle = (tokenQuery: TokenQuery) => {
  const tokenName = tokenQuery?.token?.name
  const tokenSymbol = tokenQuery?.token?.symbol
  const baseTitle = t`Buy, Sell, and Trade on Uniswap`
  if (!tokenName && !tokenSymbol) {
    return baseTitle
  }
  if (!tokenName && tokenSymbol) {
    return t`${tokenSymbol}: ${baseTitle}`
  }
  if (tokenName && !tokenSymbol) {
    return t`${tokenName}: ${baseTitle}`
  }
  return t`${tokenName} (${tokenSymbol}): ${baseTitle}`
}
