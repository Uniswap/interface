import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { PositionInfo } from 'uniswap/src/features/positions/types'

export function getPositionUrl(position: PositionInfo, options?: { entryPoint?: string }): string {
  const chainUrlParam = getChainInfo(position.chainId).urlParam
  const params = new URLSearchParams()
  let path: string
  if (position.version === ProtocolVersion.V2) {
    path = `/positions/v2/${chainUrlParam}/${position.liquidityToken.address}`
  } else if (position.version === ProtocolVersion.V3) {
    path = `/positions/v3/${chainUrlParam}/${position.tokenId}`
  } else {
    path = `/positions/v4/${chainUrlParam}/${position.tokenId}`
    // tokenIds are only unique per position manager, so the detail page must know to query the PermPosm
    if (position.isPermissioned) {
      params.set('permissioned', 'true')
    }
  }
  if (options?.entryPoint) {
    params.set('entryPoint', options.entryPoint)
  }
  const query = params.toString()
  return query ? `${path}?${query}` : path
}
