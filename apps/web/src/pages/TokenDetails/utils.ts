import { Currency } from '@uniswap/sdk-core'
import { t } from 'i18n'

export const getTokenPageTitle = (currency?: Currency) => {
  const tokenName = currency?.name
  const tokenSymbol = currency?.symbol
  const baseTitle = t`Buy, sell, and trade on Uniswap`
  if (!tokenName && !tokenSymbol) {
    return baseTitle
  }
  if (!tokenName && tokenSymbol) {
    return `${tokenSymbol}: ${baseTitle}`
  }
  if (tokenName && !tokenSymbol) {
    return `${tokenName}: ${baseTitle}`
  }
  return `${tokenName} (${tokenSymbol}): ${baseTitle}`
}
