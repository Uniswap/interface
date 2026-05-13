import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useMemo } from 'react'
import { PositionInfo } from 'uniswap/src/features/positions/types'
import { MigratingPosition } from '~/features/Liquidity/Create/types'
import { unwrappedToken } from '~/utils/unwrappedToken'

export function useMigratingPosition(positionInfo?: PositionInfo): MigratingPosition | undefined {
  return useMemo(() => {
    if (!positionInfo) {
      return undefined
    }

    if (positionInfo.version !== ProtocolVersion.V3) {
      return undefined
    }

    if (!positionInfo.poolOrPair) {
      return undefined
    }

    const tickLower = Number(positionInfo.tickLower)
    const tickUpper = Number(positionInfo.tickUpper)

    const shouldFlip = unwrappedToken(positionInfo.poolOrPair.token1).isNative

    return {
      fee: {
        feeAmount: positionInfo.poolOrPair.fee,
        tickSpacing: positionInfo.poolOrPair.tickSpacing,
        isDynamic: false,
      },
      tickLower: shouldFlip ? -tickUpper : tickLower,
      tickUpper: shouldFlip ? -tickLower : tickUpper,
      isOutOfRange: positionInfo.status === PositionStatus.OUT_OF_RANGE,
    }
  }, [positionInfo])
}
