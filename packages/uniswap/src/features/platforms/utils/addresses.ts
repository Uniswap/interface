import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { PlatformAddress } from 'uniswap/src/features/platforms/types/PlatformSpecificAddress'
import { getValidAddress } from 'uniswap/src/utils/addresses'

/**
 * Validates a potential address string and returns a PlatformAddress with the detected platform.
 * Tries EVM validation first, then SVM.
 *
 * Note: getValidAddress already caches results internally, so wrapping this in useMemo at callsites
 * is unnecessary unless you need reference stability for the returned object.
 */
export function getPlatformAddress(potentialAddress: string | undefined): PlatformAddress | undefined {
  if (!potentialAddress) {
    return undefined
  }

  const evmAddress = getValidAddress({
    address: potentialAddress,
    platform: Platform.EVM,
    withEVMChecksum: true,
  })
  if (evmAddress) {
    return { address: evmAddress, platform: Platform.EVM }
  }

  const svmAddress = getValidAddress({
    address: potentialAddress,
    platform: Platform.SVM,
  })
  if (svmAddress) {
    return { address: svmAddress, platform: Platform.SVM }
  }

  return undefined
}
