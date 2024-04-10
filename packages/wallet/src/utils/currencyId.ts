import { Currency } from '@uniswap/sdk-core'
import { getNativeAddress, getWrappedNativeAddress } from 'wallet/src/constants/addresses'
import { ChainId, DEFAULT_NATIVE_ADDRESS } from 'wallet/src/constants/chains'
import { toSupportedChainId } from 'wallet/src/features/chains/utils'
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
  return buildCurrencyId(chainId, getNativeAddress(chainId))
}

export function buildWrappedNativeCurrencyId(chainId: ChainId): string {
  return buildCurrencyId(chainId, getWrappedNativeAddress(chainId))
}

export function areCurrencyIdsEqual(id1: CurrencyId, id2: CurrencyId): boolean {
  return id1.toLowerCase() === id2.toLowerCase()
}

export function currencyAddressForSwapQuote(currency: Currency): string {
  if (currency.isNative) {
    switch (currency.chainId) {
      case ChainId.Polygon: // fall through
      case ChainId.PolygonMumbai:
        return SwapRouterNativeAssets.MATIC
      case ChainId.Bnb:
        return SwapRouterNativeAssets.BNB
      default:
        return SwapRouterNativeAssets.ETH
    }
  }

  return currencyAddress(currency)
}

export function currencyAddress(currency: Currency): string {
  if (currency.isNative) {
    return getNativeAddress(currency.chainId)
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

export const isNativeCurrencyAddress = (chainId: ChainId, address: Maybe<Address>): boolean => {
  if (!address) {
    return true
  }

  return areAddressesEqual(address, getNativeAddress(chainId))
}

// Currency ids are formatted as `chainId-tokenaddress`
export function currencyIdToAddress(_currencyId: string): Address {
  const currencyIdParts = _currencyId.split('-')
  if (!currencyIdParts[1]) {
    throw new Error(`Invalid currencyId format: ${_currencyId}`)
  }
  return currencyIdParts[1]
}

function isPolygonChain(chainId: number): chainId is ChainId.Polygon | ChainId.PolygonMumbai {
  return chainId === ChainId.PolygonMumbai || chainId === ChainId.Polygon
}

// Similar to `currencyIdToAddress`, except native addresses are `null`.
export function currencyIdToGraphQLAddress(_currencyId?: string): Address | null {
  if (!_currencyId) {
    return null
  }

  const address = currencyIdToAddress(_currencyId)
  const chainId = currencyIdToChain(_currencyId)

  if (!chainId) {
    return null
  }

  // backend only expects `null` for the native asset, except Polygon
  if (isNativeCurrencyAddress(chainId, address) && !isPolygonChain(chainId)) {
    return null
  }

  return address.toLowerCase()
}

export function currencyIdToChain(_currencyId: string): ChainId | null {
  return toSupportedChainId(_currencyId.split('-')[0])
}

export function isDefaultNativeAddress(address: string): boolean {
  return areAddressesEqual(address, DEFAULT_NATIVE_ADDRESS)
}
