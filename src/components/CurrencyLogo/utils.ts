import { Currency } from '@uniswap/sdk-core'
import { getTokenLogoURL } from 'src/components/CurrencyLogo'
import { ChainId } from 'src/constants/chains'
import { WrappedTokenInfo } from 'src/features/tokenLists/wrappedTokenInfo'

export function getCurrencyLogoSrcs(currency: Currency) {
  if (!currency || currency.isNative) return []

  if (currency.isToken) {
    const defaultUrls =
      currency.chainId === ChainId.MAINNET ? [getTokenLogoURL(currency.address)] : []
    if (currency instanceof WrappedTokenInfo && currency.logoURI) {
      return [...defaultUrls, currency.logoURI]
    }
    return defaultUrls
  }
  return []
}
