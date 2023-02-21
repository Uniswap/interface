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

export function buildCurrencyId(chainId: ChainId, address: string): string {
  return `${chainId}-${address}`
}

export function buildNativeCurrencyId(chainId: ChainId): string {
  const nativeAddress = getNativeCurrencyAddressForChain(chainId)
  return buildCurrencyId(chainId, nativeAddress)
}

export function areCurrencyIdsEqual(id1: CurrencyId, id2: CurrencyId): boolean {
  return id1.toLowerCase() === id2.toLowerCase()
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

  return currency.address
}

export const NATIVE_ANALYTICS_ADDRESS_VALUE = 'NATIVE'

export function getCurrencyAddressForAnalytics(currency: Currency): string {
  if (currency.isNative) {
    return NATIVE_ANALYTICS_ADDRESS_VALUE
  }

  return currency.address
}

export function getNativeCurrencyAddressForChain(chainId: ChainId): string {
  if (isPolygonChain(chainId)) return NATIVE_ADDRESS_ALT

  return NATIVE_ADDRESS
}

export const isNativeCurrencyAddress = (
  chainId: ChainId,
  address: NullUndefined<Address>
): boolean => {
  if (!address) return true

  return isPolygonChain(chainId)
    ? areAddressesEqual(address, NATIVE_ADDRESS_ALT)
    : areAddressesEqual(address, NATIVE_ADDRESS)
}

// Currency ids are formatted as `chainId-tokenaddress`
export function currencyIdToAddress(_currencyId: string): Address {
  const currencyIdParts = _currencyId.split('-')
  if (!currencyIdParts[1]) throw new Error(`Invalid currencyId format: ${_currencyId}`)
  return currencyIdParts[1]
}

// Similar to `currencyIdToAddress`, except native addresses are `null`.
export function currencyIdToGraphQLAddress(_currencyId?: string): Address | null {
  if (!_currencyId) return null

  const address = currencyIdToAddress(_currencyId)

  // backend only expects `null` when address is `NATIVE_ADDRESS`,
  // but not for Polygon's NATIVE_ADDRESS_ALT
  if (areAddressesEqual(address, NATIVE_ADDRESS)) {
    return null
  }

  return address.toLowerCase()
}

export function currencyIdToChain(_currencyId?: string): ChainId | null {
  if (!_currencyId) return null
  return toSupportedChainId(_currencyId.split('-')[0])
}

export function checksumCurrencyId(_currencyId: string): string {
  return buildCurrencyId(
    currencyIdToChain(_currencyId) ?? ChainId.Mainnet,
    getChecksumAddress(currencyIdToAddress(_currencyId))
  )
}
