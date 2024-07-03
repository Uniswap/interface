import { Currency } from '@uniswap/sdk-core'
import { SupportedInterfaceChainId } from 'constants/chains'
import { t } from 'i18n'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { UniverseChainId } from 'uniswap/src/types/chains'

export const getTokenPageTitle = (currency?: Currency, chainId?: SupportedInterfaceChainId) => {
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

export const getTokenPageDescription = (currency?: Currency, chainId?: SupportedInterfaceChainId) => {
  const tokenPageName =
    currency?.name && currency?.symbol
      ? `${currency?.name} (${currency?.symbol})`
      : currency?.name ?? currency?.symbol ?? 'tokens'
  const chainSuffix = chainId && chainId !== UniverseChainId.Mainnet ? ` on ${UNIVERSE_CHAIN_INFO[chainId].label}` : ''

  return `Buy, sell, and swap ${tokenPageName}${chainSuffix}. Real-time prices, charts, transaction data, and more.`
}
