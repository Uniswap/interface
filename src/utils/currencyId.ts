import { Currency } from '@uniswap/sdk-core'
import { NATIVE_ADDRESS, NATIVE_ADDRESS_ALT } from 'src/constants/addresses'
import { ChainId, isPolygonChain } from 'src/constants/chains'
import { areAddressesEqual, getChecksumAddress } from 'src/utils/addresses'
import { toSupportedChainId } from 'src/utils/chainId'

export type CurrencyId = string

// swap router API special cases these strings to represent native currencies
// all chains have "ETH" as native currency symbol except for polygon
export enum SwapRouterNativeAssets {
  MATIC = 'MATIC',
  ETH = 'ETH',
}

export function currencyId(currency: Currency): CurrencyId {
  return buildCurrencyId(currency.chainId, currencyAddress(currency))
}

export function buildCurrencyId(chainId: ChainId, address: string) {
  return `${chainId}-${address}`
}

export function buildNativeCurrencyId(chainId: ChainId) {
  const nativeAddress = getNativeCurrencyAddressForChain(chainId)
  return buildCurrencyId(chainId, nativeAddress)
}

export function currencyAddressForSwapQuote(currency: Currency): string {
  if (currency.isNative) {
    return isPolygonChain(currency.chainId)
      ? SwapRouterNativeAssets.MATIC
      : SwapRouterNativeAssets.ETH
  }

  return currencyAddress(currency)
}

export function currencyAddress(currency: Currency): string {
  if (currency.isNative) {
    return getNativeCurrencyAddressForChain(currency.chainId)
  }
  if (currency.isToken) return currency.address
  throw new Error('invalid currency')
}

export function getNativeCurrencyAddressForChain(chainId: ChainId) {
  if (chainId === ChainId.Polygon) return NATIVE_ADDRESS_ALT

  return NATIVE_ADDRESS
}

export function graphQLCurrencyInfo(currency: Currency): {
  address: string | null
  chain: ChainId
} {
  let address: string | null = currencyAddress(currency)
  let chain = currency.chainId
  // hard-coded edge cases begin here
  if (currency.isNative) {
    if (chain === ChainId.Mainnet) {
      // for mainnet eth, send a null address to data API
      address = null
    } else if (chain === ChainId.Optimism || chain === ChainId.ArbitrumOne) {
      // for L2s that use eth as native currency, use mainnet eth data
      address = null
      chain = ChainId.Mainnet
    }
  }
  return { address, chain }
}

export const isNativeCurrencyAddress = (address: Address) =>
  areAddressesEqual(address, NATIVE_ADDRESS) || areAddressesEqual(address, NATIVE_ADDRESS_ALT)

// Currency ids are formatted as `chainId-tokenaddress`
export function currencyIdToAddress(_currencyId: string): Address {
  return _currencyId.split('-')[1]
}

export function currencyIdToChain(_currencyId?: string): ChainId | null {
  if (!_currencyId) return null
  return toSupportedChainId(_currencyId.split('-')[0])
}

export function checksumCurrencyId(_currencyId: string) {
  return buildCurrencyId(
    currencyIdToChain(_currencyId) ?? ChainId.Mainnet,
    getChecksumAddress(currencyIdToAddress(_currencyId))
  )
}
