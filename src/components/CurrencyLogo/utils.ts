import { Currency } from '@uniswap/sdk-core'
import { ChainId } from 'src/constants/chains'
import { WrappedTokenInfo } from 'src/features/tokenLists/wrappedTokenInfo'

const getTokenLogoURL = (address: string) =>
  `https://raw.githubusercontent.com/uniswap/assets/master/blockchains/ethereum/assets/${address}/logo.png`

export function getCurrencyLogoSrcs(currency: Currency) {
  if (!currency || currency.isNative) return []

  if (currency.isToken) {
    const defaultUrls =
      currency.chainId === ChainId.Mainnet ? [getTokenLogoURL(currency.address)] : []
    if (currency instanceof WrappedTokenInfo && currency.logoURI) {
      return [...defaultUrls, currency.logoURI]
    }
    return defaultUrls
  }
  return []
}

export function maybeReplaceIPFSScheme(uri: string) {
  return {
    uri: uri.includes('ipfs://')
      ? `https://cloudflare-ipfs.com/ipfs/${uri.replace('ipfs://', '')}`
      : uri,
  }
}
