import { Currency } from '@uniswap/sdk-core'
import { getNativeAddress, getWrappedNativeAddress } from 'uniswap/src/constants/addresses'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { CurrencyId } from 'uniswap/src/types/currency'
import { areAddressesEqual, getValidAddress } from 'uniswap/src/utils/addresses'

export function currencyId(tradeableAsset: TradeableAsset): CurrencyId
export function currencyId(currency: Currency): CurrencyId
export function currencyId(currency: Currency | undefined): CurrencyId | undefined
export function currencyId(currencyOrTradeableAsset: Currency | TradeableAsset | undefined): CurrencyId | undefined {
  if (!currencyOrTradeableAsset) {
    return undefined
  }

  return buildCurrencyId(
    currencyOrTradeableAsset.chainId,
    'isNative' in currencyOrTradeableAsset
      ? currencyAddress(currencyOrTradeableAsset)
      : currencyOrTradeableAsset.address,
  )
}

export function buildCurrencyId(chainId: UniverseChainId, address: string): string {
  return `${chainId}-${address}`
}

/**
 * Checks if a currencyId is valid by checking the chainId and address.
 */
export function isCurrencyIdValid(_currencyId: CurrencyId): boolean {
  try {
    const [chainId, address] = _currencyId.split('-')
    const validAddress = getValidAddress(address)
    const validChainId = toSupportedChainId(chainId)
    return !!validChainId && !!validAddress
  } catch (error) {
    return false
  }
}

export function buildNativeCurrencyId(chainId: UniverseChainId): string {
  return buildCurrencyId(chainId, getNativeAddress(chainId))
}

export function buildWrappedNativeCurrencyId(chainId: UniverseChainId): string {
  return buildCurrencyId(chainId, getWrappedNativeAddress(chainId))
}

export function areCurrencyIdsEqual(id1: CurrencyId, id2: CurrencyId): boolean {
  return id1.toLowerCase() === id2.toLowerCase()
}

export function areCurrenciesEqual(currency1?: Currency, currency2?: Currency): boolean {
  if (!(currency1 && currency2)) {
    return currency1 === currency2
  }
  return areCurrencyIdsEqual(currencyId(currency1), currencyId(currency2))
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

export const isNativeCurrencyAddress = (chainId: UniverseChainId, address: Maybe<Address>): boolean => {
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

function isPolygonChain(chainId: number): chainId is UniverseChainId.Polygon {
  return chainId === UniverseChainId.Polygon
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

export function currencyIdToChain(_currencyId: string): UniverseChainId | null {
  return toSupportedChainId(_currencyId.split('-')[0])
}

export function isDefaultNativeAddress(address: string): boolean {
  return areAddressesEqual(address, DEFAULT_NATIVE_ADDRESS)
}
