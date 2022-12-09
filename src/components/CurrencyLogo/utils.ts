import { Currency } from '@uniswap/sdk-core'
import { ChainId } from 'src/constants/chains'
import { getTokenLogoURL } from 'src/constants/urls'
import { WrappedTokenInfo } from 'src/features/tokenLists/wrappedTokenInfo'

// TODO: deprecate this
export function getCurrencyLogoSrcs(currency: NullUndefined<Currency>) {
  if (!currency?.isToken) return []

  const defaultUrls =
    currency.chainId === ChainId.Mainnet ? [getTokenLogoURL(currency.address)] : []
  if (currency instanceof WrappedTokenInfo && currency.logoURI) {
    return [...defaultUrls, currency.logoURI]
  }
  return defaultUrls
}
