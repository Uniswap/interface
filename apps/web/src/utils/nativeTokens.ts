import type { UniverseChainId } from '@universe/chains'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'

export function getNativeTokenDBAddress(chainId: UniverseChainId): string | undefined {
  return getChainInfo(chainId).backendChain.nativeTokenBackendAddress
}
