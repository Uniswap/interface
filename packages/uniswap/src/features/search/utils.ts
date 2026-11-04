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

export function tokenAddressOrNativeAddress(address: string, chainId: UniverseChainId): string | null {
  const nativeAddress = getNativeAddress(chainId)

  if (address !== BACKEND_NATIVE_CHAIN_ADDRESS_STRING && address !== nativeAddress) {
    return address
  }

  return currencyIdToContractAddress(buildCurrencyId(chainId, nativeAddress))
}
