import { Currency } from '@uniswap/sdk-core'
import { TFunction } from 'i18next'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'

export function getTokenPageTitle({
  t,
  currency,
  chainId,
}: {
  t: TFunction
  currency?: Currency
  chainId?: UniverseChainId
}) {
  const tokenName = currency?.name
  const tokenSymbol = currency?.symbol
  const baseTitle = t('common.buyAndSell')
  if (!tokenName && !tokenSymbol) {
    return baseTitle
  }

  const chainSuffix = chainId && chainId !== UniverseChainId.Mainnet ? ` on ${getChainLabel(chainId)}` : ''
  if (!tokenName && tokenSymbol) {
    return `${tokenSymbol}${chainSuffix}: ${baseTitle}`
  }
  if (tokenName && !tokenSymbol) {
    return `${tokenName}${chainSuffix}: ${baseTitle}`
  }
  return `${tokenName} (${tokenSymbol})${chainSuffix}: ${baseTitle}`
}

export const getTokenPageDescription = (currency?: Currency, chainId?: UniverseChainId) => {
  const tokenPageName =
    currency?.name && currency.symbol
      ? `${currency.name} (${currency.symbol})`
      : (currency?.name ?? currency?.symbol ?? 'tokens')
  const chainSuffix = chainId && chainId !== UniverseChainId.Mainnet ? ` on ${getChainLabel(chainId)}` : ''

  return `Buy, sell, and swap ${tokenPageName}${chainSuffix}. Real-time prices, charts, transaction data, and more.`
}
