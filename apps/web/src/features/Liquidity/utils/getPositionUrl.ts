import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PositionInfo } from 'uniswap/src/features/positions/types'
import { getChainUrlParam } from '~/utils/params/chainParams'

export function getPositionUrl(position: PositionInfo): string {
  const chainUrlParam = getChainUrlParam(position.chainId)
  if (position.version === ProtocolVersion.V2) {
    return `/positions/v2/${chainUrlParam}/${position.liquidityToken.address}`
  } else if (position.version === ProtocolVersion.V3) {
    return `/positions/v3/${chainUrlParam}/${position.tokenId}`
  }
  return `/positions/v4/${chainUrlParam}/${position.tokenId}`
}
