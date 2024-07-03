import { Currency } from '@uniswap/sdk-core'
import { getNativeAddress, getWrappedNativeAddress } from 'uniswap/src/constants/addresses'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/constants/chains'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'
import { CurrencyId } from 'uniswap/src/types/currency'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'

export function currencyId(currency: Currency): CurrencyId {
  return buildCurrencyId(currency.chainId, currencyAddress(currency))
}

export function buildCurrencyId(chainId: WalletChainId, address: string): string {
  return `${chainId}-${address}`
}

export function buildNativeCurrencyId(chainId: WalletChainId): string {
  return buildCurrencyId(chainId, getNativeAddress(chainId))
}

export function buildWrappedNativeCurrencyId(chainId: WalletChainId): string {
  return buildCurrencyId(chainId, getWrappedNativeAddress(chainId))
}

export function areCurrencyIdsEqual(id1: CurrencyId, id2: CurrencyId): boolean {
  return id1.toLowerCase() === id2.toLowerCase()
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

export const isNativeCurrencyAddress = (chainId: WalletChainId, address: Maybe<Address>): boolean => {
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

function isPolygonChain(chainId: number): chainId is UniverseChainId.Polygon | UniverseChainId.PolygonMumbai {
  return chainId === UniverseChainId.PolygonMumbai || chainId === UniverseChainId.Polygon
}

function isCeloChain(chainId: number): chainId is UniverseChainId.Celo {
  return chainId === UniverseChainId.Celo
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

  // backend only expects `null` for the native asset, except Polygon & Celo
  if (isNativeCurrencyAddress(chainId, address) && !isPolygonChain(chainId) && !isCeloChain(chainId)) {
    return null
  }

  return address.toLowerCase()
}

export function currencyIdToChain(_currencyId: string): WalletChainId | null {
  return toSupportedChainId(_currencyId.split('-')[0])
}

export function isDefaultNativeAddress(address: string): boolean {
  return areAddressesEqual(address, DEFAULT_NATIVE_ADDRESS)
}
