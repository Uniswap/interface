import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PositionInfo } from 'uniswap/src/features/positions/types'
import { getChainUrlParam } from '~/utils/params/chainParams'

export function getPositionUrl(position: PositionInfo, options?: { entryPoint?: string }): string {
  const chainUrlParam = getChainUrlParam(position.chainId)
  let path: string
  if (position.version === ProtocolVersion.V2) {
    path = `/positions/v2/${chainUrlParam}/${position.liquidityToken.address}`
  } else if (position.version === ProtocolVersion.V3) {
    path = `/positions/v3/${chainUrlParam}/${position.tokenId}`
  } else {
    path = `/positions/v4/${chainUrlParam}/${position.tokenId}`
  }
  if (options?.entryPoint) {
    return `${path}?${new URLSearchParams({ entryPoint: options.entryPoint }).toString()}`
  }
  return path
}
