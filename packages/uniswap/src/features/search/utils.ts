import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { buildCurrencyId, currencyIdToGraphQLAddress } from 'uniswap/src/utils/currencyId'

export const BACKEND_NATIVE_CHAIN_ADDRESS_STRING = 'NATIVE'

export function tokenAddressOrNativeAddress(address: string, chainId: UniverseChainId): string | null {
  if (address !== BACKEND_NATIVE_CHAIN_ADDRESS_STRING) {
    return address
  }

  const nativeAddress = getNativeAddress(chainId)
  return currencyIdToGraphQLAddress(buildCurrencyId(chainId, nativeAddress))
}
