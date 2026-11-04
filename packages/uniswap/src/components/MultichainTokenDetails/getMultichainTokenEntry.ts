import type { UniverseChainId } from '@universe/chains'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'

/** Converts one (chainId, address) entry from a v2 MultichainToken's `addresses` map into the shared multichain entry shape. */
export function getRestMultichainTokenEntry(
  deployment: { chainIdKey: string; address: string },
  allowedChainIds: readonly UniverseChainId[],
): MultichainTokenEntry | undefined {
  const chainIdNumber = Number(deployment.chainIdKey)
  if (!allowedChainIds.includes(chainIdNumber as UniverseChainId)) {
    return undefined
  }
  const chainId = chainIdNumber as UniverseChainId

  const rawAddress = deployment.address
  const isNative = !rawAddress || isNativeCurrencyAddress(chainId, rawAddress)

  return {
    chainId,
    address: isNative ? getNativeAddress(chainId) : rawAddress,
    isNative,
  }
}
