import { ChainId, Currency } from '@uniswap/sdk-core'
import { CHAIN_INFO, SupportedInterfaceChainId } from 'constants/chains'
import { t } from 'i18n'

export const getTokenPageTitle = (currency?: Currency, chainId?: SupportedInterfaceChainId) => {
  const tokenName = currency?.name
  const tokenSymbol = currency?.symbol
  const baseTitle = t`Buy and sell on Uniswap`
  if (!tokenName && !tokenSymbol) {
    return baseTitle
  }

  const chainSuffix = chainId && chainId !== ChainId.MAINNET ? ` on ${CHAIN_INFO[chainId].label}` : ''
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
  const chainSuffix = chainId && chainId !== ChainId.MAINNET ? ` on ${CHAIN_INFO[chainId].label}` : ''

  return `Buy, sell, and swap ${tokenPageName}${chainSuffix}. Real-time prices, charts, transaction data, and more.`
}
