import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { SUPPORTED_V2POOL_CHAIN_IDS } from '~/hooks/useNetworkSupportsV2'
import { isV4UnsupportedChain } from '~/utils/networkSupportsV4'

export function isUnsupportedLPChain(chainId: UniverseChainId | undefined, protocolVersion: ProtocolVersion): boolean {
  if (chainId && isSVMChain(chainId)) {
    return true
  }

  if (protocolVersion === ProtocolVersion.V2) {
    return Boolean(chainId && !SUPPORTED_V2POOL_CHAIN_IDS.includes(chainId))
  }

  if (protocolVersion === ProtocolVersion.V4) {
    return isV4UnsupportedChain(chainId)
  }

  return false
}
