import { t } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'

export const getTokenPageTitle = (currency?: Currency) => {
  const tokenName = currency?.name
  const tokenSymbol = currency?.symbol
  const baseTitle = t`Buy, sell, and trade on Uniswap`
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
