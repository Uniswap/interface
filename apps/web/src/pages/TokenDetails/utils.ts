import { t } from '@lingui/macro'
import { TokenQuery } from 'graphql/data/__generated__/types-and-hooks'

export const getTokenPageTitle = (tokenQuery: TokenQuery, omitSearchDetail?: boolean) => {
  const tokenName = tokenQuery?.token?.name
  const tokenSymbol = tokenQuery?.token?.symbol
  const baseTitle = 'Buy & Trade'
  const searchDetail = omitSearchDetail ? '' : ': Live Price & Chart on Uniswap'
  if (!tokenName && !tokenSymbol) {
    return t`${baseTitle}${searchDetail}`
  }
  if (!tokenName && tokenSymbol) {
    return t`${baseTitle} ${tokenSymbol}${searchDetail}`
  }
  if (tokenName && !tokenSymbol) {
    return t`${baseTitle} ${tokenName}${searchDetail}`
  }
  return t`${baseTitle} ${tokenName} (${tokenSymbol})${searchDetail}`
}
