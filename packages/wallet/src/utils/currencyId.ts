import { Currency } from '@uniswap/sdk-core'
import {
  NATIVE_ADDRESS,
  NATIVE_ADDRESS_ALT,
  WRAPPED_BASE_ADDRESSES,
} from 'wallet/src/constants/addresses'
import { ChainId } from 'wallet/src/constants/chains'
import { isPolygonChain, toSupportedChainId } from 'wallet/src/features/chains/utils'
import { areAddressesEqual } from './addresses'

export type CurrencyId = string

// swap router API special cases these strings to represent native currencies
// all chains have "ETH" as native currency symbol except for polygon and bnb
export enum SwapRouterNativeAssets {
  MATIC = 'MATIC',
  BNB = 'BNB',
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

export function buildWrappedNativeCurrencyId(chainId: ChainId): string {
  const nativeAddress = WRAPPED_BASE_ADDRESSES[chainId]
  return buildCurrencyId(chainId, nativeAddress)
}

export function areCurrencyIdsEqual(id1: CurrencyId, id2: CurrencyId): boolean {
  return id1.toLowerCase() === id2.toLowerCase()
}

export function currencyAddressForSwapQuote(currency: Currency): string {
  if (currency.isNative) {
    return isPolygonChain(currency.chainId)
      ? SwapRouterNativeAssets.MATIC
      : currency.chainId === ChainId.Bnb
      ? SwapRouterNativeAssets.BNB
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

export const isNativeCurrencyAddress = (chainId: ChainId, address: Maybe<Address>): boolean => {
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
