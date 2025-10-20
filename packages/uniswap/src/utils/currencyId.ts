import { Currency } from '@uniswap/sdk-core'
import { getNativeAddress, getWrappedNativeAddress } from 'uniswap/src/constants/addresses'
import { normalizeCurrencyIdForMapLookup, normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { DEFAULT_NATIVE_ADDRESS, DEFAULT_NATIVE_ADDRESS_LEGACY } from 'uniswap/src/features/chains/evm/defaults'
import { DEFAULT_NATIVE_ADDRESS_SOLANA } from 'uniswap/src/features/chains/svm/defaults'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { CurrencyId } from 'uniswap/src/types/currency'
import { areAddressesEqual, getValidAddress } from 'uniswap/src/utils/addresses'

export function currencyId(tradeableAsset: TradeableAsset): CurrencyId
export function currencyId(currency: Currency): CurrencyId
export function currencyId(currency: Currency | undefined): CurrencyId | undefined
export function currencyId(currency: Maybe<Currency>): CurrencyId | undefined
export function currencyId(
  currencyOrTradeableAsset: Maybe<Currency> | TradeableAsset | undefined,
): CurrencyId | undefined {
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
    const validChainId = toSupportedChainId(chainId)
    if (!validChainId) {
      return false
    }
    const validAddress = getValidAddress({ address, chainId: validChainId })

    return !!validAddress
  } catch (_error) {
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
  return normalizeCurrencyIdForMapLookup(id1) === normalizeCurrencyIdForMapLookup(id2)
}

export function areCurrenciesEqual(currency1?: Maybe<Currency>, currency2?: Maybe<Currency>): boolean {
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
  const chainInfo = getChainInfo(chainId)
  const { platform } = chainInfo
  // sometimes the native token symbol is returned as the native token address
  if (address === chainInfo.nativeCurrency.symbol) {
    return true
  }

  const nativeAddress = getNativeAddress(chainId)

  if (isSVMChain(chainId)) {
    // For Solana, only consider DEFAULT_NATIVE_ADDRESS_SOLANA (11111...) as native
    // WSOL (So111...) should be treated as a regular token, not native
    return areAddressesEqual({
      addressInput1: { address, platform },
      addressInput2: { address: DEFAULT_NATIVE_ADDRESS_SOLANA, platform },
    })
  }

  // allow both native address formats until all backend endpoints return the new one
  if (nativeAddress === DEFAULT_NATIVE_ADDRESS_LEGACY) {
    return (
      areAddressesEqual({
        addressInput1: { address, platform },
        addressInput2: { address: nativeAddress, platform },
      }) ||
      areAddressesEqual({
        addressInput1: { address, platform },
        addressInput2: { address: DEFAULT_NATIVE_ADDRESS, platform },
      })
    )
  }
  return areAddressesEqual({
    addressInput1: { address, platform },
    addressInput2: { address: nativeAddress, platform },
  })
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

  return normalizeTokenAddressForCache(address)
}

export function currencyIdToChain(_currencyId: string): UniverseChainId | null {
  return toSupportedChainId(_currencyId.split('-')[0])
}

export function isDefaultNativeAddress({ address, platform }: { address: string; platform: Platform }): boolean {
  return areAddressesEqual({
    addressInput1: { address, platform },
    addressInput2: { address: DEFAULT_NATIVE_ADDRESS_LEGACY, platform },
  })
}
