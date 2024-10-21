import { Currency } from '@uniswap/sdk-core'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { t } from 'uniswap/src/i18n'
import { UniverseChainId } from 'uniswap/src/types/chains'

export const getTokenPageTitle = (currency?: Currency, chainId?: UniverseChainId) => {
  const tokenName = currency?.name
  const tokenSymbol = currency?.symbol
  const baseTitle = t('common.buyAndSell')
  if (!tokenName && !tokenSymbol) {
    return baseTitle
  }

  const chainSuffix = chainId && chainId !== UniverseChainId.Mainnet ? ` on ${UNIVERSE_CHAIN_INFO[chainId].label}` : ''
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
    currency?.name && currency?.symbol
      ? `${currency?.name} (${currency?.symbol})`
      : currency?.name ?? currency?.symbol ?? 'tokens'
  const chainSuffix = chainId && chainId !== UniverseChainId.Mainnet ? ` on ${UNIVERSE_CHAIN_INFO[chainId].label}` : ''

  return `Buy, sell, and swap ${tokenPageName}${chainSuffix}. Real-time prices, charts, transaction data, and more.`
}
