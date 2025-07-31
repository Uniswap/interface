import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { PositionInfo } from 'components/Liquidity/types'
import { useMemo } from 'react'

export function usePositionCurrentPrice(positionInfo?: PositionInfo) {
  return useMemo(() => {
    if (positionInfo?.version === ProtocolVersion.V2) {
      return positionInfo.pair?.token1Price
    }

    return positionInfo?.pool?.token1Price
  }, [positionInfo])
}
