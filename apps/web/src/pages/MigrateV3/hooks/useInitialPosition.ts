import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { PositionInfo } from 'components/Liquidity/types'
import { useMemo } from 'react'
import { unwrappedToken } from 'utils/unwrappedToken'

export default function useInitialPosition(positionInfo?: PositionInfo) {
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
