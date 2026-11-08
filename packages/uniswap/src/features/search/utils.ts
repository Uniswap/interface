import { UniverseChainId, Platform, getValidAddress } from '@universe/chains'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { buildCurrencyId, currencyIdToContractAddress } from 'uniswap/src/utils/currencyId'

export const BACKEND_NATIVE_CHAIN_ADDRESS_STRING = 'NATIVE'

/** True when the user search box looks like a token contract address (EVM or Solana), not a name/symbol. */
export function isAddressTokenSearchQuery(query: string | null | undefined): boolean {
  if (!query) {
    return false
  }
  const trimmed = query.trim()
  if (!trimmed) {
    return false
  }
  return (
    Boolean(getValidAddress({ address: trimmed, platform: Platform.EVM })) ||
    Boolean(getValidAddress({ address: trimmed, platform: Platform.SVM }))
  )
}

/**
 * Recognize explicit ENS names and subnames in token searches. Do not autocomplete
 * normal token names/symbols into ENS lookups: that would change ordinary searches
 * and could mislead users into selecting unrelated token addresses.
 */
export function getExplicitEnsTokenSearchName(query: string | null | undefined): string | null {
  const name = query?.trim()
  return name && /^(?:[^\s./#?]+\.)+eth$/i.test(name) ? name : null
}

export function tokenAddressOrNativeAddress(address: string, chainId: UniverseChainId): string | null {
  const nativeAddress = getNativeAddress(chainId)

  if (address !== BACKEND_NATIVE_CHAIN_ADDRESS_STRING && address !== nativeAddress) {
    return address
  }

  return currencyIdToContractAddress(buildCurrencyId(chainId, nativeAddress))
}
