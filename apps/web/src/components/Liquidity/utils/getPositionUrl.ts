import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { PositionInfo } from 'components/Liquidity/types'
import { getChainUrlParam } from 'utils/chainParams'

export function getPositionUrl(position: PositionInfo): string {
  const chainUrlParam = getChainUrlParam(position.chainId)
  if (position.version === ProtocolVersion.V2) {
    return `/positions/v2/${chainUrlParam}/${position.liquidityToken.address}`
  } else if (position.version === ProtocolVersion.V3) {
    return `/positions/v3/${chainUrlParam}/${position.tokenId}`
  }
  return `/positions/v4/${chainUrlParam}/${position.tokenId}`
}
